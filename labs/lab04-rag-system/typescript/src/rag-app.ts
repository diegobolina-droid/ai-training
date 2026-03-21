/**
 * Shared Hono application (routes + RAG). Imported by `index.ts` (Vercel) and `local-server.ts` (local).
 *
 * Do not rename this file to `app.ts`: Vercel resolves `src/app.ts` before `src/index.ts` and
 * requires a default export there; this module only uses a named export.
 */

import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';

import { CodebaseRAG } from './pipeline.js';
import { RAGEvaluator, createEvalDataset } from './evaluation.js';
import { getLLMClient, type LLMProvider } from './llm-client.js';
import {
  QueryRequestSchema,
  IndexFilesRequestSchema,
  IndexDirectoryRequestSchema,
  EvalRequestSchema,
} from './types.js';

const app = new Hono();

app.use('/*', cors());

const provider = (process.env.LLM_PROVIDER || 'anthropic') as LLMProvider;
const llm = getLLMClient(provider);
const rag = new CodebaseRAG(llm);

app.post(
  '/index/directory',
  zValidator('json', IndexDirectoryRequestSchema),
  async (c) => {
    try {
      const { directory, extensions } = c.req.valid('json');
      const count = await rag.indexDirectory(directory, extensions);
      return c.json({ indexed_chunks: count, directory });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ error: message }, 500);
    }
  }
);

app.post('/index/files', zValidator('json', IndexFilesRequestSchema), async (c) => {
  try {
    const { files } = c.req.valid('json');
    const count = await rag.indexFiles(files);
    return c.json({ indexed_chunks: count, files: Object.keys(files) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

app.post('/query', zValidator('json', QueryRequestSchema), async (c) => {
  try {
    const { question, n_results, filter_language } = c.req.valid('json');
    const result = await rag.query(question, n_results, filter_language);
    return c.json({
      answer: result.answer,
      sources: result.sources,
      context_used: result.contextUsed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

app.post('/evaluate', zValidator('json', EvalRequestSchema), async (c) => {
  try {
    const { examples } = c.req.valid('json');
    const evalExamples = createEvalDataset(examples);
    const evaluator = new RAGEvaluator(rag, llm);

    const retrievalMetrics = await evaluator.evaluateRetrieval(evalExamples);
    const generationMetrics = await evaluator.evaluateGeneration(evalExamples);

    return c.json({
      retrieval: retrievalMetrics,
      generation: generationMetrics,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

app.get('/stats', (c) => {
  return c.json(rag.getStats());
});

app.delete('/index', (c) => {
  rag.clearIndex();
  return c.json({ status: 'cleared' });
});

app.get('/health', (c) => {
  return c.json({ status: 'healthy', provider });
});

export { app };
