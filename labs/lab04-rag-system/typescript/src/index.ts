/**
 * Vercel Hono entry: must default-export the app and import `hono` in this file (framework detection).
 * See `rag-app.ts` for why that file is not named `app.ts`.
 */
import { Hono } from 'hono';

import { app } from './rag-app.js';

if (!(app instanceof Hono)) {
  throw new Error('Expected Hono instance from rag-app');
}

export const maxDuration = 60;

export default app;
