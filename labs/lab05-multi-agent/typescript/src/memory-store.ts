/**
 * File-backed session memory (summaries from prior runs).
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_MEMORY_CHARS = 4000;
const MAX_APPEND_CHARS = 800;

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '.data', 'memory');

async function ensureDataDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
}

function memoryPath(sessionId: string): string {
  const safe = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return join(DATA_DIR, `${safe}.txt`);
}

export async function readSessionMemory(sessionId: string): Promise<string> {
  await ensureDataDir();
  try {
    const text = await readFile(memoryPath(sessionId), 'utf-8');
    return text.trim();
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return '';
    }
    throw e;
  }
}

function truncateTotal(text: string): string {
  if (text.length <= MAX_MEMORY_CHARS) {
    return text;
  }
  return text.slice(text.length - MAX_MEMORY_CHARS);
}

/**
 * Append a snippet from a completed run. Idempotent per call site.
 */
export async function appendSessionMemory(
  sessionId: string,
  summary: string
): Promise<void> {
  await ensureDataDir();
  const chunk = summary.trim().slice(0, MAX_APPEND_CHARS);
  if (!chunk) {
    return;
  }
  const path = memoryPath(sessionId);
  let prior = '';
  try {
    prior = await readFile(path, 'utf-8');
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code !== 'ENOENT') {
      throw e;
    }
  }
  const combined = prior
    ? `${prior.trim()}\n\n---\n\n${chunk}`
    : chunk;
  await writeFile(path, truncateTotal(combined), 'utf-8');
}

export async function clearSessionMemory(sessionId: string): Promise<void> {
  await ensureDataDir();
  const path = memoryPath(sessionId);
  try {
    await writeFile(path, '', 'utf-8');
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code !== 'ENOENT') {
      throw e;
    }
  }
}
