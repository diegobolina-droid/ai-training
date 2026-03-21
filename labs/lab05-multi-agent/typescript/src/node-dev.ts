/**
 * Local development: `/api/*` is served by the Hono app (basePath `/api`);
 * other paths use static files from public/.
 */

import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';

import { app } from './app.js';

const root = new Hono();

root.use(async (c, next) => {
  const p = new URL(c.req.url).pathname;
  if (p === '/api' || p.startsWith('/api/')) {
    return app.fetch(c.req.raw);
  }
  await next();
});

root.use('/*', serveStatic({ root: './public' }));

const port = parseInt(process.env.PORT || '8000', 10);

console.log(`Multi-Agent System starting on port ${port}...`);
console.log(`Using LLM provider: ${process.env.LLM_PROVIDER || 'anthropic'}`);

serve({
  fetch: root.fetch,
  port,
});
