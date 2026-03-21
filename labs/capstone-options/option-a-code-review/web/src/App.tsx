import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  ALLOWED_LANGUAGES,
  FOCUS_AREAS,
  sortIssuesBySeverity,
  type AllowedLanguage,
} from './api/constants'
import { getHealth, postReview, type HealthResult } from './api/client'
import type { components } from './generated/api'
import {
  formatValidationErrors,
  type ApiError,
} from './api/errors'
import './App.css'

type FocusArea = components['schemas']['FocusArea']

function errorMessage(err: ApiError): string {
  switch (err.kind) {
    case 'validation':
      return formatValidationErrors(err.items)
    case 'payload_too_large':
      return `${err.detail.message} (limit ${err.detail.max_chars} characters)`
    case 'rate_limited':
      return err.message ?? 'Too many requests. Try again shortly.'
    case 'bad_model_output':
      return err.message ?? 'The model returned output that could not be used.'
    case 'llm_unavailable':
      return err.message ?? 'Review service temporarily unavailable.'
    default:
      return `Request failed (HTTP ${err.status})`
  }
}

export default function App() {
  const [code, setCode] = useState('def add(a, b):\n    return a + b\n')
  const [language, setLanguage] = useState<AllowedLanguage>('python')
  const [focus, setFocus] = useState<Set<FocusArea>>(new Set())
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<
    components['schemas']['ReviewResponse'] | null
  >(null)
  const [error, setError] = useState<string | null>(null)
  const [health, setHealth] = useState<'checking' | 'ok' | 'down'>('checking')
  const [healthDetail, setHealthDetail] = useState<string>('')

  function applyHealthResult(h: HealthResult) {
    if (h.ok) {
      setHealth('ok')
      setHealthDetail(h.status)
    } else {
      setHealth('down')
      setHealthDetail(h.error)
    }
  }

  useEffect(() => {
    let cancelled = false
    void getHealth().then((h) => {
      if (cancelled) return
      applyHealthResult(h)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const sortedIssues = useMemo(
    () => (result ? sortIssuesBySeverity(result.issues) : []),
    [result]
  )

  function toggleFocus(f: FocusArea) {
    setFocus((prev) => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)
    const body: components['schemas']['ReviewRequest'] = {
      code,
      language,
      ...(focus.size > 0 ? { focus: [...focus] } : {}),
    }
    const res = await postReview(body)
    setLoading(false)
    if (res.ok) {
      setResult(res.data)
      return
    }
    setError(errorMessage(res.error))
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>AI code review</h1>
          <p className="tagline">
            Structured feedback from the Capstone A API (OpenAPI-driven client).
          </p>
        </div>
        <div
          className={`health health--${health}`}
          role="status"
          aria-live="polite"
        >
          <span className="health__label">API</span>
          {health === 'checking' && <span>Checking…</span>}
          {health === 'ok' && <span>Healthy ({healthDetail})</span>}
          {health === 'down' && <span>Unavailable — {healthDetail}</span>}
          <button
            type="button"
            className="health__retry"
            onClick={() => {
              setHealth('checking')
              void getHealth().then(applyHealthResult)
            }}
          >
            Retry
          </button>
        </div>
      </header>

      <main className="main">
        <form className="panel" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">Source code</span>
            <textarea
              className="code-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={14}
              spellCheck={false}
              aria-label="Source code"
            />
          </label>

          <div className="row">
            <label className="field field--inline">
              <span className="field__label">Language</span>
              <select
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value as AllowedLanguage)
                }
              >
                {ALLOWED_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="focus-fieldset">
            <legend>Focus areas (optional)</legend>
            <div className="focus-grid">
              {FOCUS_AREAS.map((f) => (
                <label key={f} className="checkbox">
                  <input
                    type="checkbox"
                    checked={focus.has(f)}
                    onChange={() => toggleFocus(f)}
                  />
                  {f}
                </label>
              ))}
            </div>
          </fieldset>

          <button type="submit" className="submit" disabled={loading || !code.trim()}>
            {loading ? 'Reviewing…' : 'Run review'}
          </button>
        </form>

        {error && (
          <div className="banner banner--error" role="alert">
            <strong>Error</strong>
            <pre className="banner__body">{error}</pre>
          </div>
        )}

        {result && (
          <section className="panel results" aria-label="Review results">
            <h2>Summary</h2>
            <p className="summary">{result.summary}</p>

            <h2>Metrics</h2>
            <ul className="metrics">
              <li>
                Overall score: <strong>{result.metrics.overall_score}</strong> / 10
              </li>
              <li>
                Complexity: <strong>{result.metrics.complexity}</strong>
              </li>
              <li>
                Maintainability:{' '}
                <strong>{result.metrics.maintainability}</strong>
              </li>
            </ul>

            <h2>Issues ({result.issues.length})</h2>
            {sortedIssues.length === 0 ? (
              <p className="muted">No issues reported.</p>
            ) : (
              <ul className="issues">
                {sortedIssues.map((issue, i) => (
                  <li key={i} className="issue">
                    <div className="issue__meta">
                      <span
                        className={`badge badge--${issue.severity}`}
                        title="Severity"
                      >
                        {issue.severity}
                      </span>
                      <span className="badge badge--category" title="Category">
                        {issue.category}
                      </span>
                      {issue.line != null && (
                        <span className="line">Line {issue.line}</span>
                      )}
                    </div>
                    <p className="issue__desc">{issue.description}</p>
                    <p className="issue__sug">
                      <strong>Suggestion:</strong> {issue.suggestion}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <h2>Suggestions</h2>
            <ul className="suggestions">
              {result.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  )
}
