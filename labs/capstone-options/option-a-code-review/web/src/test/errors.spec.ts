import { describe, expect, it } from 'vitest'
import { formatValidationErrors, parseReviewError } from '../api/errors'

describe('parseReviewError', () => {
  it('parses 422 validation array', () => {
    const body = {
      detail: [
        {
          type: 'missing',
          loc: ['body', 'code'],
          msg: 'Field required',
        },
      ],
    }
    const e = parseReviewError(422, body)
    expect(e.kind).toBe('validation')
    if (e.kind === 'validation') {
      expect(e.items).toHaveLength(1)
      expect(formatValidationErrors(e.items)).toContain('body.code')
    }
  })

  it('parses 413 payload_too_large under detail', () => {
    const e = parseReviewError(413, {
      detail: {
        error: 'payload_too_large',
        message: 'too long',
        max_chars: 50000,
      },
    })
    expect(e.kind).toBe('payload_too_large')
    if (e.kind === 'payload_too_large') {
      expect(e.detail.max_chars).toBe(50000)
    }
  })

  it('parses 502 bad_model_output', () => {
    const e = parseReviewError(502, {
      detail: {
        error: 'bad_model_output',
        message: 'unusable',
      },
    })
    expect(e.kind).toBe('bad_model_output')
  })

  it('parses 503 llm_unavailable', () => {
    const e = parseReviewError(503, {
      detail: {
        error: 'llm_unavailable',
        message: 'try later',
      },
    })
    expect(e.kind).toBe('llm_unavailable')
  })
})
