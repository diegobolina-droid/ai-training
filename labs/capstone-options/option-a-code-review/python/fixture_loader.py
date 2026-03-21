"""Load JSON examples from tests/fixtures (used by tests and optional scripts)."""
import json
from pathlib import Path

FIXTURES = Path(__file__).resolve().parent / "tests" / "fixtures"


def load_json(name: str) -> dict:
    with (FIXTURES / name).open(encoding="utf-8") as f:
        return json.load(f)
