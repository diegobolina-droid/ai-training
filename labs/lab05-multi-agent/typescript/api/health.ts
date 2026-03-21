/**
 * Lightweight health check — no import of the full Hono / supervisor graph.
 */

export default function handler(_req: Request): Response {
  return Response.json({
    status: 'healthy',
    provider: process.env.LLM_PROVIDER ?? 'anthropic',
  });
}
