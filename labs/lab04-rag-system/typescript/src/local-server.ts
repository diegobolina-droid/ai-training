/**
 * Local development server: static UI + Node HTTP listener.
 * On Vercel, use `src/index.ts` default export only; static files come from `public/` on the CDN.
 *
 * Not named `server.ts`: that path is a Vercel Hono entry candidate and must not shadow `index.ts`.
 */

import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';

import { app } from './rag-app.js';

app.use('/*', serveStatic({ root: './public' }));

const port = parseInt(process.env.PORT || '8000', 10);
const provider = process.env.LLM_PROVIDER || 'anthropic';

console.log(`RAG System starting on port ${port}...`);
console.log(`Using LLM provider: ${provider}`);

serve({
  fetch: app.fetch,
  port,
});
