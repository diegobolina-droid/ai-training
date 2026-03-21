"""HTTP contract tests — REQ-A2, A3, A5, A6, A9, A10."""
import importlib

import pytest
from fastapi.testclient import TestClient

from models import ReviewResponse
from review_service import ReviewLLMError, ReviewParseError, StaticReviewService

from fixture_loader import load_json


class _ParseFailService:
    def review(self, request):
        raise ReviewParseError("simulated bad model output")


class _LlmFailService:
    def review(self, request):
        raise ReviewLLMError("simulated upstream failure")


def test_health_req_a10(client: TestClient):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "healthy"}


def test_review_ok_req_a2_a3(client: TestClient):
    payload = load_json("minimal_review_request.json")
    r = client.post("/review", json=payload)
    assert r.status_code == 200
    body = r.json()
    ReviewResponse.model_validate(body)
    assert body["summary"]
    assert isinstance(body["issues"], list)
    assert isinstance(body["suggestions"], list)
    assert "overall_score" in body["metrics"]


def test_review_with_focus_req_a1(client: TestClient):
    payload = load_json("minimal_review_request.json")
    payload["focus"] = ["security", "performance"]
    r = client.post("/review", json=payload)
    assert r.status_code == 200


def test_review_missing_code_req_a5(client: TestClient):
    r = client.post("/review", json={"language": "python"})
    assert r.status_code == 422
    detail = r.json().get("detail")
    assert detail is not None


def test_review_bad_language_req_a5(client: TestClient):
    r = client.post("/review", json={"code": "x", "language": "klingon"})
    assert r.status_code == 422


def test_payload_too_large_req_a6(client: TestClient, monkeypatch):
    import main

    monkeypatch.setattr(main, "MAX_CODE_CHARS", 5)
    payload = {"code": "123456", "language": "python"}
    r = client.post("/review", json=payload)
    assert r.status_code == 413
    data = r.json()
    assert data["detail"]["error"] == "payload_too_large"
    assert data["detail"]["max_chars"] == 5


def test_review_parse_error_req_a7_502():
    from main import app, get_review_service

    app.dependency_overrides[get_review_service] = lambda: _ParseFailService()
    try:
        tc = TestClient(app)
        r = tc.post("/review", json=load_json("minimal_review_request.json"))
        assert r.status_code == 502
        assert r.json()["detail"]["error"] == "bad_model_output"
    finally:
        app.dependency_overrides.clear()


def test_review_llm_error_req_a7_503():
    from main import app, get_review_service

    app.dependency_overrides[get_review_service] = lambda: _LlmFailService()
    try:
        tc = TestClient(app)
        r = tc.post("/review", json=load_json("minimal_review_request.json"))
        assert r.status_code == 503
        assert r.json()["detail"]["error"] == "llm_unavailable"
    finally:
        app.dependency_overrides.clear()


def test_rate_limit_req_a9(monkeypatch):
    monkeypatch.setenv("REVIEW_RATE_LIMIT", "1/minute")
    import main

    importlib.reload(main)

    payload = load_json("minimal_review_request.json")
    resp = ReviewResponse.model_validate(load_json("minimal_review_response.json"))
    svc = StaticReviewService(resp)
    main.app.dependency_overrides[main.get_review_service] = lambda: svc
    try:
        tc = TestClient(main.app)
        first = tc.post("/review", json=payload)
        assert first.status_code == 200
        second = tc.post("/review", json=payload)
        assert second.status_code == 429
    finally:
        main.app.dependency_overrides.clear()
        monkeypatch.delenv("REVIEW_RATE_LIMIT", raising=False)
        importlib.reload(main)
