"""Unit tests for parsing and validation — supports REQ-A7 behavior."""
import pytest

from models import ReviewRequest, ReviewResponse
from review_service import (
    CodeReviewService,
    ReviewParseError,
    extract_json_object,
)


def test_extract_json_raw():
    raw = '{"summary": "x", "issues": [], "suggestions": [], "metrics": {"overall_score": 5, "complexity": "low", "maintainability": "fair"}}'
    data = extract_json_object(raw)
    ReviewResponse.model_validate(data)


def test_extract_json_fenced():
    raw = """Here is the result:
```json
{"summary": "x", "issues": [], "suggestions": [], "metrics": {"overall_score": 5, "complexity": "low", "maintainability": "fair"}}
```
"""
    data = extract_json_object(raw)
    ReviewResponse.model_validate(data)


class _BadJsonBackend:
    def complete(self, *, system: str, user: str) -> str:
        return "not json"


class _InvalidSchemaBackend:
    def complete(self, *, system: str, user: str) -> str:
        return '{"summary": 1, "issues": "nope"}'


def test_review_parse_error_invalid_json():
    svc = CodeReviewService(llm=_BadJsonBackend())
    req = ReviewRequest(code="print(1)", language="python")
    with pytest.raises(ReviewParseError):
        svc.review(req)


def test_review_parse_error_invalid_schema():
    svc = CodeReviewService(llm=_InvalidSchemaBackend())
    req = ReviewRequest(code="print(1)", language="python")
    with pytest.raises(ReviewParseError):
        svc.review(req)


def test_review_request_accepts_javascript_req_a4():
    r = ReviewRequest(code="const x = 1;", language="javascript")
    assert r.language == "javascript"
