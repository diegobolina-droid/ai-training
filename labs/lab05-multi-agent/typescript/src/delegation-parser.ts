/**
 * Parse DELEGATE / TASK blocks from supervisor LLM output.
 */

export interface Delegation {
  agent: string;
  task: string;
}

/**
 * Parse DELEGATE/TASK pairs from supervisor response.
 * Supports blocks separated by --- and multiple pairs in one segment.
 */
export function parseDelegations(response: string): Delegation[] {
  const text = response.trim();
  const upper = text.toUpperCase();
  if (!upper.includes('DELEGATE:') || !upper.includes('TASK:')) {
    return [];
  }

  const segments = text
    .split(/\n---\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const toScan = segments.length > 0 ? segments : [text];
  const out: Delegation[] = [];
  for (const seg of toScan) {
    out.push(...parseDelegateTaskPairsInSegment(seg));
  }
  return out;
}

function parseDelegateTaskPairsInSegment(seg: string): Delegation[] {
  const pairs: Delegation[] = [];
  const delegateRe = /DELEGATE:\s*([^\n\r]+)/gi;
  let m: RegExpExecArray | null;
  const hits: { agent: string; headerEnd: number }[] = [];
  while ((m = delegateRe.exec(seg)) !== null) {
    hits.push({ agent: m[1].trim(), headerEnd: m.index + m[0].length });
  }

  for (const { agent, headerEnd } of hits) {
    if (!agent) {
      continue;
    }
    const tail = seg.slice(headerEnd);
    const taskMatch = tail.match(/^\s*\r?\n?\s*TASK:\s*([\s\S]*)/i);
    if (!taskMatch) {
      continue;
    }
    let body = taskMatch[1];
    const nextDel = body.search(/\n\s*DELEGATE:\s/i);
    const task = (nextDel === -1 ? body : body.slice(0, nextDel)).trim();
    pairs.push({ agent, task });
  }

  return pairs;
}
