/**
 * Supervisor agent that coordinates workers.
 */

import type { LLMClient, Message } from './llm-client.js';
import {
  ResearcherAgent,
  WriterAgent,
  ReviewerAgent,
  EditorAgent,
  FactCheckerAgent,
  WorkerAgent,
} from './agents.js';
import { parseDelegations, type Delegation } from './delegation-parser.js';

const SUPERVISOR_PROMPT = `You are a supervisor managing a team of specialized agents.

Available agents (use these exact names after DELEGATE:):
- Researcher: Finds and summarizes information
- Writer: Creates polished content from research
- Reviewer: Reviews content for quality and structure
- Editor: Tightens prose, fixes grammar, improves clarity
- FactChecker: Flags unsupported claims and suggests cautious wording

Your job:
1. Analyze the incoming task
2. Decide which agent(s) to use
3. Coordinate their work
4. Synthesize the final output

For each step, output one or more delegations using this format:

DELEGATE: [agent_name]
TASK: [specific task for that agent]

To run multiple agents in parallel in the same turn, either:
- Add another DELEGATE/TASK pair after the first (same message), OR
- Separate delegations with a line containing only: ---

When all work is done, output:
FINAL: [synthesized final output]`;

export type TraceEvent =
  | { type: 'supervisor'; content: string }
  | { type: 'delegate'; agent: string; task: string }
  | { type: 'worker_result'; agent: string; output: string }
  | { type: 'note'; message: string };

export interface SupervisorResult {
  result: string;
  stepsTaken: number;
  trace: TraceEvent[];
}

export interface SupervisorRunState {
  messages: Message[];
  results: Map<string, string>;
  trace: TraceEvent[];
  supervisorTurn: number;
  maxIterations: number;
  hitl: boolean;
  pendingDelegations?: Delegation[];
}

export type RunContinuationResult =
  | {
      status: 'completed';
      result: string;
      trace: TraceEvent[];
      stepsTaken: number;
    }
  | {
      status: 'awaiting_approval';
      pending: Delegation[];
      trace: TraceEvent[];
      stepsTaken: number;
    };

/**
 * Supervisor that coordinates worker agents.
 */
export class SupervisorAgent {
  private workers: Map<string, WorkerAgent>;

  constructor(private llm: LLMClient) {
    this.workers = new Map([
      ['Researcher', new ResearcherAgent(llm)],
      ['Writer', new WriterAgent(llm)],
      ['Reviewer', new ReviewerAgent(llm)],
      ['Editor', new EditorAgent(llm)],
      ['FactChecker', new FactCheckerAgent(llm)],
    ]);
  }

  createRunState(
    task: string,
    maxIterations: number,
    options?: { hitl?: boolean; memoryContext?: string }
  ): SupervisorRunState {
    const userContent = this.buildUserTaskContent(task, options?.memoryContext);
    return {
      messages: [
        { role: 'system', content: SUPERVISOR_PROMPT },
        { role: 'user', content: userContent },
      ],
      results: new Map(),
      trace: [],
      supervisorTurn: 0,
      maxIterations,
      hitl: options?.hitl ?? false,
      pendingDelegations: undefined,
    };
  }

  async run(
    task: string,
    maxIterations: number = 5,
    options?: { memoryContext?: string }
  ): Promise<SupervisorResult> {
    const state = this.createRunState(task, maxIterations, {
      hitl: false,
      memoryContext: options?.memoryContext,
    });
    const out = await this.continueRun(state);
    if (out.status === 'awaiting_approval') {
      return {
        result: 'Unexpected HITL pause in non-interactive run.',
        stepsTaken: out.stepsTaken,
        trace: out.trace,
      };
    }
    return {
      result: out.result,
      stepsTaken: out.stepsTaken,
      trace: out.trace,
    };
  }

  /**
   * Advance a run until the next HITL pause or completion.
   */
  async continueRun(state: SupervisorRunState): Promise<RunContinuationResult> {
    while (state.supervisorTurn < state.maxIterations) {
      const response = await this.llm.chat(state.messages);
      state.messages.push({ role: 'assistant', content: response });
      state.trace.push({ type: 'supervisor', content: response });
      state.supervisorTurn++;

      if (response.includes('FINAL:')) {
        const final = response.split('FINAL:').pop()?.trim() || '';
        return {
          status: 'completed',
          result: final,
          trace: [...state.trace],
          stepsTaken: state.results.size,
        };
      }

      let delegations = parseDelegations(response);
      if (delegations.length === 0) {
        continue;
      }

      delegations = delegations.filter((d) => {
        if (this.workers.has(d.agent)) {
          return true;
        }
        state.trace.push({
          type: 'note',
          message: `Unknown agent "${d.agent}" — skipped.`,
        });
        return false;
      });

      if (delegations.length === 0) {
        continue;
      }

      if (state.hitl) {
        state.pendingDelegations = delegations;
        return {
          status: 'awaiting_approval',
          pending: delegations,
          trace: [...state.trace],
          stepsTaken: state.results.size,
        };
      }

      await this.executeDelegations(state, delegations);
    }

    const result = this.forceFinalFromState(state);
    return {
      status: 'completed',
      result,
      trace: [...state.trace],
      stepsTaken: state.results.size,
    };
  }

  /**
   * Execute pending delegations after human approval (or non-HITL path).
   */
  async executePendingDelegations(
    state: SupervisorRunState,
    delegations: Delegation[]
  ): Promise<void> {
    await this.executeDelegations(state, delegations);
    state.pendingDelegations = undefined;
  }

  private buildUserTaskContent(task: string, memoryContext?: string): string {
    if (memoryContext?.trim()) {
      return `Task: ${task}\n\nSession memory (prior runs):\n${memoryContext.trim()}`;
    }
    return `Task: ${task}`;
  }

  private async executeDelegations(
    state: SupervisorRunState,
    delegations: Delegation[]
  ): Promise<void> {
    const turn = state.supervisorTurn;
    const ordered = [...delegations].sort((a, b) =>
      a.agent.localeCompare(b.agent)
    );

    for (const d of ordered) {
      state.trace.push({
        type: 'delegate',
        agent: d.agent,
        task: d.task,
      });
    }

    const executions = ordered.map(async (d, idx) => {
      const worker = this.workers.get(d.agent)!;
      const context = this.getContextFromState(state);
      const output = await worker.execute(d.task, context);
      return { d, idx, output };
    });

    const settled = await Promise.all(executions);

    for (const { d, idx, output } of settled) {
      const key = `${d.agent}_${turn}_${idx}`;
      state.results.set(key, output);
      state.trace.push({
        type: 'worker_result',
        agent: d.agent,
        output,
      });
      state.messages.push({
        role: 'user',
        content: `Result from ${d.agent}:\n${output}`,
      });
    }
  }

  private getContextFromState(state: SupervisorRunState): string {
    if (state.results.size === 0) {
      return '';
    }
    const parts: string[] = [];
    for (const [key, value] of state.results) {
      parts.push(`--- ${key} ---\n${value}`);
    }
    return parts.join('\n\n');
  }

  private forceFinalFromState(state: SupervisorRunState): string {
    if (state.results.size > 0) {
      const writerResults = Array.from(state.results.entries())
        .filter(([key]) => key.includes('Writer'))
        .map(([, value]) => value);

      if (writerResults.length > 0) {
        return writerResults[writerResults.length - 1];
      }

      const values = Array.from(state.results.values());
      return values[values.length - 1];
    }

    return 'Unable to complete task.';
  }
}
