/**
 * Parse free-form migration chat message into structured params for the migration agent.
 */

import { z } from 'zod';
import type { LLMClient } from './llm-client.js';

const SUPPORTED_FRAMEWORKS = [
  'express',
  'fastapi',
  'flask',
  'django',
  'nestjs',
  'hono',
] as const;

const ParsedMigrationSchema = z.object({
  source_framework: z.string(),
  target_framework: z.string(),
  files: z.record(z.string()),
});

export type ParsedMigration = z.infer<typeof ParsedMigrationSchema>;

const SYSTEM_PROMPT = `You are a migration request parser. The user will describe a code migration (e.g. "Migrate Express to FastAPI") and optionally provide source code.

You must respond with ONLY a single JSON object, no markdown, no explanation, no code fences. The JSON must have exactly this shape:
{
  "source_framework": "<lowercase framework name>",
  "target_framework": "<lowercase framework name>",
  "files": { "<filename>": "<file content string>" }
}

Supported framework names (use exactly these, lowercase): express, fastapi, flask, django, nestjs, hono.

Infer source_framework and target_framework from the user's message (e.g. "Migrate X to Y" means source_framework: "x", target_framework: "y"). Use the supported names above (e.g. "Express" -> "express", "FastAPI" -> "fastapi").
If the user provides code, put it in files under a plausible filename (e.g. routes/users.js for Express, main.py for Flask). You may use multiple entries in files if the user provided multiple files or you split the code. If no code is provided, you may return an empty object for files or a single placeholder file with minimal content describing the intent.`;

export interface MigrateChatBody {
  message: string;
  code?: string;
}

/**
 * Parse user message (and optional code) into migration params using the LLM.
 * Validates frameworks against allowlist. Throws on parse or validation failure.
 */
export async function parseMigrationRequest(
  llm: LLMClient,
  body: MigrateChatBody
): Promise<ParsedMigration> {
  const userContent = body.code
    ? `User message: ${body.message}\n\nCode:\n${body.code}`
    : body.message;

  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    { role: 'user' as const, content: userContent },
  ];

  const raw = await llm.chat(messages);
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('Could not parse migration request: invalid JSON from model');
  }

  const result = ParsedMigrationSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Could not parse migration request: ${result.error.message}`
    );
  }

  const source = result.data.source_framework.toLowerCase();
  const target = result.data.target_framework.toLowerCase();

  if (!SUPPORTED_FRAMEWORKS.includes(source as (typeof SUPPORTED_FRAMEWORKS)[number])) {
    throw new Error(`Unsupported framework: ${result.data.source_framework}. Supported: ${SUPPORTED_FRAMEWORKS.join(', ')}`);
  }
  if (!SUPPORTED_FRAMEWORKS.includes(target as (typeof SUPPORTED_FRAMEWORKS)[number])) {
    throw new Error(`Unsupported framework: ${result.data.target_framework}. Supported: ${SUPPORTED_FRAMEWORKS.join(', ')}`);
  }

  const files = result.data.files;
  const fileKeys = Object.keys(files);
  if (fileKeys.length === 0) {
    throw new Error('No source files extracted. Please describe the migration and paste your code.');
  }

  return {
    source_framework: source,
    target_framework: target,
    files,
  };
}
