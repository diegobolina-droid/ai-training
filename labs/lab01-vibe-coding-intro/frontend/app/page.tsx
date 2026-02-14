'use client';

import { useState, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const FETCH_TIMEOUT_MS = 15_000;

type ShortenResult = {
  short_code: string;
  short_url: string;
};

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Turn API error body into a single user-facing message. Handles 422 validation detail array. */
function getErrorMessage(res: Response, data: Record<string, unknown>): string {
  const detail = data.detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string; loc?: unknown[] };
    return first?.msg ?? `Validation error (${res.status})`;
  }
  if (typeof detail === 'string') return detail;
  if (typeof data.message === 'string') return data.message;
  return `Request failed (${res.status})`;
}

/** Check success response has required fields. */
function isShortenSuccess(data: unknown): data is ShortenResult {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as ShortenResult).short_code === 'string' &&
    typeof (data as ShortenResult).short_url === 'string'
  );
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setResult(null);
      const trimmed = url.trim();
      if (!trimmed) {
        setError('Please enter a URL.');
        return;
      }
      if (!isValidUrl(trimmed)) {
        setError('Please enter a valid URL (e.g. https://example.com).');
        return;
      }
      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(`${API_URL.replace(/\/$/, '')}/shorten`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        if (!res.ok) {
          setError(getErrorMessage(res, data));
          return;
        }
        if (!isShortenSuccess(data)) {
          setError('Invalid response from server. Please try again.');
          return;
        }
        setResult({ short_code: data.short_code, short_url: data.short_url });
      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            setError('Request timed out. Check your connection and try again.');
          } else {
            setError(err.message || 'Network error. Is the backend running?');
          }
        } else {
          setError('Network error. Is the backend running?');
        }
      } finally {
        setLoading(false);
      }
    },
    [url]
  );

  async function handleCopy() {
    if (!result?.short_url) return;
    try {
      await navigator.clipboard.writeText(result.short_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy to clipboard.');
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">URL Shortener</h1>
      <p className="text-gray-600 mb-6">Lab 01 — Vibe Coding Intro</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            Long URL
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.example.com/very/long/url"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            disabled={loading}
            autoComplete="url"
            aria-invalid={!!error}
            aria-describedby={error ? 'url-error' : undefined}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Shortening…' : 'Shorten'}
        </button>
      </form>

      {error && (
        <div
          id="url-error"
          className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Short URL</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              readOnly
              value={result.short_url}
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 text-sm"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="py-2 px-4 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
