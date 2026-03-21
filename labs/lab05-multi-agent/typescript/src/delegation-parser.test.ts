import { describe, expect, it } from 'vitest';

import { parseDelegations } from './delegation-parser.js';

describe('parseDelegations', () => {
  it('parses a single DELEGATE/TASK pair', () => {
    const text = `I'll delegate research first.
DELEGATE: Researcher
TASK: Summarize how RAG works for a blog audience.`;
    expect(parseDelegations(text)).toEqual([
      {
        agent: 'Researcher',
        task: 'Summarize how RAG works for a blog audience.',
      },
    ]);
  });

  it('parses multiple pairs separated by ---', () => {
    const text = `Parallel step.
DELEGATE: Researcher
TASK: List three key facts about Neptune.

---

DELEGATE: FactChecker
TASK: Flag any unsupported claims in the prior notes.`;
    expect(parseDelegations(text)).toEqual([
      { agent: 'Researcher', task: 'List three key facts about Neptune.' },
      {
        agent: 'FactChecker',
        task: 'Flag any unsupported claims in the prior notes.',
      },
    ]);
  });

  it('parses two pairs in one block without ---', () => {
    const text = `DELEGATE: Writer
TASK: Draft two paragraphs.

DELEGATE: Editor
TASK: Tighten wording only.`;
    expect(parseDelegations(text)).toEqual([
      { agent: 'Writer', task: 'Draft two paragraphs.' },
      { agent: 'Editor', task: 'Tighten wording only.' },
    ]);
  });

  it('returns empty array when markers are missing', () => {
    expect(parseDelegations('No delegation here.')).toEqual([]);
  });

  it('stops task text at the next DELEGATE marker', () => {
    const text = `DELEGATE: Researcher
TASK: First task only
DELEGATE: Writer
TASK: Second task`;
    expect(parseDelegations(text)).toEqual([
      { agent: 'Researcher', task: 'First task only' },
      { agent: 'Writer', task: 'Second task' },
    ]);
  });
});
