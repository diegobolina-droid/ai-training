import { z } from 'zod'

/** Runtime shape aligned with OpenAPI `ReviewResponse` / generated `components['schemas']['ReviewResponse']`. */
export const ReviewResponseSchema = z.object({
  summary: z.string(),
  issues: z.array(
    z.object({
      severity: z.enum(['critical', 'high', 'medium', 'low']),
      category: z.enum([
        'bug',
        'security',
        'performance',
        'style',
        'maintainability',
      ]),
      line: z.number().nullable().optional(),
      description: z.string(),
      suggestion: z.string(),
    })
  ),
  suggestions: z.array(z.string()),
  metrics: z.object({
    overall_score: z.number().int().min(1).max(10),
    complexity: z.enum(['low', 'medium', 'high']),
    maintainability: z.enum(['poor', 'fair', 'good', 'excellent']),
  }),
})

export type ReviewResponseValidated = z.infer<typeof ReviewResponseSchema>
