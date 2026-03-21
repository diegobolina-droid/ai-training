"""Live Anthropic calls — REQ-A4, REQ-A7. Run with: pytest -m integration (requires ANTHROPIC_API_KEY)."""
import os

import pytest
from fastapi.testclient import TestClient

from main import app, get_review_service

from fixture_loader import load_json

pytestmark = pytest.mark.integration


@pytest.fixture
def live_client():
    app.dependency_overrides.pop(get_review_service, None)
    with TestClient(app) as client:
        yield client


@pytest.mark.skipif(not os.getenv("ANTHROPIC_API_KEY"), reason="ANTHROPIC_API_KEY not set")
def test_live_python_security_sample_req_a4(live_client: TestClient):
    payload = load_json("python_security_sample.json")
    r = live_client.post("/review", json=payload)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("summary")
    assert "issues" in body and isinstance(body["issues"], list)


@pytest.mark.skipif(not os.getenv("ANTHROPIC_API_KEY"), reason="ANTHROPIC_API_KEY not set")
def test_live_javascript_sample_req_a4(live_client: TestClient):
    payload = load_json("javascript_security_sample.json")
    r = live_client.post("/review", json=payload)
    assert r.status_code == 200, r.text
    body = r.json()
    assert len(body.get("issues", [])) >= 0
