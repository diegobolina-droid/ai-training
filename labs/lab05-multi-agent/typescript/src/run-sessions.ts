/**
 * In-memory HITL run sessions with TTL.
 */

import { randomUUID } from 'node:crypto';

import type { SupervisorRunState } from './supervisor.js';

export interface StoredHitlRun {
  id: string;
  state: SupervisorRunState;
  createdAt: number;
  expiresAt: number;
  /** When set, completed runs append summaries to this session. */
  sessionId?: string;
}

const DEFAULT_TTL_MS = 30 * 60 * 1000;

const sessions = new Map<string, StoredHitlRun>();

function pruneExpired(): void {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (s.expiresAt <= now) {
      sessions.delete(id);
    }
  }
}

export function createSession(
  state: SupervisorRunState,
  options?: { ttlMs?: number; sessionId?: string }
): StoredHitlRun {
  pruneExpired();
  const id = randomUUID();
  const now = Date.now();
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const stored: StoredHitlRun = {
    id,
    state,
    createdAt: now,
    expiresAt: now + ttlMs,
    sessionId: options?.sessionId,
  };
  sessions.set(id, stored);
  return stored;
}

export function getSession(id: string): StoredHitlRun | undefined {
  pruneExpired();
  const s = sessions.get(id);
  if (!s || s.expiresAt <= Date.now()) {
    if (s) {
      sessions.delete(id);
    }
    return undefined;
  }
  return s;
}

export function deleteSession(id: string): void {
  sessions.delete(id);
}

export function touchSession(
  id: string,
  ttlMs: number = DEFAULT_TTL_MS
): void {
  const s = sessions.get(id);
  if (s) {
    s.expiresAt = Date.now() + ttlMs;
  }
}
