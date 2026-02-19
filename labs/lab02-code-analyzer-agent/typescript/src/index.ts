/**
 * Code Analyzer Agent - Hono API Application
 */

import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { serve } from '@hono/node-server';

import { CodeAnalyzer } from './analyzer.js';
import { getLLMClient, type LLMProvider } from './llm-client.js';
import {
  AnalyzeRequestSchema,
  ChatRequestSchema,
  type AnalysisResult,
} from './types.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const app = new Hono();

// CORS middleware
app.use('/*', cors());

// Initialize analyzer with configured provider
const provider = (process.env.LLM_PROVIDER || 'anthropic') as LLMProvider;
const llm = getLLMClient(provider);
const analyzer = new CodeAnalyzer(llm);

/**
 * Analyze code and return structured feedback
 */
app.post('/analyze', zValidator('json', AnalyzeRequestSchema), async (c) => {
  try {
    const { code, language } = c.req.valid('json');
    const result: AnalysisResult = await analyzer.analyze(code, language);
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

/**
 * Security-focused code analysis
 */
app.post(
  '/analyze/security',
  zValidator('json', AnalyzeRequestSchema),
  async (c) => {
    try {
      const { code, language } = c.req.valid('json');
      const result: AnalysisResult = await analyzer.analyzeSecurity(
        code,
        language
      );
      return c.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ error: message }, 500);
    }
  }
);

/**
 * Performance-focused code analysis
 */
app.post(
  '/analyze/performance',
  zValidator('json', AnalyzeRequestSchema),
  async (c) => {
    try {
      const { code, language } = c.req.valid('json');
      const result: AnalysisResult = await analyzer.analyzePerformance(
        code,
        language
      );
      return c.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ error: message }, 500);
    }
  }
);

/**
 * Health check endpoint
 */
app.get('/health', (c) => {
  return c.json({ status: 'healthy', provider });
});

/**
 * Chat with LLM (messages in, assistant reply out)
 */
app.post('/chat', zValidator('json', ChatRequestSchema), async (c) => {
  try {
    let { messages } = c.req.valid('json');
    const systemPrompt = process.env.CHAT_SYSTEM_PROMPT;
    if (systemPrompt?.trim()) {
      messages = [{ role: 'system' as const, content: systemPrompt.trim() }, ...messages];
    }
    const content = await llm.chat(messages);
    return c.json({ content });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

/**
 * Chat UI - serve static files (works with Vercel: use process.cwd() when public not next to dist)
 */
function getPublicPath(filename: string): string {
  const fromCwd = join(process.cwd(), 'public', filename);
  try {
    readFileSync(fromCwd);
    return fromCwd;
  } catch {
    const fromDir = join(publicDir, filename);
    readFileSync(fromDir);
    return fromDir;
  }
}

app.get('/', (c) => {
  try {
    const html = readFileSync(getPublicPath('index.html'), 'utf-8');
    return c.html(html);
  } catch {
    return c.json({ error: 'Chat UI not found' }, 404);
  }
});

app.get('/app.js', (c) => {
  try {
    const js = readFileSync(getPublicPath('app.js'), 'utf-8');
    return c.body(js, 200, {
      'Content-Type': 'application/javascript; charset=utf-8',
    });
  } catch {
    return c.json({ error: 'Not found' }, 404);
  }
});

app.get('/styles.css', (c) => {
  try {
    const css = readFileSync(getPublicPath('styles.css'), 'utf-8');
    return c.body(css, 200, {
      'Content-Type': 'text/css; charset=utf-8',
    });
  } catch {
    return c.json({ error: 'Not found' }, 404);
  }
});

// Start server only when not on Vercel
const port = parseInt(process.env.PORT || '8000', 10);

if (process.env.VERCEL !== '1') {
  console.log(`Code Analyzer Agent starting on port ${port}...`);
  console.log(`Using LLM provider: ${provider}`);
  serve({
    fetch: app.fetch,
    port,
  });
}

export default app;
