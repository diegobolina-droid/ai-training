# AI Code Review Bot (Capstone Option A)

FastAPI service that accepts source code and returns **structured** review output (summary, categorized issues, suggestions, metrics) using the Anthropic API. The HTTP contract and enums are defined in code (`models.py`) and mirrored in [`openapi.json`](openapi.json).

The original capstone brief, rubric, and curl examples live one directory up: [../README.md](../README.md).

## Prerequisites

- **Python 3.12+** (3.13 supported; dependencies use flexible pins in `requirements.txt`)
- An **Anthropic API key** for live reviews (`ANTHROPIC_API_KEY`)

## Local development

### 1. Create a virtual environment (recommended)

```bash
cd labs/capstone-options/option-a-code-review/python
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
```

### 2. Install dependencies

```bash
python3 -m pip install -r requirements.txt
```

### 3. Environment variables

Copy the example file and add your key:

```bash
cp .env.example .env
```

Edit `.env` and set at least:

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes (for real reviews) | API key from Anthropic |
| `ANTHROPIC_MODEL` | No | Default: `claude-3-5-sonnet-20241022` |
| `MAX_REVIEW_CODE_CHARS` | No | Max length of `code` in JSON body (default `50000`; over limit → **413**) |
| `REVIEW_RATE_LIMIT` | No | slowapi limit, e.g. `30/minute` (default) |
| `LOG_LEVEL` | No | e.g. `INFO`, `DEBUG` |

`python-dotenv` loads `.env` when the app starts.

### 4. Run the API

```bash
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- **Interactive docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **OpenAPI JSON:** [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)

### 5. Quick smoke test

Health:

```bash
curl -s http://127.0.0.1:8000/health
```

Review (requires valid `ANTHROPIC_API_KEY` in `.env`):

```bash
curl -s -X POST http://127.0.0.1:8000/review \
  -H "Content-Type: application/json" \
  -d '{"code": "def add(a, b):\n    return a + b", "language": "python"}'
```

Optional `focus` (subset of review dimensions):

```bash
curl -s -X POST http://127.0.0.1:8000/review \
  -H "Content-Type: application/json" \
  -d '{"code": "const x = eval(userInput);", "language": "javascript", "focus": ["security"]}'
```

### Supported `language` values

Validated on the request: `python`, `javascript`, `typescript`, `java`, `go`, `rust`, `ruby`, `csharp` (lowercase). Unknown values return **422**.

## API summary

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness: `{"status": "healthy"}` |
| `POST` | `/review` | Body: `code`, `language` (default `python`), optional `focus[]` |

Typical error responses:

- **422** — Validation (e.g. missing `code`, bad `language`, invalid `focus`)
- **413** — `code` longer than `MAX_REVIEW_CODE_CHARS`
- **429** — Rate limit exceeded (`REVIEW_RATE_LIMIT`)
- **502** — Model returned output that could not be parsed or did not match the schema
- **503** — Upstream LLM/network failure

## Tests

Contract and unit tests run **without** calling Anthropic (stubbed reviewer):

```bash
python3 -m pytest tests/ --ignore=tests/test_integration.py
```

Optional **integration** tests (live API; require `ANTHROPIC_API_KEY` in the environment):

```bash
export ANTHROPIC_API_KEY=sk-ant-...
python3 -m pytest tests/test_integration.py -m integration
```

## Regenerate committed OpenAPI snapshot

After changing routes or models:

```bash
python3 export_openapi.py
```

This overwrites `openapi.json` in this folder.

## Project layout

| File / directory | Role |
|------------------|------|
| `main.py` | FastAPI app, routes, rate limit, logging, error mapping |
| `models.py` | Pydantic models and enums (API contract) |
| `review_service.py` | Prompt → LLM → parse JSON → validate |
| `prompts.py` | System and user prompts |
| `llm_client.py` | Anthropic Messages client |
| `fixture_loader.py` | Load JSON fixtures for tests |
| `export_openapi.py` | Writes `openapi.json` |
| `tests/` | pytest suites and `tests/fixtures/` |

## Deploy (short)

- **This folder as service root:** start command  
  `uvicorn main:app --host 0.0.0.0 --port $PORT`  
  Set `ANTHROPIC_API_KEY` (and optional vars) in the host’s secret manager.
- **Browser clients on another origin (e.g. Vite on Vercel):** set `CORS_ORIGINS` to the front-end URL(s). See `.env.example`.
- **Parent folder as root:** use [../Procfile](../Procfile), which runs uvicorn from `python/`.

See comments in `.env.example` for the same options.
