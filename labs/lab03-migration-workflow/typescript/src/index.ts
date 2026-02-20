/**
 * Migration Workflow Agent - Hono API Application
 */

import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { serve } from '@hono/node-server';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { MigrationAgent } from './agent.js';
import { createInitialState } from './state.js';
import { getLLMClient, type LLMProvider } from './llm-client.js';
import { MigrationRequestSchema, MigrateChatRequestSchema, type MigrationResponse } from './types.js';
import { parseMigrationRequest } from './parse-migration-request.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isVercel = process.env.VERCEL === '1';

const app = new Hono();

// CORS middleware
app.use('/*', cors());

// Initialize LLM client
const provider = (process.env.LLM_PROVIDER || 'anthropic') as LLMProvider;
const llm = getLLMClient(provider);

/**
 * Run migration workflow
 */
app.post('/migrate', zValidator('json', MigrationRequestSchema), async (c) => {
  try {
    const { source_framework, target_framework, files } = c.req.valid('json');

    const agent = new MigrationAgent(llm);
    const initialState = createInitialState(
      source_framework,
      target_framework,
      files
    );

    const result = await agent.run(initialState);

    const response: MigrationResponse = {
      success: result.errors.length === 0,
      migrated_files: result.migratedFiles,
      plan_executed: result.plan.map((s) => ({
        id: s.id,
        description: s.description,
        status: s.status,
      })),
      verification: result.verificationResult || {},
      errors: result.errors,
    };

    return c.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

/**
 * Migration chat: free-form message + optional code -> parse with LLM, run migration, return summary
 */
app.post('/migrate/chat', zValidator('json', MigrateChatRequestSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    const parsed = await parseMigrationRequest(llm, body);

    const agent = new MigrationAgent(llm);
    const initialState = createInitialState(
      parsed.source_framework,
      parsed.target_framework,
      parsed.files
    );
    const result = await agent.run(initialState);

    const lines: string[] = [];
    if (result.errors.length === 0) {
      lines.push('**Migration completed successfully.**');
    } else {
      lines.push('**Migration finished with errors.**');
    }
    lines.push('');
    lines.push('**Plan executed:**');
    for (const step of result.plan) {
      lines.push(`- ${step.description}: ${step.status}`);
    }
    lines.push('');
    lines.push(`**Migrated files:** ${Object.keys(result.migratedFiles).join(', ') || '(none)'}`);
    if (result.errors.length > 0) {
      lines.push('');
      lines.push('**Errors:**');
      result.errors.forEach((e) => lines.push(`- ${e}`));
    }
    if (Object.keys(result.migratedFiles).length > 0) {
      lines.push('');
      lines.push('---');
      for (const [filename, code] of Object.entries(result.migratedFiles)) {
        lines.push(`\n**${filename}**\n\`\`\`\n${code}\n\`\`\``);
      }
    }
    const content = lines.join('\n');

    return c.json({
      content,
      migrated_files: result.migratedFiles,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isParseError =
      message.includes('Could not parse') ||
      message.includes('Unsupported framework') ||
      message.includes('No source files');
    return c.json({ error: message }, isParseError ? 400 : 500);
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (c) => {
  return c.json({ status: 'healthy', provider });
});

/**
 * List supported frameworks
 */
app.get('/frameworks', (c) => {
  return c.json({
    supported: [
      { name: 'express', language: 'javascript' },
      { name: 'fastapi', language: 'python' },
      { name: 'flask', language: 'python' },
      { name: 'django', language: 'python' },
      { name: 'nestjs', language: 'typescript' },
      { name: 'hono', language: 'typescript' },
    ],
  });
});

// Static files: always register so root and assets work (local and Vercel serverless)
const publicDir = join(__dirname, '..', 'public');
app.get('/', (c) => {
  try {
    const html = readFileSync(join(publicDir, 'index.html'), 'utf-8');
    return c.html(html);
  } catch {
    return c.text('Chat UI not found', 404);
  }
});
app.get('/app.js', (c) => {
  try {
    const js = readFileSync(join(publicDir, 'app.js'), 'utf-8');
    return new Response(js, {
      status: 200,
      headers: { 'Content-Type': 'application/javascript' },
    });
  } catch {
    return c.text('Not found', 404);
  }
});
app.get('/styles.css', (c) => {
  try {
    const css = readFileSync(join(publicDir, 'styles.css'), 'utf-8');
    return new Response(css, {
      status: 200,
      headers: { 'Content-Type': 'text/css' },
    });
  } catch {
    return c.text('Not found', 404);
  }
});

const port = parseInt(process.env.PORT || '8000', 10);

if (!isVercel) {
  console.log(`Migration Workflow Agent starting on port ${port}...`);
  console.log(`Using LLM provider: ${provider}`);
  serve({
    fetch: app.fetch,
    port,
  });
}

export default app;
