"""URL Shortener Backend - Full implementation per SPEC.md"""
import os
import re
import secrets
import string
from pathlib import Path
from contextlib import asynccontextmanager

import aiosqlite
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field, HttpUrl

# Config
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000").rstrip("/")
_default_db = Path(__file__).parent / "urls.db"
DB_PATH = Path(os.getenv("DB_PATH", str(_default_db)))


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create urls table on startup."""
    async with aiosqlite.connect(DB_PATH) as conn:
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS urls (
                short_code TEXT PRIMARY KEY,
                original_url TEXT NOT NULL
            )
            """
        )
        await conn.commit()
    yield


app = FastAPI(title="URL Shortener", lifespan=lifespan)

# CORS for frontend (CORS_ORIGINS: comma-separated or "*" for all)
_cors_origins = os.getenv("CORS_ORIGINS", "*")
_origins = [o.strip() for o in _cors_origins.split(",") if o.strip()] if _cors_origins != "*" else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Max URL length to prevent abuse (RFC 3986 suggests 2048 for practical use)
MAX_URL_LENGTH = 2048

class URLRequest(BaseModel):
    url: HttpUrl = Field(..., max_length=MAX_URL_LENGTH)


class URLResponse(BaseModel):
    short_code: str
    short_url: str


# Only allow 6-char alphanumeric for redirect path (security: avoid path traversal / abuse)
SHORT_CODE_PATTERN = re.compile(r"^[a-z0-9]{6}$")

def generate_short_code() -> str:
    """Generate a cryptographically random 6-character alphanumeric short code."""
    alphabet = string.ascii_lowercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(6))


async def ensure_unique_code(conn: aiosqlite.Connection) -> str:
    """Generate a short code that does not yet exist in the DB."""
    for _ in range(100):
        code = generate_short_code()
        cursor = await conn.execute(
            "SELECT 1 FROM urls WHERE short_code = ?", (code,)
        )
        row = await cursor.fetchone()
        if row is None:
            return code
    raise HTTPException(status_code=500, detail="Could not generate unique code")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "healthy"}


@app.post("/shorten", response_model=URLResponse)
async def shorten(req: URLRequest) -> URLResponse:
    original_url = str(req.url)
    async with aiosqlite.connect(DB_PATH) as conn:
        conn.row_factory = aiosqlite.Row
        # Check for existing mapping (duplicate URL)
        cursor = await conn.execute(
            "SELECT short_code FROM urls WHERE original_url = ?", (original_url,)
        )
        row = await cursor.fetchone()
        if row is not None:
            code = row["short_code"]
            return URLResponse(
                short_code=code,
                short_url=f"{BASE_URL}/{code}",
            )
        # New URL: generate code and insert
        code = await ensure_unique_code(conn)
        await conn.execute(
            "INSERT INTO urls (short_code, original_url) VALUES (?, ?)",
            (code, original_url),
        )
        await conn.commit()
    return URLResponse(
        short_code=code,
        short_url=f"{BASE_URL}/{code}",
    )


@app.get("/{short_code}")
async def redirect(short_code: str) -> RedirectResponse:
    if not SHORT_CODE_PATTERN.match(short_code):
        raise HTTPException(status_code=404, detail="Short code not found")
    async with aiosqlite.connect(DB_PATH) as conn:
        conn.row_factory = aiosqlite.Row
        cursor = await conn.execute(
            "SELECT original_url FROM urls WHERE short_code = ?", (short_code,)
        )
        row = await cursor.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Short code not found")
    return RedirectResponse(url=row["original_url"], status_code=307)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
