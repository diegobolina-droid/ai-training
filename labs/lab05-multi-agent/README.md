# Lab 05: Multi-Agent Orchestration

## Objective
Build a quick multi-agent system using the supervisor pattern.

**Time Allotted**: 30 minutes

## Learning Goals
- Implement supervisor pattern for agent coordination
- Build specialized worker agents
- Orchestrate multi-step workflows

---

## What You'll Build

A mini research assistant with:
- **Supervisor Agent**: Coordinates workers and synthesizes results
- **Researcher Agent**: Finds and summarizes information
- **Writer Agent**: Produces polished output

```
┌─────────────────────────────────────────────────────────────┐
│                  Multi-Agent Architecture                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ┌─────────────┐                          │
│                    │ SUPERVISOR  │                          │
│                    │    AGENT    │                          │
│                    └──────┬──────┘                          │
│                           │                                 │
│              ┌────────────┼────────────┐                    │
│              │            │            │                    │
│              ▼            ▼            ▼                    │
│       ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│       │RESEARCHER│ │  WRITER  │ │ REVIEWER │               │
│       │  AGENT   │ │  AGENT   │ │  AGENT   │               │
│       └──────────┘ └──────────┘ └──────────┘               │
│                                                             │
│   Flow:                                                     │
│   1. Supervisor receives task                               │
│   2. Delegates research to Researcher                       │
│   3. Sends research to Writer for polishing                 │
│   4. Optionally sends to Reviewer                           │
│   5. Supervisor synthesizes final output                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation

### agents.py - Worker Agents

```python
"""Worker agents for the multi-agent system."""

RESEARCHER_PROMPT = """You are a research specialist.
Your job is to gather and summarize information on a given topic.

For the given topic:
1. Identify key facts and concepts
2. Note important details
3. Highlight relationships between ideas
4. Summarize findings clearly

Be factual and cite what you're basing your information on."""

WRITER_PROMPT = """You are a professional writer.
Your job is to take research and turn it into polished content.

Given research material:
1. Organize information logically
2. Write clear, engaging prose
3. Use appropriate formatting
4. Ensure flow and readability

Match the requested tone and format."""

REVIEWER_PROMPT = """You are a content reviewer.
Your job is to review content for quality and accuracy.

For the given content:
1. Check for factual accuracy
2. Identify unclear sections
3. Suggest improvements
4. Rate overall quality (1-10)

Be constructive in your feedback."""

class WorkerAgent:
    """Base class for worker agents."""

    def __init__(self, llm_client, system_prompt: str, name: str):
        self.llm = llm_client
        self.system_prompt = system_prompt
        self.name = name

    def execute(self, task: str, context: str = "") -> str:
        """Execute a task and return result."""
        user_prompt = task
        if context:
            user_prompt = f"Context:\n{context}\n\nTask:\n{task}"

        response = self.llm.chat([
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_prompt}
        ])

        return response

class ResearcherAgent(WorkerAgent):
    def __init__(self, llm_client):
        super().__init__(llm_client, RESEARCHER_PROMPT, "Researcher")

class WriterAgent(WorkerAgent):
    def __init__(self, llm_client):
        super().__init__(llm_client, WRITER_PROMPT, "Writer")

class ReviewerAgent(WorkerAgent):
    def __init__(self, llm_client):
        super().__init__(llm_client, REVIEWER_PROMPT, "Reviewer")
```

### supervisor.py - Supervisor Agent

```python
"""Supervisor agent that coordinates workers."""
from typing import Dict, List
from agents import ResearcherAgent, WriterAgent, ReviewerAgent

SUPERVISOR_PROMPT = """You are a supervisor managing a team of specialized agents.

Available agents:
- Researcher: Finds and summarizes information
- Writer: Creates polished content from research
- Reviewer: Reviews content for quality

Your job:
1. Analyze the incoming task
2. Decide which agent(s) to use
3. Coordinate their work
4. Synthesize the final output

For each step, output in this format:
DELEGATE: [agent_name]
TASK: [specific task for that agent]

When all work is done, output:
FINAL: [synthesized final output]"""

class SupervisorAgent:
    """Supervisor that coordinates worker agents."""

    def __init__(self, llm_client):
        self.llm = llm_client

        # Initialize workers
        self.workers = {
            "Researcher": ResearcherAgent(llm_client),
            "Writer": WriterAgent(llm_client),
            "Reviewer": ReviewerAgent(llm_client)
        }

        self.results = {}

    def run(self, task: str, max_iterations: int = 5) -> str:
        """Run the multi-agent workflow."""
        messages = [
            {"role": "system", "content": SUPERVISOR_PROMPT},
            {"role": "user", "content": f"Task: {task}"}
        ]

        for i in range(max_iterations):
            # Get supervisor decision
            response = self.llm.chat(messages)
            messages.append({"role": "assistant", "content": response})

            # Check if done
            if "FINAL:" in response:
                final = response.split("FINAL:")[-1].strip()
                return final

            # Parse and execute delegation
            if "DELEGATE:" in response and "TASK:" in response:
                agent_name = response.split("DELEGATE:")[-1].split("TASK:")[0].strip()
                agent_task = response.split("TASK:")[-1].strip()

                if agent_name in self.workers:
                    # Execute worker
                    context = self._get_context()
                    result = self.workers[agent_name].execute(agent_task, context)

                    # Store result
                    self.results[f"{agent_name}_{i}"] = result

                    # Feed back to supervisor
                    messages.append({
                        "role": "user",
                        "content": f"Result from {agent_name}:\n{result}"
                    })

        return self._force_final()

    def _get_context(self) -> str:
        """Build context from previous results."""
        if not self.results:
            return ""

        parts = []
        for key, value in self.results.items():
            parts.append(f"--- {key} ---\n{value}")
        return "\n\n".join(parts)

    def _force_final(self) -> str:
        """Force final output if max iterations reached."""
        if self.results:
            # Return last writer result if available
            writer_results = [v for k, v in self.results.items() if "Writer" in k]
            if writer_results:
                return writer_results[-1]

            # Otherwise return last result
            return list(self.results.values())[-1]

        return "Unable to complete task."
```

### main.py - API

```python
"""Multi-agent API."""
from fastapi import FastAPI
from pydantic import BaseModel
from supervisor import SupervisorAgent
from llm_client import get_llm_client

app = FastAPI(title="Multi-Agent System")

llm = get_llm_client("anthropic")
supervisor = SupervisorAgent(llm)

class TaskRequest(BaseModel):
    task: str
    max_iterations: int = 5

class TaskResponse(BaseModel):
    result: str
    steps_taken: int

@app.post("/run", response_model=TaskResponse)
async def run_task(request: TaskRequest):
    """Run a multi-agent task."""
    # Reset for new task
    supervisor.results = {}

    result = supervisor.run(request.task, request.max_iterations)

    return TaskResponse(
        result=result,
        steps_taken=len(supervisor.results)
    )

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

---

## Quick Test

```bash
# Run the server
uvicorn main:app --reload

# Test with a research task
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Write a brief explanation of how RAG systems work for a technical blog post",
    "max_iterations": 5
  }'
```

Expected flow:
1. Supervisor delegates to Researcher to gather RAG information
2. Supervisor sends research to Writer for blog post format
3. Supervisor synthesizes final output

---

## Deliverables

- [ ] Working multi-agent system
- [ ] Supervisor + at least 2 worker agents
- [ ] Tested end-to-end workflow

---

## Extension Ideas (Post-Training)

1. **Parallel Workers**: Run independent workers in parallel
2. **Human Approval**: Add human-in-the-loop for important decisions
3. **Memory**: Add persistent memory across tasks
4. **More Workers**: Add specialized agents (Editor, Fact-Checker, etc.)

---

**Next**: [Capstone Project](../capstone-options/)
