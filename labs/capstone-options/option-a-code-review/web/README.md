# AI Code Review — web UI

React + TypeScript (Vite) front end for the Capstone Option A API. Types are generated from the committed OpenAPI document in the Python service.

## Prerequisites

- Node 18+
- API running locally (default `http://127.0.0.1:8000`) — see [../python/README.md](../python/README.md)

## Local development

```bash
cd labs/capstone-options/option-a-code-review/web
npm install
# Terminal 1: start FastAPI (from python/)
#   python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
# Terminal 2:
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The dev server **proxies** `/review` and `/health` to port 8000, so the browser stays same-origin and you do not need CORS on the API.

### Production build against a remote API

Set the API origin (no trailing slash):

```bash
VITE_API_BASE=https://your-api.example.com npm run build
npm run preview
```

If the API is on another origin, configure CORS on the API (see below) or put both behind one reverse proxy.

### Deploying on Vercel (UI + API on different hosts)

1. **API project (Python)** — In Vercel environment variables set:
   - `CORS_ORIGINS` to your front-end origin(s), comma-separated, e.g. `https://code-review-web.vercel.app` (add preview URLs if you use them).
   - `ANTHROPIC_API_KEY` and any other vars from [../python/.env.example](../python/.env.example).
2. **Web project** — Set `VITE_API_BASE` to your API origin **without a trailing slash**, e.g. `https://your-api.vercel.app`, for **Production** (and **Preview** if previews should hit a real API).
3. **Redeploy the web project** after changing `VITE_API_BASE` so Vite embeds it at build time.

Visiting the API root in a browser should show a small JSON map (`GET /`) with links to `/health`, `/docs`, and `POST /review`.

**Optional (no CORS):** add a [`vercel.json` rewrite](https://vercel.com/docs/projects/project-configuration#rewrites) in this app to proxy `/review` and `/health` to your API URL so the browser stays same-origin and `VITE_API_BASE` can stay empty.

### Proxy target override

```bash
VITE_DEV_PROXY_TARGET=http://127.0.0.1:9000 npm run dev
```

## Updating the API contract

1. Change Pydantic models or routes in `../python/`.
2. Regenerate the spec: `cd ../python && python3 export_openapi.py`
3. Regenerate TypeScript types: `npm run codegen` (also runs automatically as **`prebuild`**).
4. Fix compile errors and adjust UI if shapes changed.
5. Run `npm run test` and `npm run build`.

Generated file (do not edit by hand): `src/generated/api.d.ts`.

## Scripts

| Script        | Purpose                                      |
|---------------|----------------------------------------------|
| `npm run dev` | Vite dev server with proxy                   |
| `npm run codegen` | Regenerate types from `../python/openapi.json` |
| `npm run build` | `codegen` → `tsc` → production bundle    |
| `npm run test`  | Vitest (OpenAPI sanity, Zod fixture, UI)     |
| `npm run lint`  | ESLint                                       |

## Tests

- **OpenAPI** — `@apidevtools/swagger-parser` validates `../python/openapi.json` and checks `/review` and `/health` exist.
- **Zod** — `minimal_review_response` fixture must match `ReviewResponseSchema` (aligned with the spec).
- **UI** — Mocked `fetch` for happy path and 422 validation errors.
