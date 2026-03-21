"""Anthropic client for code review."""
import os

from anthropic import Anthropic


class AnthropicReviewClient:
    """Thin wrapper around the Messages API (system + user)."""

    def __init__(self, model: str | None = None):
        self._client = Anthropic()
        self.model = model or os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")

    def complete(self, *, system: str, user: str) -> str:
        response = self._client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        block = response.content[0]
        if block.type != "text":
            raise RuntimeError("Unexpected non-text response from model")
        return block.text
