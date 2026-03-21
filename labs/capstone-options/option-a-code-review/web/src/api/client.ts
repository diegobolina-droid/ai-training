import type { components } from '../generated/api'
import { parseReviewError, type ApiError } from './errors'
import { ReviewResponseSchema, type ReviewResponseValidated } from './reviewZod'

export type ReviewRequestBody = components['schemas']['ReviewRequest']

function apiBase(): string {
  const b = import.meta.env.VITE_API_BASE
  return typeof b === 'string' ? b.replace(/\/$/, '') : ''
}

export type PostReviewOk = { ok: true; data: ReviewResponseValidated }
export type PostReviewErr = { ok: false; error: ApiError }
export type PostReviewResult = PostReviewOk | PostReviewErr

export async function postReview(
  body: ReviewRequestBody
): Promise<PostReviewResult> {
  const url = `${apiBase()}/review`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  let parsed: unknown
  const text = await res.text()
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    parsed = { _parseError: text }
  }

  if (res.ok) {
    const check = ReviewResponseSchema.safeParse(parsed)
    if (!check.success) {
      return {
        ok: false,
        error: {
          kind: 'unknown',
          status: res.status,
          raw: { zodError: check.error.flatten(), body: parsed },
        },
      }
    }
    return { ok: true, data: check.data }
  }

  return { ok: false, error: parseReviewError(res.status, parsed) }
}

export type HealthResult =
  | { ok: true; status: string }
  | { ok: false; error: string }

export async function getHealth(): Promise<HealthResult> {
  const url = `${apiBase()}/health`
  try {
    const res = await fetch(url)
    const text = await res.text()
    let data: unknown
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      return { ok: false, error: 'Invalid JSON from /health' }
    }
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    if (
      typeof data === 'object' &&
      data !== null &&
      'status' in data &&
      typeof (data as { status: unknown }).status === 'string'
    ) {
      return { ok: true, status: (data as { status: string }).status }
    }
    return { ok: false, error: 'Unexpected /health shape' }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}
