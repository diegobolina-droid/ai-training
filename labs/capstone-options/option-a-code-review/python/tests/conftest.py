"""Shared fixtures — REQ traceability in test module docstrings."""
import pytest
from fastapi.testclient import TestClient

from models import ReviewResponse
from review_service import StaticReviewService

from fixture_loader import load_json


@pytest.fixture
def minimal_review_response() -> ReviewResponse:
    return ReviewResponse.model_validate(load_json("minimal_review_response.json"))


@pytest.fixture
def client(minimal_review_response: ReviewResponse):
    """TestClient with LLM stubbed via StaticReviewService."""
    from main import app, get_review_service

    svc = StaticReviewService(minimal_review_response)
    app.dependency_overrides[get_review_service] = lambda: svc
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
