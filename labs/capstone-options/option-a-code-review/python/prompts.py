"""Prompts for code review — literals aligned with models.Category / Severity / Metrics."""

from typing import List, Optional

from models import Category, FocusArea

SYSTEM_PROMPT = """You are an expert code reviewer. Analyze code for:
1. Bugs and potential errors
2. Security vulnerabilities
3. Performance issues
4. Style and best practices
5. Maintainability concerns

You MUST respond with a single JSON object only (no markdown fences, no prose outside JSON).
The JSON must match the schema described in the user message exactly."""


def _focus_instruction(focus: Optional[List[FocusArea]]) -> str:
    if not focus:
        return "Consider all review dimensions (bugs, security, performance, style, maintainability)."
    labels = ", ".join(f.value for f in focus)
    return f"Prioritize these areas: {labels}. Still mention other critical problems if any."


def build_user_prompt(*, code: str, language: str, focus: Optional[List[FocusArea]]) -> str:
    cats = " | ".join(c.value for c in Category)
    return f"""Review this {language} code:

```{language}
{code}
```

{_focus_instruction(focus)}

Return JSON with exactly these keys and value constraints:
- summary: string, 2-3 sentences
- issues: array of objects, each with:
  - severity: one of critical | high | medium | low
  - category: one of {cats}
  - line: integer line number or null if not applicable
  - description: string
  - suggestion: string
- suggestions: array of strings (general improvements)
- metrics: object with:
  - overall_score: integer 1-10
  - complexity: one of low | medium | high
  - maintainability: one of poor | fair | good | excellent

If there are no issues, use an empty issues array and explain why in summary."""
