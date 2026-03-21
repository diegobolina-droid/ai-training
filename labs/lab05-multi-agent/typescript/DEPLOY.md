# Deploying Lab 05 (TypeScript) to Vercel

## Overview

- **Runtime:** Node.js serverless functions under [`api/`](api/):
  - [`api/info.ts`](api/info.ts) and [`api/health.ts`](api/health.ts) answer **`GET /api/info`** and **`GET /api/health`** with a few lines of code and **no import** of [`src/app.ts`](src/app.ts). That avoids loading the Anthropic/OpenAI client graph on every cold start (which was causing **60s timeouts** on those routes when everything went through one heavy bundle).
  - [`api/[...path].ts`](api/[...path].ts) handles **`/api/run`**, **`/api/run/start`**, memory routes, etc. It **lazy-imports** `src/app.ts` on first use so unrelated traffic does not pay the full startup cost.
- The Hono app in [`src/app.ts`](src/app.ts) uses **`basePath('/api')`**. The `/info` and `/health` routes there still matter for **`npm run dev`** (single `app.fetch`); on Vercel, the dedicated `api/*.ts` files take precedence for those two URLs.
- **Why `[...path]` (required catch-all)?** An optional catch-all like `api/[[...route]].ts` can fail to invoke the function for **multi-segment** paths such as `/api/run/start` on some Vercel setups (**404**).
- **Static files** in [`public/`](public/) are served from the CDN (Hono `serveStatic` is not used in production).
- **Local dev:** [`src/node-dev.ts`](src/node-dev.ts) (`npm run dev`) forwards **`/api/*`** to `app.fetch`, then [`serveStatic`](src/node-dev.ts) for everything else.

## API URLs (browser and tools)

| Method | Path |
|--------|------|
| `POST` | `/api/run` |
| `POST` | `/api/run/start` |
| `POST` | `/api/run/:id/resume` |
| `GET` / `DELETE` | `/api/memory/:sessionId` |
| `GET` | `/api/health` |
| `GET` | `/api/info` |

[`vercel.json`](vercel.json) still includes **optional rewrites** from `/run`, `/run/start`, etc. to `/api/...` for backward-compatible `curl` without the prefix.

Example:

```bash
curl -s -X POST "https://YOUR_PROJECT.vercel.app/api/run" \
  -H "Content-Type: application/json" \
  -d '{"task":"Say hello in one sentence.","max_iterations":2}'
```

## Project settings (monorepo)

If the Git repository root is the full training repo (`AI_Training`), set **Root Directory** in the Vercel project to:

`labs/lab05-multi-agent/typescript`

### Install command (npm workspaces)

Dependencies may be hoisted to the repo root. If `npm install` fails inside the lab folder, use an install command run from the repository root, for example:

```bash
cd ../../.. && npm install
```

(From `labs/lab05-multi-agent/typescript`, `../../..` is the `AI_Training` root.)

Alternatively, from the repo root:

```bash
npm install --workspace=@agentic-ai/lab05-multi-agent
```

Adjust paths if your checkout layout differs.

## Environment variables

Add in the Vercel project (**Production** and **Preview**):

| Variable | Required | Notes |
|----------|----------|--------|
| `ANTHROPIC_API_KEY` | If using Anthropic (default) | Default provider is `anthropic`. |
| `OPENAI_API_KEY` | If using OpenAI | Set `LLM_PROVIDER=openai`. |
| `LLM_PROVIDER` | Optional | `anthropic` or `openai`. |

If the provider key is missing, `POST /api/run`, `POST /api/run/start`, and `POST /api/run/:id/resume` respond with **503** and a JSON message telling you to set the variable (instead of an opaque **500** from the SDK).

Do not commit secrets; keep using `.env` locally only.

## Build

[`vercel.json`](vercel.json) sets `buildCommand` to `npm run build` (`tsc`). Vercel also transpiles [`api/[...path].ts`](api/[...path].ts) for the function bundle.

## Timeouts (504 Gateway Timeout)

Multi-step supervisor runs often take **tens of seconds** (sometimes more than a minute). Vercel **caps** `maxDuration` by **plan**; the value in `vercel.json` cannot exceed what your project allows.

- [`vercel.json`](vercel.json) sets **`maxDuration` to 300** seconds for `api/[...path].ts` (LLM routes). Free/Hobby projects may **clamp** this to a lower ceiling (e.g. 10–60s); check the Vercel dashboard and [pricing / limits](https://vercel.com/docs/functions/runtimes#max-duration).
- **`GET /api/info`** and **`GET /api/health`** use **`maxDuration`: 10** via dedicated files so they should respond immediately if env is fine.
- If **`POST /api/run`** still hits **504**, shorten the task, reduce **max iterations**, upgrade the plan, or enable longer functions in project settings.

The SPA shows an extra note on **`*.vercel.app`** hosts and surfaces a clearer message when the response status is 504.

## Limitations on Vercel (no extra datastore)

| Feature | Behavior |
|---------|----------|
| **Quick run** (`POST /api/run`) + UI | Primary use case on Vercel. |
| **Human-in-the-loop** (`run-sessions`) | **Unreliable:** in-memory sessions are not shared across instances and are lost on cold starts. Use Redis / Vercel KV in a follow-up. |
| **File-backed memory** (`.data/memory/`) | **Unreliable:** serverless filesystem is ephemeral. Use KV or a database for durable session memory. |

## Optional follow-up: KV / Redis

To make HITL and memory production-safe, introduce a small storage adapter (file/local vs KV) and persist `SupervisorRunState` and memory text under keys such as `hitl:{runId}` and `session:{sessionId}`. This is not implemented in the lab repo by default.

## CLI

```bash
cd labs/lab05-multi-agent/typescript
npx vercel
npx vercel --prod
```

Use `npx vercel dev` to approximate the Vercel routing locally (optional).
