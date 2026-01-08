---
marp: true
theme: default
paginate: true
header: 'Agentic AI Training'
footer: 'Day 3 - Agent Architectures'
style: |
  section {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  code {
    background-color: #1e1e1e;
    color: #d4d4d4;
  }
  pre {
    background-color: #1e1e1e;
    border-radius: 8px;
  }
---

<!-- _class: lead -->
# Day 3: Agent Architectures

## Agentic AI Training Program

**Building intelligent systems that act autonomously**

---

# Learning Objectives

By the end of Day 3, you will be able to:

- Explain what makes an AI "agent" vs. a simple LLM call
- Implement tool-use and function calling
- Apply agent patterns (ReAct, Planning, Verification)
- Design and build multi-agent systems
- Choose the right framework for different agent needs

---

# What Makes an "Agent"?

An agent is an LLM-powered system that can:

1. **Perceive** - Receive inputs from environment
2. **Reason** - LLM processing and decision making
3. **Act** - Execute tools/actions
4. **Iterate** - Loop until task is complete

---

# The Agent Loop

```
┌─────────────────────────────────────────────────────────────┐
│                     THE AGENT LOOP                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ┌─────────────┐                          │
│                    │   OBSERVE   │ ◄──────────────┐         │
│                    └──────┬──────┘                │         │
│                           │                       │         │
│                           ▼                       │         │
│                    ┌─────────────┐                │         │
│                    │    THINK    │            Results       │
│                    │    (LLM)    │                │         │
│                    └──────┬──────┘                │         │
│                           │                       │         │
│                           ▼                       │         │
│                    ┌─────────────┐                │         │
│          ┌─────────│   DECIDE    │─────────┐      │         │
│          │         └─────────────┘         │      │         │
│          ▼                                 ▼      │         │
│   ┌─────────────┐                   ┌──────────┐  │         │
│   │  USE TOOL   │───────────────────│   DONE   │  │         │
│   └─────────────┘                   └──────────┘  │         │
│          │                                        │         │
│          └────────────────────────────────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# Agent vs. Simple LLM Call

| Simple LLM Call | Agent |
|-----------------|-------|
| Single request → response | Iterative loop |
| No external actions | Uses tools/APIs |
| Stateless | Maintains state/memory |
| Deterministic flow | Dynamic based on results |
| Human controls iteration | Agent controls iteration |

---

# Core Agent Components

```python
@dataclass
class AgentState:
    messages: List[Dict[str, str]]
    tool_results: List[Any]
    iterations: int
    is_complete: bool

class Agent:
    def __init__(self, llm, tools, system_prompt, max_iterations):
        self.llm = llm
        self.tools = {t.name: t for t in tools}
        self.system_prompt = system_prompt
        self.max_iterations = max_iterations

    def run(self, user_input: str) -> str:
        state = AgentState(...)
        while not state.is_complete and state.iterations < self.max_iterations:
            state = self._step(state)
        return state.messages[-1]["content"]
```

---

# Agent Memory Types

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT MEMORY TYPES                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SHORT-TERM MEMORY          │  LONG-TERM MEMORY             │
│  ─────────────────          │  ────────────────             │
│  • Current conversation     │  • Persisted to database      │
│  • Tool results             │  • User preferences           │
│  • Lives in context window  │  • Past interactions          │
│  • Lost when cleared        │  • Retrieved via RAG          │
│                             │                               │
│  WORKING MEMORY             │  EPISODIC MEMORY              │
│  ──────────────             │  ───────────────              │
│  • Scratchpad for reasoning │  • Past task summaries        │
│  • Intermediate results     │  • "X worked/failed before"   │
│  • Plan execution state     │  • Helps learn from exp.      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

<!-- _class: lead -->
# Tool-Use & Function Calling

---

# What is Function Calling?

LLMs can request execution of predefined functions with structured arguments:

```
┌────────────────────────────────────────────────────────────┐
│                 FUNCTION CALLING FLOW                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  1. Define tools → 2. Send to LLM → 3. LLM decides →       │
│  4. Execute → 5. Return result → 6. LLM uses result        │
│                                                            │
│  User: "What's the weather in Paris?"                      │
│                                                            │
│  LLM thinks: "I need to use the weather tool"              │
│       ↓                                                    │
│  Tool call: get_weather(location="Paris")                  │
│       ↓                                                    │
│  Result: {"temp": 22, "conditions": "sunny"}               │
│       ↓                                                    │
│  LLM: "It's currently 22°C and sunny in Paris!"            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

# Tool Definition Example

```python
def read_file_tool():
    return {
        "name": "read_file",
        "description": """Read the contents of a file at the given path.
Use this when you need to examine file contents.
Returns the full file content as a string.
Returns an error message if the file doesn't exist.""",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Path to the file to read"
                }
            },
            "required": ["file_path"]
        }
    }
```

---

# Tool Description Best Practices

| Do | Don't |
|----|-------|
| Explain **when** to use the tool | Be vague about purpose |
| Describe **return values** | Leave output unclear |
| Mention **error conditions** | Assume always succeeds |
| Use **clear parameter names** | Use ambiguous names |
| Provide **sensible defaults** | Require unnecessary params |

---

# Anthropic Tool Calling

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    tools=[{
        "name": "get_weather",
        "description": "Get current weather for a location",
        "input_schema": {
            "type": "object",
            "properties": {
                "location": {"type": "string"}
            },
            "required": ["location"]
        }
    }],
    messages=[{"role": "user", "content": "What's the weather in Tokyo?"}]
)
```

---

# OpenAI Tool Calling

```python
from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "What's the weather in Tokyo?"}],
    tools=[{
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current weather for a location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string"}
                },
                "required": ["location"]
            }
        }
    }]
)
```

---

# Processing Tool Calls

```python
# After getting response with tool calls
if response.tool_calls:
    for tool_call in response.tool_calls:
        # Execute the tool
        result = execute_tool(
            name=tool_call.name,
            arguments=tool_call.arguments
        )

        # Add result to conversation
        messages.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": json.dumps(result)
        })

    # Continue conversation with tool results
    final_response = client.chat(messages=messages)
```

---

<!-- _class: lead -->
# Agent Patterns
<!-- Day 3 New Slides: Context Management, Memory Systems, Structured Output -->

<!-- Insert after Tool-Use section, before Agent Patterns -->

---

<!-- _class: lead -->
# Context Management
## **NEW**: Managing Long Conversations

---

# The Context Problem

**Challenge:**
- Claude: 200K tokens (~$50/million)
- GPT-4: 128K tokens (~$30/million)
- Conversations grow unbounded
- Performance degrades with long contexts

**Solution: Context Management Strategies**

---

# Context Management Strategies

| Strategy | When to Use | Pros | Cons |
|----------|-------------|------|------|
| **Sliding Window** | Uniform importance | Simple, predictable | Loses old context |
| **Summarization** | Long conversations | Preserves key info | May miss details |
| **Selective Retention** | Mixed importance | Keeps what matters | Needs scoring function |
| **External Memory** | Very long-term | Unlimited history | Adds latency |

---

# Sliding Window

Keep recent N messages, drop oldest:

```python
class ContextWindow:
    def __init__(self, max_messages=10):
        self.messages = []
        self.max_messages = max_messages

    def add_message(self, role, content):
        self.messages.append({"role": role, "content": content})

        # Keep only recent messages
        if len(self.messages) > self.max_messages:
            self.messages = self.messages[-self.max_messages:]
```

**Best for:** Short tasks, uniform message importance

---

# Rolling Summarization

Periodically summarize old messages:

```
Messages 1-10 → Summarize
Messages 11-20 → Keep
New message → Add

Context = [Summary] + [Recent 10 messages]
```

**Savings:** 500 tokens → 100 token summary (80% reduction)

**Best for:** Long conversations where context matters

---

# Selective Retention

Keep important messages, drop routine ones:

```python
def importance_scorer(message):
    content = message["content"].lower()
    score = 0.5  # baseline

    if any(word in content for word in ["error", "bug"]):
        score += 0.3
    if any(word in content for word in ["ok", "thanks"]):
        score -= 0.2

    return score
```

**Best for:** Mixed-importance conversations

---

# Context Management Best Practices

1. **Always preserve system prompt** - Never drop it
2. **Monitor token usage** - Log context size and costs
3. **Test with long conversations** - Verify behavior at limits
4. **Combine strategies** - Use summarization + selective retention
5. **Make it configurable** - Different tasks need different strategies

---

<!-- _class: lead -->
# Memory Systems
## **NEW**: Long-Term & Episodic Memory

---

# Memory Types for Agents

```
┌─────────────────────────────────────────┐
│   SHORT-TERM MEMORY                     │
│   • Current conversation                │
│   • Lives in context window             │
│   • Lost when context is cleared        │
├─────────────────────────────────────────┤
│   LONG-TERM MEMORY                      │
│   • Persisted to Vector DB              │
│   • User preferences, facts             │
│   • Retrieved via semantic search       │
├─────────────────────────────────────────┤
│   EPISODIC MEMORY                       │
│   • Past task completions               │
│   • "I did X before and it worked"      │
│   • Helps agent learn from experience   │
└─────────────────────────────────────────┘
```

---

# Long-Term Memory with Vector DB

```python
class LongTermMemory:
    def __init__(self, embedding_fn):
        self.vector_db = ChromaDB()
        self.embed = embedding_fn

    def store(self, content, metadata=None):
        """Store a memory."""
        self.vector_db.add(
            embedding=self.embed(content),
            text=content,
            metadata=metadata
        )

    def recall(self, query, n_results=5):
        """Recall relevant memories."""
        return self.vector_db.query(
            query_embedding=self.embed(query),
            n_results=n_results
        )
```

---

# Episodic Memory - Task History

Track past task completions:

```python
@dataclass
class Episode:
    task: str
    outcome: str  # "success" or "failure"
    steps_taken: List[str]
    duration_seconds: float
    learning: Optional[str]

episodic_memory.record(Episode(
    task="Migrate Express to FastAPI",
    outcome="success",
    steps_taken=["Analyzed routes", "Created FastAPI equivalents", ...],
    duration_seconds=1847.5,
    learning="FastAPI's Depends() is cleaner than Express middleware"
))
```

---

# Using Memory in Agents

```python
async def process(user_input):
    # 1. Recall relevant long-term memories
    memories = long_term.recall(user_input, n_results=3)

    # 2. Find similar past tasks
    similar = episodic.find_similar_tasks(user_input)

    # 3. Build enhanced prompt
    prompt = f"""
    Relevant memories: {memories}
    Past similar tasks: {similar}
    Current request: {user_input}
    """

    # 4. Process with full context
    return await llm.complete(prompt)
```

---

# Memory Systems Key Takeaways

1. **Short-term = Context window** - Current conversation
2. **Long-term = Vector DB** - Persistent facts and preferences
3. **Episodic = Task history** - Learn from past successes/failures
4. **Combine all three** - For truly intelligent agents
5. **Cost-benefit trade-off** - More memory = more tokens

---

<!-- _class: lead -->
# Structured Output & Validation
## **NEW**: Reliable, Type-Safe Outputs

---

# The Structured Output Problem

**Without validation:**
```json
{
  "name": "John",
  "age": "thirty",  // ❌ Should be number
  "email": "invalid" // ❌ Not an email
}
```

**Result:** Your code crashes!

**Solution:** Schema validation with Pydantic/Zod

---

# Three Levels of Structure

| Level | Reliability | Implementation |
|-------|-------------|----------------|
| **1. Prompt-based** | ⭐ Low | "Return JSON with fields..." |
| **2. JSON Mode** | ⭐⭐ Medium | Tell LLM to return valid JSON |
| **3. Schema Enforcement** | ⭐⭐⭐ High | Pydantic/Zod validation + retry |

**Production systems need Level 3!**

---

# Schema Enforcement with Pydantic

```python
from pydantic import BaseModel, EmailStr

class UserInfo(BaseModel):
    name: str
    age: int  # Must be integer
    email: EmailStr  # Must be valid email

# Get LLM response
response = llm.complete(prompt)

# Validate
try:
    user = UserInfo.model_validate(response)
    # ✅ Type-safe, validated!
except ValidationError as e:
    # ❌ Retry with error feedback
    retry_with_feedback(e)
```

---

# Smart Retry with Validation Feedback

```python
def get_validated_output(prompt, schema, max_retries=3):
    for attempt in range(max_retries):
        response = llm.complete(prompt)

        try:
            return schema.model_validate(response)
        except ValidationError as e:
            # Tell LLM what was wrong
            prompt += f"\n\nError: {e}\nPlease fix and try again."

    raise ValueError("Failed after retries")
```

**Result:** 95%+ success rate on first try, 99%+ after retries

---

# Structured Output Best Practices

1. **Always use schemas in production**
2. **Implement retries** - LLMs occasionally fail
3. **Provide specific error feedback** - Tell LLM what was wrong
4. **Use type-safe schemas** - Pydantic (Python) or Zod (TypeScript)
5. **Test edge cases** - Empty arrays, null values, boundaries
6. **Log failures** - Track and improve over time

---

# Structured Output Key Takeaways

1. **Never trust raw LLM output** - Always validate
2. **Use schema libraries** - Pydantic/Zod, not manual checks
3. **Retry with feedback** - Tell LLM what was wrong
4. **Type safety** - IDE autocomplete, compile-time checks
5. **Production reliability** - From 60% to 99%+ accuracy

---

---

# ReAct Pattern

**Reasoning + Acting** - Think before each action

```
┌──────────────────────────────────────────────────────────────┐
│                      ReAct Pattern                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Task: "Find the CEO of the company that made the iPhone"    │
│                                                              │
│  Thought 1: I need to find which company makes the iPhone    │
│  Action 1: search("iPhone manufacturer")                     │
│  Observation 1: Apple Inc. manufactures the iPhone           │
│                                                              │
│  Thought 2: Now I need to find Apple's CEO                   │
│  Action 2: search("Apple Inc CEO 2024")                      │
│  Observation 2: Tim Cook is the CEO of Apple Inc.            │
│                                                              │
│  Thought 3: I now have the answer                            │
│  Action 3: finish("Tim Cook")                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

# ReAct System Prompt

```
You are an assistant that uses tools to answer questions.

For each step, provide:
1. Thought: Explain your reasoning
2. Action: Choose a tool to use
3. Wait for Observation

Continue until you have enough information to answer.

Available tools:
- search(query): Search the web
- calculate(expression): Evaluate math
- finish(answer): Provide final answer

Always explain your thinking before acting.
```

---

# Planning Pattern

**Plan first, then execute** steps systematically

```
┌──────────────────────────────────────────────────────────────┐
│                    Planning Pattern                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Task: "Migrate this Express app to FastAPI"                 │
│                                                              │
│  PLAN:                                                       │
│  1. Analyze current Express routes                           │
│  2. Map Express patterns to FastAPI equivalents              │
│  3. Convert middleware to FastAPI dependencies               │
│  4. Migrate route handlers one by one                        │
│  5. Update database connections                              │
│  6. Write tests for migrated routes                          │
│  7. Verify all endpoints work                                │
│                                                              │
│  EXECUTE: [Step 1 of 7] Analyzing Express routes...          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

# Planning Implementation

```python
class PlanningAgent:
    def run(self, task: str) -> str:
        # Phase 1: Create plan
        plan = self.create_plan(task)

        # Phase 2: Execute each step
        results = []
        for i, step in enumerate(plan.steps):
            self.update_status(f"Executing step {i+1}/{len(plan.steps)}")
            result = self.execute_step(step, results)
            results.append(result)

            # Re-evaluate plan if needed
            if result.requires_replan:
                plan = self.replan(task, results)

        # Phase 3: Synthesize results
        return self.synthesize(task, results)
```

---

# Verification Pattern

**Verify outputs** before returning

```
┌──────────────────────────────────────────────────────────────┐
│                   Verification Pattern                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Generate → Verify → Fix (if needed) → Return                │
│                                                              │
│  Example: Generate SQL query                                 │
│                                                              │
│  1. Generate: SELECT * FROM users WHERE id = 1               │
│                                                              │
│  2. Verify:                                                  │
│     - Syntax valid? ✓                                        │
│     - Tables exist? ✓                                        │
│     - No SQL injection? ✓                                    │
│     - Returns expected schema? ✓                             │
│                                                              │
│  3. Return verified query                                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

# State Machine for Workflows

Define **explicit states** for complex processes:

```python
class MigrationState(Enum):
    ANALYZING = "analyzing"
    PLANNING = "planning"
    EXECUTING = "executing"
    VERIFYING = "verifying"
    COMPLETE = "complete"
    FAILED = "failed"

def get_next_state(current: MigrationState, result: StepResult) -> MigrationState:
    transitions = {
        MigrationState.ANALYZING: MigrationState.PLANNING,
        MigrationState.PLANNING: MigrationState.EXECUTING,
        MigrationState.EXECUTING: MigrationState.VERIFYING,
        MigrationState.VERIFYING: MigrationState.COMPLETE,
    }
    if result.has_error:
        return MigrationState.FAILED
    return transitions.get(current, MigrationState.FAILED)
```

---

# Workflow State Diagram

```
┌──────────────────────────────────────────────────────────────┐
│               Migration Workflow States                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                      ┌───────────┐                           │
│         ┌───────────▶│ ANALYZING │                           │
│         │            └─────┬─────┘                           │
│         │                  │                                 │
│         │                  ▼                                 │
│         │            ┌───────────┐                           │
│         │            │ PLANNING  │                           │
│    RETRY │            └─────┬─────┘                          │
│         │                  │                                 │
│         │                  ▼                                 │
│         │            ┌───────────┐                           │
│         └────────────│ EXECUTING │                           │
│                      └─────┬─────┘                           │
│                            │                                 │
│                            ▼                                 │
│                      ┌───────────┐      ┌────────┐           │
│                      │ VERIFYING │─────▶│COMPLETE│           │
│                      └─────┬─────┘      └────────┘           │
│                            │                                 │
│                            ▼                                 │
│                      ┌────────┐                              │
│                      │ FAILED │                              │
│                      └────────┘                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

# Error Handling Strategies

```python
class AgentErrorHandler:
    def __init__(self, max_retries: int = 3):
        self.max_retries = max_retries

    def handle_tool_error(self, error: Exception, context: dict) -> Action:
        """Decide what to do when a tool fails."""

        if isinstance(error, RateLimitError):
            return Action.WAIT_AND_RETRY

        if isinstance(error, AuthenticationError):
            return Action.FAIL_IMMEDIATELY

        if isinstance(error, ToolNotFoundError):
            return Action.USE_ALTERNATIVE_TOOL

        if context['retry_count'] < self.max_retries:
            return Action.RETRY_WITH_BACKOFF

        return Action.ASK_FOR_HELP
```

---

<!-- _class: lead -->
# Multi-Agent Systems

---

# Why Multi-Agent?

Single agents have limitations:

- Context window limits
- Single point of failure
- Complex tasks need specialization
- Parallel processing needs

**Multi-agent solutions:**
- **Divide and conquer** complex tasks
- **Specialist agents** for different domains
- **Redundancy** and error recovery
- **Parallel execution** for speed

---

# Multi-Agent Patterns

```
┌─────────────────────────────────────────────────────────────┐
│               MULTI-AGENT ARCHITECTURES                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SUPERVISOR                        PEER-TO-PEER             │
│  ──────────                        ────────────             │
│       ┌───┐                        ┌───┐ ←→ ┌───┐           │
│       │ S │                        │ A │    │ B │           │
│       └─┬─┘                        └───┘ ←→ └───┘           │
│    ┌────┼────┐                       ↕       ↕              │
│    ▼    ▼    ▼                     ┌───┐ ←→ ┌───┐           │
│  ┌───┐┌───┐┌───┐                   │ C │    │ D │           │
│  │ A ││ B ││ C │                   └───┘    └───┘           │
│  └───┘└───┘└───┘                                            │
│                                                             │
│  HIERARCHICAL                      PIPELINE                 │
│  ────────────                      ────────                 │
│       ┌───┐                        ┌───┐→┌───┐→┌───┐        │
│       │ M │                        │ A │ │ B │ │ C │        │
│       └─┬─┘                        └───┘ └───┘ └───┘        │
│    ┌────┼────┐                                              │
│    ▼    ▼    ▼                                              │
│  ┌─┴─┐┌─┴─┐┌─┴─┐                                            │
│  │S1 ││S2 ││S3 │                                            │
│  └─┬─┘└─┬─┘└─┬─┘                                            │
│    │    │    │                                              │
│   ▼▼   ▼▼   ▼▼                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# Supervisor Pattern

```python
class SupervisorAgent:
    """Coordinates multiple worker agents."""

    def __init__(self, workers: List[Agent]):
        self.workers = {w.name: w for w in workers}

    def run(self, task: str) -> str:
        # Plan which workers to use
        plan = self.plan_task(task)

        results = {}
        for step in plan:
            worker = self.workers[step.worker_name]
            result = worker.run(step.subtask)
            results[step.id] = result

            # Supervisor checks result
            if not self.is_satisfactory(result):
                result = self.handle_unsatisfactory(step, result)

        # Synthesize final answer
        return self.synthesize(results)
```

---

# Worker Agent Types

```
┌──────────────────────────────────────────────────────────────┐
│                   SPECIALIZED WORKERS                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  RESEARCHER                    CODER                         │
│  ──────────                    ─────                         │
│  • Searches web/docs           • Writes code                 │
│  • Summarizes findings         • Runs tests                  │
│  • Cites sources               • Debugs issues               │
│                                                              │
│  REVIEWER                      WRITER                        │
│  ────────                      ──────                        │
│  • Checks quality              • Creates documentation       │
│  • Identifies issues           • Formats output              │
│  • Suggests improvements       • Generates reports           │
│                                                              │
│  VALIDATOR                     PLANNER                       │
│  ─────────                     ───────                       │
│  • Verifies outputs            • Creates plans               │
│  • Runs sanity checks          • Breaks down tasks           │
│  • Confirms correctness        • Prioritizes steps           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

# Agent Communication

```python
@dataclass
class AgentMessage:
    from_agent: str
    to_agent: str
    content: str
    message_type: str  # "request", "response", "broadcast"
    metadata: Dict[str, Any]

class MessageBus:
    """Central communication hub for agents."""

    def __init__(self):
        self.subscribers: Dict[str, List[Callable]] = {}

    def subscribe(self, agent_id: str, callback: Callable):
        self.subscribers.setdefault(agent_id, []).append(callback)

    def publish(self, message: AgentMessage):
        for callback in self.subscribers.get(message.to_agent, []):
            callback(message)
```

---

<!-- _class: lead -->
# Framework Comparison

---

# When to Use What

| Use Case | Recommended Approach |
|----------|---------------------|
| Simple tool use | Native SDK (Anthropic/OpenAI) |
| Basic agent loop | Custom implementation |
| Complex workflows | LangGraph |
| Multi-agent teams | CrewAI or custom |
| Rapid prototyping | LangChain |
| Enterprise integration | Semantic Kernel |

---

# Framework Quick Comparison

| Framework | Strengths | Best For |
|-----------|-----------|----------|
| **Native SDKs** | Full control, minimal deps | Simple agents |
| **LangChain** | Rich ecosystem, quick start | Prototyping |
| **LangGraph** | State machines, complex flows | Workflows |
| **CrewAI** | Multi-agent, role-based | Team simulation |
| **AutoGen** | Conversational agents | Chat-based |

---

# Lab 03: Migration Workflow Agent

**Project: Framework Migration Agent**

You'll build:
- Multi-phase workflow (Analyze → Plan → Execute → Verify)
- State machine for process control
- Tool-using agent with file operations
- Progress tracking and reporting

```bash
# Navigate to the lab
cd labs/lab03-migration-workflow

# Read the instructions
cat README.md
```

---

# Day 3 Key Takeaways

1. **Agents = LLM + Tools + Loop** - Not just a single call
2. **Tools need good descriptions** - Help the LLM use them correctly
3. **ReAct = Think before act** - Explicit reasoning improves results
4. **State machines control flow** - Define explicit transitions
5. **Multi-agent for complexity** - Divide and conquer

---

# What's Next: Day 4

**RAG & Evaluation**

- Retrieval-Augmented Generation fundamentals
- Chunking strategies for different content types
- Embedding models and vector databases
- Evaluation metrics and debugging

---

<!-- _class: lead -->
# Questions?

**Lab 03 awaits!**

```
cd labs/lab03-migration-workflow
```
