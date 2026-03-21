"""Orchestrates prompt → LLM → JSON parse → ReviewResponse validation."""
from __future__ import annotations

import json
import logging
import re
from typing import Protocol, runtime_checkable

from pydantic import ValidationError

from llm_client import AnthropicReviewClient
from models import ReviewRequest, ReviewResponse
from prompts import SYSTEM_PROMPT, build_user_prompt

logger = logging.getLogger(__name__)


class ReviewLLMError(Exception):
    """Upstream LLM or transport failure (maps to 503)."""


class ReviewParseError(Exception):
    """Unparseable or invalid structured output (maps to 502)."""


@runtime_checkable
class ReviewBackend(Protocol):
    def complete(self, *, system: str, user: str) -> str: ...


def extract_json_object(text: str) -> dict:
    raw = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw)
    if fence:
        raw = fence.group(1).strip()
    return json.loads(raw)


class CodeReviewService:
    """Default reviewer using Anthropic."""

    def __init__(self, llm: ReviewBackend | None = None):
        self._llm: ReviewBackend = llm or AnthropicReviewClient()

    def review(self, request: ReviewRequest) -> ReviewResponse:
        user_prompt = build_user_prompt(
            code=request.code,
            language=request.language,
            focus=request.focus,
        )
        try:
            raw = self._llm.complete(system=SYSTEM_PROMPT, user=user_prompt)
        except Exception as exc:  # noqa: BLE001 — surface as 503
            logger.exception("LLM request failed")
            raise ReviewLLMError("LLM request failed") from exc

        try:
            data = extract_json_object(raw)
        except (json.JSONDecodeError, TypeError, ValueError) as exc:
            logger.warning("Failed to parse model JSON: %s", exc)
            raise ReviewParseError("Model returned invalid JSON") from exc

        try:
            return ReviewResponse.model_validate(data)
        except ValidationError as exc:
            logger.warning("Model output failed schema validation: %s", exc)
            raise ReviewParseError("Model output did not match schema") from exc


class StaticReviewService:
    """Test double: returns a fixed response (no LLM)."""

    def __init__(self, response: ReviewResponse):
        self._response = response

    def review(self, request: ReviewRequest) -> ReviewResponse:
        _ = request
        return self._response
