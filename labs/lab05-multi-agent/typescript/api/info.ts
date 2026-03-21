/**
 * Lightweight handler — does not import `src/app.ts` (avoids loading the LLM
 * stack on cold start). Vercel matches this before `api/[...path].ts`.
 */

export default function handler(_req: Request): Response {
  return Response.json({
    provider: process.env.LLM_PROVIDER ?? 'anthropic',
  });
}
