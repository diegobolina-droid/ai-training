import type { components } from '../generated/api'

/** FastAPI 422 validation error entry. */
export type ValidationErrorItem = {
  loc: (string | number)[]
  msg: string
  type: string
}

export type ApiError =
  | { kind: 'validation'; status: 422; items: ValidationErrorItem[] }
  | {
      kind: 'payload_too_large'
      status: 413
      detail: components['schemas']['PayloadTooLargeDetail']
    }
  | { kind: 'rate_limited'; status: 429; message?: string }
  | {
      kind: 'bad_model_output'
      status: 502
      message?: string
    }
  | {
      kind: 'llm_unavailable'
      status: 503
      message?: string
    }
  | { kind: 'unknown'; status: number; raw: unknown }

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isPayloadTooLargeDetail(
  v: unknown
): v is components['schemas']['PayloadTooLargeDetail'] {
  if (!isRecord(v)) return false
  return (
    typeof v.message === 'string' &&
    typeof v.max_chars === 'number' &&
    (v.error === undefined || typeof v.error === 'string')
  )
}

function isValidationItems(v: unknown): v is ValidationErrorItem[] {
  if (!Array.isArray(v)) return false
  return v.every(
    (item) =>
      isRecord(item) &&
      Array.isArray(item.loc) &&
      typeof item.msg === 'string' &&
      typeof item.type === 'string'
  )
}

/**
 * Parse error JSON from POST /review. FastAPI nests custom errors under `detail`;
 * 422 uses `detail` as an array of validation errors.
 */
export function parseReviewError(
  status: number,
  body: unknown
): ApiError {
  if (status === 422 && isRecord(body) && isValidationItems(body.detail)) {
    return { kind: 'validation', status: 422, items: body.detail }
  }

  if (status === 413 && isRecord(body) && isPayloadTooLargeDetail(body.detail)) {
    return {
      kind: 'payload_too_large',
      status: 413,
      detail: {
        error:
          typeof body.detail.error === 'string'
            ? body.detail.error
            : 'payload_too_large',
        message: body.detail.message,
        max_chars: body.detail.max_chars,
      },
    }
  }

  if (status === 429) {
    const msg =
      isRecord(body) && typeof body.detail === 'string'
        ? body.detail
        : undefined
    return { kind: 'rate_limited', status: 429, message: msg }
  }

  if (status === 502 && isRecord(body) && isRecord(body.detail)) {
    const err = body.detail.error
    if (err === 'bad_model_output') {
      return {
        kind: 'bad_model_output',
        status: 502,
        message:
          typeof body.detail.message === 'string'
            ? body.detail.message
            : undefined,
      }
    }
  }

  if (status === 503 && isRecord(body) && isRecord(body.detail)) {
    const err = body.detail.error
    if (err === 'llm_unavailable') {
      return {
        kind: 'llm_unavailable',
        status: 503,
        message:
          typeof body.detail.message === 'string'
            ? body.detail.message
            : undefined,
      }
    }
  }

  return { kind: 'unknown', status, raw: body }
}

export function formatValidationErrors(items: ValidationErrorItem[]): string {
  return items
    .map((e) => `${e.loc.filter(Boolean).join('.')}: ${e.msg}`)
    .join('\n')
}
