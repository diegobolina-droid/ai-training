/**
 * Catch-all for `/api/run`, `/api/run/start`, memory routes, etc.
 * Lazy-loads `src/app.ts` so cold starts for other `api/*.ts` routes stay cheap.
 */

import type { Hono } from 'hono';

let appInstance: Hono | undefined;

export default async function handler(req: Request): Promise<Response> {
  if (!appInstance) {
    const m = await import('../src/app.js');
    appInstance = m.app as Hono;
  }
  return appInstance.fetch(req);
}
