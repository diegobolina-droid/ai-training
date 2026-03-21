"""AI Code Review Bot — Capstone Option A."""
from __future__ import annotations

import logging
import os
import time
from typing import Annotated

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from models import PayloadTooLargeDetail, ReviewRequest, ReviewResponse
from review_service import CodeReviewService, ReviewLLMError, ReviewParseError, StaticReviewService

load_dotenv()

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)

MAX_CODE_CHARS = int(os.getenv("MAX_REVIEW_CODE_CHARS", "50000"))
RATE_LIMIT = os.getenv("REVIEW_RATE_LIMIT", "30/minute")

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="AI Code Review Bot",
    description="Structured LLM-powered code review API (Capstone A).",
    version="1.0.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


def _cors_allow_origins() -> list[str] | None:
    """Browser CORS: unset env → local Vite only; set to comma-separated HTTPS origins for production."""
    if "CORS_ORIGINS" not in os.environ:
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    raw = os.environ["CORS_ORIGINS"].strip()
    if not raw:
        return None
    return [p.strip() for p in raw.split(",") if p.strip()]


_cors = _cors_allow_origins()
if _cors:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    """REQ-A5: stable 422 with field detail."""
    return JSONResponse(
        status_code=422,
        content={"detail": jsonable_encoder(exc.errors())},
    )


def get_review_service() -> CodeReviewService | StaticReviewService:
    return CodeReviewService()


@app.get("/")
async def root() -> dict[str, str]:
    """Landing when visiting the API host in a browser (avoids bare 404 on GET /)."""
    return {
        "service": "AI Code Review Bot",
        "health": "/health",
        "review": "POST /review",
        "openapi": "/openapi.json",
        "docs": "/docs",
    }


@app.post(
    "/review",
    response_model=ReviewResponse,
    responses={
        413: {"model": PayloadTooLargeDetail},
        422: {"description": "Validation error"},
        429: {"description": "Rate limited"},
        502: {"description": "Model output unusable"},
        503: {"description": "LLM unavailable"},
    },
)
@limiter.limit(RATE_LIMIT)
async def review_code(
    request: Request,
    body: ReviewRequest,
    service: Annotated[CodeReviewService | StaticReviewService, Depends(get_review_service)],
) -> ReviewResponse:
    """REQ-A1, REQ-A2, REQ-A3: review code and return structured feedback."""
    if len(body.code) > MAX_CODE_CHARS:
        detail = PayloadTooLargeDetail(
            message="Code exceeds maximum allowed length",
            max_chars=MAX_CODE_CHARS,
        )
        raise HTTPException(status_code=413, detail=detail.model_dump())

    start = time.perf_counter()
    try:
        result = service.review(body)
    except ReviewParseError:
        logger.warning(
            "review_parse_failed language=%s",
            body.language,
            extra={"endpoint": "/review", "outcome": "parse_error"},
        )
        raise HTTPException(
            status_code=502,
            detail={
                "error": "bad_model_output",
                "message": "Review could not be produced from model output.",
            },
        ) from None
    except ReviewLLMError:
        logger.warning(
            "review_llm_failed language=%s",
            body.language,
            extra={"endpoint": "/review", "outcome": "llm_error"},
        )
        raise HTTPException(
            status_code=503,
            detail={
                "error": "llm_unavailable",
                "message": "Review service temporarily unavailable.",
            },
        ) from None

    elapsed_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "review_complete language=%s latency_ms=%.2f outcome=ok",
        body.language,
        elapsed_ms,
        extra={
            "endpoint": "/review",
            "language": body.language,
            "latency_ms": round(elapsed_ms, 2),
            "outcome": "ok",
        },
    )
    return result


@app.get("/health")
async def health() -> dict[str, str]:
    """REQ-A10."""
    return {"status": "healthy"}
