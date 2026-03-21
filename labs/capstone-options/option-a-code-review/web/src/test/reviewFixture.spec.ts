import { describe, expect, it } from 'vitest'
import { ReviewResponseSchema } from '../api/reviewZod'
import minimalFixture from './fixtures/minimal_review_response.json'

describe('ReviewResponse Zod schema', () => {
  it('accepts minimal_review_response fixture', () => {
    const r = ReviewResponseSchema.safeParse(minimalFixture)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.summary).toContain('simple')
      expect(r.data.issues).toHaveLength(1)
    }
  })
})
