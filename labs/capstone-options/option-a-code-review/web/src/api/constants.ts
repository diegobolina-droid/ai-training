import type { components } from '../generated/api'

/** Mirrors `ALLOWED_LANGUAGES` in the FastAPI `models.py` validator. */
export const ALLOWED_LANGUAGES = [
  'python',
  'javascript',
  'typescript',
  'java',
  'go',
  'rust',
  'ruby',
  'csharp',
] as const

export type AllowedLanguage = (typeof ALLOWED_LANGUAGES)[number]

export const FOCUS_AREAS: components['schemas']['FocusArea'][] = [
  'bug',
  'security',
  'performance',
  'style',
  'maintainability',
]

const severityRank: Record<components['schemas']['Severity'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

export function sortIssuesBySeverity(
  issues: components['schemas']['Issue'][]
): components['schemas']['Issue'][] {
  return [...issues].sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity]
  )
}
