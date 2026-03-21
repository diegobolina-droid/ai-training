"""Canonical request/response models for the code review API (spec source of truth)."""
from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

# REQ-A4: at least two languages supported; extend as needed.
ALLOWED_LANGUAGES = frozenset(
    {"python", "javascript", "typescript", "java", "go", "rust", "ruby", "csharp"}
)


class Severity(str, Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class Category(str, Enum):
    bug = "bug"
    security = "security"
    performance = "performance"
    style = "style"
    maintainability = "maintainability"


class Complexity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class Maintainability(str, Enum):
    poor = "poor"
    fair = "fair"
    good = "good"
    excellent = "excellent"


class FocusArea(str, Enum):
    bug = "bug"
    security = "security"
    performance = "performance"
    style = "style"
    maintainability = "maintainability"


class ReviewRequest(BaseModel):
    """REQ-A1: POST /review body."""

    code: str = Field(..., min_length=1)
    language: str = "python"
    focus: Optional[List[FocusArea]] = None

    @field_validator("language")
    @classmethod
    def normalize_language(cls, v: str) -> str:
        v = v.lower().strip()
        if v not in ALLOWED_LANGUAGES:
            raise ValueError(
                f"Unsupported language '{v}'. Allowed: {', '.join(sorted(ALLOWED_LANGUAGES))}"
            )
        return v


class Issue(BaseModel):
    """REQ-A3: single issue entry."""

    severity: Severity
    category: Category
    line: Optional[int] = None
    description: str
    suggestion: str


class Metrics(BaseModel):
    """Nested metrics object in ReviewResponse."""

    overall_score: int = Field(ge=1, le=10)
    complexity: Complexity
    maintainability: Maintainability


class ReviewResponse(BaseModel):
    """REQ-A2."""

    summary: str
    issues: List[Issue]
    suggestions: List[str]
    metrics: Metrics


class PayloadTooLargeDetail(BaseModel):
    """Stable error body for REQ-A6 (413)."""

    error: str = "payload_too_large"
    message: str
    max_chars: int
