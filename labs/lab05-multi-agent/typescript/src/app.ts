/**
 * Hono application (used by Vercel serverless and local dev server).
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { SupervisorAgent } from './supervisor.js';
import { getLLMClient, type LLMProvider } from './llm-client.js';
import {
  appendSessionMemory,
  clearSessionMemory,
  readSessionMemory,
} from './memory-store.js';
import {
  createSession,
  deleteSession,
  getSession,
  touchSession,
} from './run-sessions.js';

/**
 * All HTTP routes are under `/api/...` so Vercel’s `api/[...path].ts` catch-all
 * matches multi-segment paths like `/api/run/start` reliably (no URL rewriting).
 */
export const app = new Hono().basePath('/api');

app.use('/*', cors());

const provider = (process.env.LLM_PROVIDER || 'anthropic') as LLMProvider;
const llm = getLLMClient(provider);
const supervisor = new SupervisorAgent(llm);

function llmEnvError(c: Context): Response | undefined {
  if (provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY?.trim()) {
    return c.json(
      {
        error:
          'ANTHROPIC_API_KEY is not set. Add it in the Vercel project Environment Variables.',
      },
      503
    );
  }
  if (provider === 'openai' && !process.env.OPENAI_API_KEY?.trim()) {
    return c.json(
      {
        error:
          'OPENAI_API_KEY is not set. Add it in the Vercel project Environment Variables.',
      },
      503
    );
  }
  return undefined;
}

const TaskRequestSchema = z.object({
  task: z.string().min(1),
  max_iterations: z.number().int().min(1).max(10).default(5),
  session_id: z.string().min(1).max(128).optional(),
});

const RunStartSchema = z.object({
  task: z.string().min(1),
  max_iterations: z.number().int().min(1).max(10).default(5),
  hitl: z.boolean().default(false),
  session_id: z.string().min(1).max(128).optional(),
});

const ResumeSchema = z.object({
  action: z.enum(['approve', 'reject', 'edit']),
  feedback: z.string().optional(),
  edited_tasks: z.record(z.string()).optional(),
});

async function runWithOptionalMemory(
  task: string,
  maxIterations: number,
  sessionId?: string
) {
  const memoryContext =
    sessionId != null && sessionId.length > 0
      ? await readSessionMemory(sessionId)
      : undefined;
  const result = await supervisor.run(task, maxIterations, { memoryContext });
  if (sessionId != null && sessionId.length > 0 && result.result) {
    await appendSessionMemory(sessionId, result.result);
  }
  return result;
}

app.post('/run', zValidator('json', TaskRequestSchema), async (c) => {
  try {
    const envErr = llmEnvError(c);
    if (envErr) {
      return envErr;
    }
    const { task, max_iterations, session_id } = c.req.valid('json');
    const result = await runWithOptionalMemory(task, max_iterations, session_id);

    return c.json({
      result: result.result,
      steps_taken: result.stepsTaken,
      trace: result.trace,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

app.post('/run/start', zValidator('json', RunStartSchema), async (c) => {
  try {
    const envErr = llmEnvError(c);
    if (envErr) {
      return envErr;
    }
    const { task, max_iterations, hitl, session_id } = c.req.valid('json');
    const memoryContext =
      session_id != null && session_id.length > 0
        ? await readSessionMemory(session_id)
        : undefined;

    if (!hitl) {
      const result = await runWithOptionalMemory(
        task,
        max_iterations,
        session_id
      );
      return c.json({
        status: 'completed',
        result: result.result,
        steps_taken: result.stepsTaken,
        trace: result.trace,
      });
    }

    const state = supervisor.createRunState(task, max_iterations, {
      hitl: true,
      memoryContext,
    });
    const stored = createSession(state, {
      sessionId:
        session_id != null && session_id.length > 0 ? session_id : undefined,
    });
    const out = await supervisor.continueRun(stored.state);

    if (out.status === 'completed') {
      deleteSession(stored.id);
      const sid = stored.sessionId;
      if (sid != null && sid.length > 0 && out.result) {
        await appendSessionMemory(sid, out.result);
      }
      return c.json({
        status: 'completed',
        run_id: stored.id,
        result: out.result,
        steps_taken: out.stepsTaken,
        trace: out.trace,
      });
    }

    touchSession(stored.id);
    return c.json({
      status: 'awaiting_approval',
      run_id: stored.id,
      pending: out.pending,
      steps_taken: out.stepsTaken,
      trace: out.trace,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

app.post('/run/:id/resume', zValidator('json', ResumeSchema), async (c) => {
  try {
    const envErr = llmEnvError(c);
    if (envErr) {
      return envErr;
    }
    const id = c.req.param('id');
    const body = c.req.valid('json');
    const stored = getSession(id);
    if (!stored) {
      return c.json({ error: 'Run not found or expired' }, 404);
    }
    touchSession(id);

    const pending = stored.state.pendingDelegations;
    if (!pending || pending.length === 0) {
      return c.json({ error: 'No pending delegation for this run' }, 400);
    }

    switch (body.action) {
      case 'approve':
        await supervisor.executePendingDelegations(stored.state, pending);
        break;
      case 'edit': {
        const merged = pending.map((d) => ({
          ...d,
          task: body.edited_tasks?.[d.agent] ?? d.task,
        }));
        await supervisor.executePendingDelegations(stored.state, merged);
        break;
      }
      case 'reject': {
        const fb = body.feedback ?? '(none)';
        stored.state.messages.push({
          role: 'user',
          content: `Human rejected the proposed delegation plan. Feedback: ${fb}`,
        });
        stored.state.pendingDelegations = undefined;
        break;
      }
      default:
        return c.json({ error: 'Invalid action' }, 400);
    }

    const out = await supervisor.continueRun(stored.state);

    if (out.status === 'completed') {
      const sid = stored.sessionId;
      deleteSession(id);
      if (sid != null && sid.length > 0 && out.result) {
        await appendSessionMemory(sid, out.result);
      }
      return c.json({
        status: 'completed',
        result: out.result,
        steps_taken: out.stepsTaken,
        trace: out.trace,
      });
    }

    return c.json({
      status: 'awaiting_approval',
      run_id: id,
      pending: out.pending,
      steps_taken: out.stepsTaken,
      trace: out.trace,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

app.get('/memory/:sessionId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    const text = await readSessionMemory(sessionId);
    return c.json({ session_id: sessionId, memory: text });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

app.delete('/memory/:sessionId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    await clearSessionMemory(sessionId);
    return c.json({ ok: true, session_id: sessionId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

app.get('/info', (c) => {
  return c.json({ provider });
});

app.get('/health', (c) => {
  return c.json({ status: 'healthy', provider });
});
