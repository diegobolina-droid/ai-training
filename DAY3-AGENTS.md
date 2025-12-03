# Day 3: Agent Architectures

## Learning Objectives

By the end of Day 3, you will be able to:
- Explain what makes an AI "agent" vs. a simple LLM call
- Implement tool-use and function calling across LLM providers
- Apply agent patterns like ReAct, Planning, and Verification
- Design and build multi-agent systems
- Choose the right framework for different agent needs
- Build and deploy a complete migration workflow agent

---

## Table of Contents

1. [Agent Fundamentals](#fundamentals)
2. [Tool-Use & Function Calling](#tool-use)
3. [Agent Patterns](#patterns)
4. [Exercise 1: Design an Agent](#exercise-1)
5. [Multi-Agent Systems](#multi-agent)
6. [Framework Comparison](#frameworks)
7. [Lab 03: Migration Workflow Agent](#lab-03)

---

<a name="fundamentals"></a>
## 1. Agent Fundamentals (1 hour)

### 1.1 What Makes an "Agent"?

An **agent** is an LLM-powered system that can:
1. **Perceive** its environment (receive inputs)
2. **Reason** about what to do (LLM processing)
3. **Act** on the environment (use tools)
4. **Iterate** based on results (loop until done)

```
┌─────────────────────────────────────────────────────────────────┐
│                        The Agent Loop                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    ┌─────────────┐                              │
│                    │   OBSERVE   │ ◄───────────────┐            │
│                    └──────┬──────┘                 │            │
│                           │                        │            │
│                           ▼                        │            │
│                    ┌─────────────┐                 │            │
│                    │    THINK    │                 │ Results    │
│                    │    (LLM)    │                 │            │
│                    └──────┬──────┘                 │            │
│                           │                        │            │
│                           ▼                        │            │
│                    ┌─────────────┐                 │            │
│          ┌─────────│   DECIDE    │─────────┐      │            │
│          │         └─────────────┘         │      │            │
│          │                                 │      │            │
│          ▼                                 ▼      │            │
│   ┌─────────────┐                   ┌─────────────┐│            │
│   │  USE TOOL   │───────────────────│    DONE     ││            │
│   └─────────────┘                   └─────────────┘│            │
│          │                                         │            │
│          └─────────────────────────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Agent vs. Simple LLM Call:**

| Simple LLM Call | Agent |
|-----------------|-------|
| Single request → response | Iterative loop |
| No external actions | Uses tools/APIs |
| Stateless | Maintains state/memory |
| Deterministic flow | Dynamic based on results |
| Human controls iteration | Agent controls iteration |

### 1.2 Core Agent Components

```python
# Minimal agent structure
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class AgentState:
    """Represents the current state of an agent."""
    messages: List[Dict[str, str]]
    tool_results: List[Any]
    iterations: int
    is_complete: bool

class Tool(ABC):
    """Base class for agent tools."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Tool name for the LLM to reference."""
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        """Description of what the tool does."""
        pass

    @property
    @abstractmethod
    def parameters(self) -> Dict[str, Any]:
        """JSON schema for tool parameters."""
        pass

    @abstractmethod
    def execute(self, **kwargs) -> str:
        """Execute the tool and return result."""
        pass

class Agent:
    """Basic agent implementation."""

    def __init__(
        self,
        llm_client,
        tools: List[Tool],
        system_prompt: str,
        max_iterations: int = 10
    ):
        self.llm = llm_client
        self.tools = {t.name: t for t in tools}
        self.system_prompt = system_prompt
        self.max_iterations = max_iterations

    def run(self, user_input: str) -> str:
        """Run the agent loop."""
        state = AgentState(
            messages=[
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": user_input}
            ],
            tool_results=[],
            iterations=0,
            is_complete=False
        )

        while not state.is_complete and state.iterations < self.max_iterations:
            state = self._step(state)
            state.iterations += 1

        # Return final response
        return state.messages[-1]["content"]

    def _step(self, state: AgentState) -> AgentState:
        """Single step of the agent loop."""
        # Get LLM response with tool options
        response = self.llm.chat_with_tools(
            messages=state.messages,
            tools=list(self.tools.values())
        )

        # Check if LLM wants to use a tool
        if response.tool_calls:
            for tool_call in response.tool_calls:
                tool = self.tools[tool_call.name]
                result = tool.execute(**tool_call.arguments)
                state.tool_results.append(result)
                state.messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": result
                })
        else:
            # No tool call = final response
            state.messages.append({
                "role": "assistant",
                "content": response.content
            })
            state.is_complete = True

        return state
```

### 1.3 Memory Types

Agents need different types of memory:

```
┌─────────────────────────────────────────────────────────────────┐
│                       Agent Memory Types                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SHORT-TERM MEMORY                                              │
│  ─────────────────                                              │
│  • Current conversation messages                                │
│  • Tool results from current task                               │
│  • Lives in context window                                      │
│  • Lost when context is cleared                                 │
│                                                                 │
│  LONG-TERM MEMORY                                               │
│  ────────────────                                               │
│  • Persisted to database/file                                   │
│  • User preferences, past interactions                          │
│  • Retrieved via RAG or explicit query                          │
│  • Survives across sessions                                     │
│                                                                 │
│  EPISODIC MEMORY                                                │
│  ───────────────                                                │
│  • Summaries of past task completions                           │
│  • "I did X before and it worked/failed"                        │
│  • Helps agent learn from experience                            │
│                                                                 │
│  WORKING MEMORY                                                 │
│  ──────────────                                                 │
│  • Scratchpad for current reasoning                             │
│  • Intermediate results                                         │
│  • Plan execution state                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Memory Implementation:**
```python
from dataclasses import dataclass, field
from typing import List, Dict, Any
from datetime import datetime
import json

@dataclass
class MemoryEntry:
    content: str
    timestamp: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)

class AgentMemory:
    """Manages different types of agent memory."""

    def __init__(self, max_short_term: int = 50):
        self.short_term: List[MemoryEntry] = []
        self.long_term: List[MemoryEntry] = []  # Would be DB in production
        self.working: Dict[str, Any] = {}
        self.max_short_term = max_short_term

    def add_short_term(self, content: str, metadata: Dict = None):
        """Add to short-term memory with automatic pruning."""
        entry = MemoryEntry(
            content=content,
            timestamp=datetime.now(),
            metadata=metadata or {}
        )
        self.short_term.append(entry)

        # Prune if too long
        if len(self.short_term) > self.max_short_term:
            # Summarize and move to long-term
            self._consolidate_short_term()

    def add_long_term(self, content: str, metadata: Dict = None):
        """Add directly to long-term memory."""
        entry = MemoryEntry(
            content=content,
            timestamp=datetime.now(),
            metadata=metadata or {}
        )
        self.long_term.append(entry)

    def get_relevant(self, query: str, k: int = 5) -> List[str]:
        """Retrieve relevant memories (simplified - would use embeddings)."""
        # In production, use vector similarity
        all_memories = self.short_term + self.long_term
        # Simple keyword matching for demo
        relevant = [m for m in all_memories if any(
            word.lower() in m.content.lower()
            for word in query.split()
        )]
        return [m.content for m in relevant[:k]]

    def set_working(self, key: str, value: Any):
        """Set working memory value."""
        self.working[key] = value

    def get_working(self, key: str, default: Any = None) -> Any:
        """Get working memory value."""
        return self.working.get(key, default)

    def _consolidate_short_term(self):
        """Summarize old short-term memories and move to long-term."""
        # Keep last N entries
        keep = self.short_term[-10:]
        to_summarize = self.short_term[:-10]

        if to_summarize:
            # In production, use LLM to summarize
            summary = f"Summary of {len(to_summarize)} interactions"
            self.add_long_term(summary, {"type": "summary"})

        self.short_term = keep
```

### 1.4 State Management

```python
from enum import Enum
from typing import Optional
from dataclasses import dataclass, field

class AgentStatus(Enum):
    IDLE = "idle"
    THINKING = "thinking"
    EXECUTING = "executing"
    WAITING = "waiting"  # Waiting for external input
    COMPLETE = "complete"
    ERROR = "error"

@dataclass
class TaskState:
    """State for a single task."""
    task_id: str
    description: str
    status: AgentStatus = AgentStatus.IDLE
    steps_completed: List[str] = field(default_factory=list)
    current_step: Optional[str] = None
    result: Optional[Any] = None
    error: Optional[str] = None

@dataclass
class AgentContext:
    """Full agent context."""
    current_task: Optional[TaskState] = None
    task_history: List[TaskState] = field(default_factory=list)
    memory: AgentMemory = field(default_factory=AgentMemory)

    def start_task(self, task_id: str, description: str):
        """Start a new task."""
        self.current_task = TaskState(
            task_id=task_id,
            description=description,
            status=AgentStatus.THINKING
        )

    def complete_step(self, step: str):
        """Mark a step as complete."""
        if self.current_task:
            self.current_task.steps_completed.append(step)

    def finish_task(self, result: Any = None, error: str = None):
        """Finish the current task."""
        if self.current_task:
            if error:
                self.current_task.status = AgentStatus.ERROR
                self.current_task.error = error
            else:
                self.current_task.status = AgentStatus.COMPLETE
                self.current_task.result = result

            self.task_history.append(self.current_task)
            self.current_task = None
```

---

<a name="tool-use"></a>
## 2. Tool-Use & Function Calling (1 hour)

### 2.1 What is Function Calling?

Function calling lets LLMs request execution of predefined functions with structured arguments.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Function Calling Flow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Define tools → 2. Send to LLM → 3. LLM decides → 4. Execute │
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   Tools     │     │    LLM      │     │  Your Code  │       │
│  │ Definition  │────▶│  Decides    │────▶│  Executes   │       │
│  │             │     │  Which Tool │     │  The Tool   │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│                                                 │               │
│                                                 │               │
│  ┌─────────────┐     ┌─────────────┐           │               │
│  │   Final     │◀────│  LLM Uses   │◀──────────┘               │
│  │  Response   │     │   Result    │                           │
│  └─────────────┘     └─────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Tool Definition Best Practices

**Good Tool Definition:**
```python
# tools/file_tools.py
from typing import List, Optional

def read_file_tool():
    """Definition for a file reading tool."""
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
                    "description": "The absolute or relative path to the file to read"
                },
                "encoding": {
                    "type": "string",
                    "description": "File encoding (default: utf-8)",
                    "default": "utf-8"
                }
            },
            "required": ["file_path"]
        }
    }

def list_directory_tool():
    """Definition for a directory listing tool."""
    return {
        "name": "list_directory",
        "description": """List files and directories in a given path.
Use this to explore directory structure.
Returns a list of file/directory names with their types.""",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Directory path to list (default: current directory)",
                    "default": "."
                },
                "include_hidden": {
                    "type": "boolean",
                    "description": "Include hidden files (starting with .)",
                    "default": False
                },
                "recursive": {
                    "type": "boolean",
                    "description": "List recursively",
                    "default": False
                }
            },
            "required": []
        }
    }
```

**Tool Description Guidelines:**
| Do | Don't |
|----|-------|
| Explain when to use the tool | Be vague about purpose |
| Describe return values | Leave output unclear |
| Mention error conditions | Assume always succeeds |
| Use clear parameter names | Use ambiguous names |
| Provide sensible defaults | Require unnecessary params |

### 2.3 LLM-Agnostic Function Calling

Different providers have different formats. Here's a unified approach:

```python
# utils/function_calling.py
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class ToolCall:
    """Standardized tool call representation."""
    id: str
    name: str
    arguments: Dict[str, Any]

@dataclass
class ToolResult:
    """Result from executing a tool."""
    tool_call_id: str
    result: str
    error: Optional[str] = None

class FunctionCallingClient(ABC):
    """Base class for function-calling enabled clients."""

    @abstractmethod
    def chat_with_tools(
        self,
        messages: List[Dict[str, str]],
        tools: List[Dict[str, Any]]
    ) -> tuple[str, List[ToolCall]]:
        """
        Send messages with tools available.
        Returns (content, tool_calls).
        """
        pass

class OpenAIFunctionCalling(FunctionCallingClient):
    def __init__(self, model: str = "gpt-4o"):
        from openai import OpenAI
        self.client = OpenAI()
        self.model = model

    def chat_with_tools(
        self,
        messages: List[Dict[str, str]],
        tools: List[Dict[str, Any]]
    ) -> tuple[str, List[ToolCall]]:
        # Convert to OpenAI format
        openai_tools = [
            {"type": "function", "function": tool}
            for tool in tools
        ]

        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            tools=openai_tools if openai_tools else None
        )

        message = response.choices[0].message

        # Extract tool calls
        tool_calls = []
        if message.tool_calls:
            for tc in message.tool_calls:
                tool_calls.append(ToolCall(
                    id=tc.id,
                    name=tc.function.name,
                    arguments=json.loads(tc.function.arguments)
                ))

        return message.content or "", tool_calls

class AnthropicFunctionCalling(FunctionCallingClient):
    def __init__(self, model: str = "claude-3-5-sonnet-20241022"):
        from anthropic import Anthropic
        self.client = Anthropic()
        self.model = model

    def chat_with_tools(
        self,
        messages: List[Dict[str, str]],
        tools: List[Dict[str, Any]]
    ) -> tuple[str, List[ToolCall]]:
        # Convert to Anthropic format
        anthropic_tools = [
            {
                "name": tool["name"],
                "description": tool["description"],
                "input_schema": tool["parameters"]
            }
            for tool in tools
        ]

        # Extract system message
        system = None
        filtered_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system = msg["content"]
            else:
                filtered_messages.append(msg)

        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=system,
            messages=filtered_messages,
            tools=anthropic_tools if anthropic_tools else None
        )

        # Parse response
        content = ""
        tool_calls = []

        for block in response.content:
            if block.type == "text":
                content += block.text
            elif block.type == "tool_use":
                tool_calls.append(ToolCall(
                    id=block.id,
                    name=block.name,
                    arguments=block.input
                ))

        return content, tool_calls
```

### 2.4 Error Handling and Retries

```python
# tools/executor.py
from typing import Dict, Any, Callable, Optional
import traceback
import time

class ToolExecutor:
    """Executes tools with error handling and retries."""

    def __init__(
        self,
        tools: Dict[str, Callable],
        max_retries: int = 3,
        retry_delay: float = 1.0
    ):
        self.tools = tools
        self.max_retries = max_retries
        self.retry_delay = retry_delay

    def execute(
        self,
        tool_name: str,
        arguments: Dict[str, Any]
    ) -> ToolResult:
        """Execute a tool with retries and error handling."""

        if tool_name not in self.tools:
            return ToolResult(
                tool_call_id="",
                result="",
                error=f"Unknown tool: {tool_name}"
            )

        tool_func = self.tools[tool_name]
        last_error = None

        for attempt in range(self.max_retries):
            try:
                result = tool_func(**arguments)
                return ToolResult(
                    tool_call_id="",
                    result=str(result)
                )
            except Exception as e:
                last_error = e
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay * (attempt + 1))  # Exponential backoff

        # All retries failed
        return ToolResult(
            tool_call_id="",
            result="",
            error=f"Tool execution failed after {self.max_retries} attempts: {str(last_error)}\n{traceback.format_exc()}"
        )

    def execute_with_timeout(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        timeout: float = 30.0
    ) -> ToolResult:
        """Execute with timeout (using threading)."""
        import threading
        from queue import Queue

        result_queue = Queue()

        def run():
            result = self.execute(tool_name, arguments)
            result_queue.put(result)

        thread = threading.Thread(target=run)
        thread.start()
        thread.join(timeout=timeout)

        if thread.is_alive():
            return ToolResult(
                tool_call_id="",
                result="",
                error=f"Tool execution timed out after {timeout}s"
            )

        return result_queue.get()
```

### 2.5 Live Demo: File System Agent

```python
# demos/file_agent.py
"""Demo: Simple file system agent."""
import os
from pathlib import Path

# Tool implementations
def read_file(file_path: str, encoding: str = "utf-8") -> str:
    """Read file contents."""
    try:
        with open(file_path, 'r', encoding=encoding) as f:
            return f.read()
    except FileNotFoundError:
        return f"Error: File not found: {file_path}"
    except Exception as e:
        return f"Error reading file: {e}"

def list_directory(
    path: str = ".",
    include_hidden: bool = False,
    recursive: bool = False
) -> str:
    """List directory contents."""
    try:
        p = Path(path)
        if not p.exists():
            return f"Error: Path not found: {path}"

        if recursive:
            items = list(p.rglob("*"))
        else:
            items = list(p.iterdir())

        if not include_hidden:
            items = [i for i in items if not i.name.startswith('.')]

        result = []
        for item in sorted(items):
            item_type = "DIR" if item.is_dir() else "FILE"
            result.append(f"[{item_type}] {item}")

        return "\n".join(result) if result else "Directory is empty"
    except Exception as e:
        return f"Error listing directory: {e}"

def write_file(file_path: str, content: str) -> str:
    """Write content to file."""
    try:
        with open(file_path, 'w') as f:
            f.write(content)
        return f"Successfully wrote {len(content)} characters to {file_path}"
    except Exception as e:
        return f"Error writing file: {e}"

# Tool definitions
TOOLS = [
    {
        "name": "read_file",
        "description": "Read the contents of a file",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {"type": "string", "description": "Path to the file"},
                "encoding": {"type": "string", "default": "utf-8"}
            },
            "required": ["file_path"]
        }
    },
    {
        "name": "list_directory",
        "description": "List contents of a directory",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "default": "."},
                "include_hidden": {"type": "boolean", "default": False},
                "recursive": {"type": "boolean", "default": False}
            },
            "required": []
        }
    },
    {
        "name": "write_file",
        "description": "Write content to a file",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {"type": "string"},
                "content": {"type": "string"}
            },
            "required": ["file_path", "content"]
        }
    }
]

TOOL_MAP = {
    "read_file": read_file,
    "list_directory": list_directory,
    "write_file": write_file
}

# Agent system prompt
FILE_AGENT_SYSTEM = """You are a file system assistant. You help users explore and manage files.

Available tools:
- read_file: Read contents of a file
- list_directory: List contents of a directory
- write_file: Write content to a file

Guidelines:
1. Always confirm before writing/modifying files
2. Summarize file contents rather than dumping raw text
3. Be careful with recursive operations on large directories
4. Report errors clearly

When exploring code, provide insights about what you find."""

def run_file_agent():
    """Run the file agent interactively."""
    from utils.function_calling import AnthropicFunctionCalling

    client = AnthropicFunctionCalling()
    messages = [{"role": "system", "content": FILE_AGENT_SYSTEM}]

    print("File System Agent Ready. Type 'quit' to exit.")
    print("-" * 50)

    while True:
        user_input = input("\nYou: ").strip()
        if user_input.lower() == 'quit':
            break

        messages.append({"role": "user", "content": user_input})

        # Agent loop
        while True:
            content, tool_calls = client.chat_with_tools(messages, TOOLS)

            if content:
                print(f"\nAgent: {content}")

            if not tool_calls:
                messages.append({"role": "assistant", "content": content})
                break

            # Execute tools
            for tc in tool_calls:
                print(f"\n[Executing: {tc.name}({tc.arguments})]")
                result = TOOL_MAP[tc.name](**tc.arguments)
                print(f"[Result: {result[:200]}...]" if len(result) > 200 else f"[Result: {result}]")

                messages.append({
                    "role": "assistant",
                    "content": "",
                    "tool_calls": [{"id": tc.id, "name": tc.name, "arguments": tc.arguments}]
                })
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": result
                })

if __name__ == "__main__":
    run_file_agent()
```

---

<a name="patterns"></a>
## 3. Agent Patterns (1 hour)

### 3.1 ReAct: Reasoning + Acting

The ReAct pattern alternates between reasoning (thinking) and acting (using tools).

```
┌─────────────────────────────────────────────────────────────────┐
│                      ReAct Pattern                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Task: "Find the largest file in the src directory"            │
│                                                                 │
│  Thought 1: I need to list the contents of src first           │
│  Action 1: list_directory(path="src", recursive=True)          │
│  Observation 1: [FILE] src/main.py, [FILE] src/utils.py, ...   │
│                                                                 │
│  Thought 2: I have file names but not sizes. Need to check     │
│             each file's size.                                   │
│  Action 2: get_file_info(path="src/main.py")                   │
│  Observation 2: size: 15KB, modified: 2024-01-10               │
│                                                                 │
│  Thought 3: Continue checking other files...                   │
│  Action 3: get_file_info(path="src/utils.py")                  │
│  Observation 3: size: 42KB, modified: 2024-01-08               │
│                                                                 │
│  ... (continues until all files checked)                        │
│                                                                 │
│  Thought N: src/utils.py is the largest at 42KB                │
│  Action N: (no action - provide answer)                        │
│  Final Answer: The largest file is src/utils.py (42KB)         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**ReAct Implementation:**
```python
# patterns/react.py

REACT_SYSTEM_PROMPT = """You are an AI assistant that reasons step by step before acting.

For each step, you must:
1. Thought: Explain your reasoning about what to do next
2. Action: Call a tool if needed, or provide Final Answer if done

Format your response as:
Thought: [your reasoning]
Action: [tool_name(param1="value1", param2="value2")] OR Final Answer: [your answer]

Always think before acting. Never skip the Thought step.
If you encounter an error, reason about what went wrong and try a different approach.
"""

class ReactAgent:
    """Agent using the ReAct pattern."""

    def __init__(self, llm_client, tools: Dict[str, Callable], max_iterations: int = 10):
        self.llm = llm_client
        self.tools = tools
        self.max_iterations = max_iterations

    def run(self, task: str) -> str:
        messages = [
            {"role": "system", "content": REACT_SYSTEM_PROMPT},
            {"role": "user", "content": f"Task: {task}"}
        ]

        for i in range(self.max_iterations):
            response = self.llm.chat(messages)
            messages.append({"role": "assistant", "content": response})

            # Parse the response
            if "Final Answer:" in response:
                # Extract and return final answer
                answer = response.split("Final Answer:")[-1].strip()
                return answer

            # Extract and execute action
            if "Action:" in response:
                action_str = response.split("Action:")[-1].split("\n")[0].strip()
                result = self._execute_action(action_str)

                # Add observation
                observation = f"Observation: {result}"
                messages.append({"role": "user", "content": observation})

        return "Max iterations reached without final answer"

    def _execute_action(self, action_str: str) -> str:
        """Parse and execute an action string."""
        try:
            # Parse action like: tool_name(param1="value1")
            tool_name = action_str.split("(")[0]
            # ... parse arguments
            return self.tools[tool_name](**args)
        except Exception as e:
            return f"Error executing action: {e}"
```

### 3.2 Planning Agents

Planning agents create a plan before executing, enabling complex multi-step tasks.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Planning Agent Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Task: "Migrate auth module from Express to FastAPI"           │
│                                                                 │
│  ┌─────────────────────────────────────────────┐               │
│  │              PLANNING PHASE                  │               │
│  │                                              │               │
│  │  1. Analyze existing Express auth code       │               │
│  │  2. Identify dependencies (bcrypt, jwt)      │               │
│  │  3. Map Express patterns to FastAPI          │               │
│  │  4. Create new file structure                │               │
│  │  5. Implement user model (Pydantic)          │               │
│  │  6. Implement auth endpoints                 │               │
│  │  7. Add tests                                │               │
│  │  8. Verify functionality                     │               │
│  └─────────────────────────────────────────────┘               │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────┐               │
│  │             EXECUTION PHASE                  │               │
│  │                                              │               │
│  │  Step 1: ✓ Read routes/auth.js              │               │
│  │  Step 2: ✓ Found bcryptjs, jsonwebtoken     │               │
│  │  Step 3: ✓ Mapped to FastAPI equivalents    │               │
│  │  Step 4: ⟳ Creating routers/auth.py         │ ← Current     │
│  │  Step 5: ○ Pending                          │               │
│  │  ...                                        │               │
│  └─────────────────────────────────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Planning Agent Implementation:**
```python
# patterns/planning.py
from dataclasses import dataclass
from typing import List, Optional
from enum import Enum

class StepStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"

@dataclass
class PlanStep:
    id: int
    description: str
    status: StepStatus = StepStatus.PENDING
    result: Optional[str] = None
    dependencies: List[int] = None  # IDs of steps this depends on

@dataclass
class Plan:
    task: str
    steps: List[PlanStep]
    current_step: int = 0

PLANNING_PROMPT = """Create a detailed plan for the following task.
Break it into concrete, executable steps.

Task: {task}

Output your plan as a numbered list:
1. [First step]
2. [Second step]
...

Guidelines:
- Each step should be independently verifiable
- Include validation/testing steps
- Consider rollback steps for risky operations
- Order steps by dependencies
"""

EXECUTION_PROMPT = """You are executing step {step_number} of a plan.

Overall task: {task}

Plan:
{plan}

Current step: {current_step}

Previous results:
{previous_results}

Execute this step and report your actions and results.
If you cannot complete the step, explain why and suggest alternatives.
"""

class PlanningAgent:
    """Agent that plans before executing."""

    def __init__(self, llm_client, tools: Dict, max_replans: int = 3):
        self.llm = llm_client
        self.tools = tools
        self.max_replans = max_replans

    def run(self, task: str) -> str:
        # Phase 1: Create plan
        plan = self._create_plan(task)
        print(f"Created plan with {len(plan.steps)} steps")

        # Phase 2: Execute plan
        results = []
        for i, step in enumerate(plan.steps):
            # Check dependencies
            if not self._dependencies_met(step, plan.steps):
                step.status = StepStatus.SKIPPED
                continue

            step.status = StepStatus.IN_PROGRESS
            result = self._execute_step(plan, step, results)

            if result.success:
                step.status = StepStatus.COMPLETED
                step.result = result.output
                results.append(result)
            else:
                step.status = StepStatus.FAILED
                # Attempt replan
                if not self._replan(plan, step, result.error):
                    return f"Failed at step {i+1}: {result.error}"

        return self._summarize_results(plan, results)

    def _create_plan(self, task: str) -> Plan:
        """Use LLM to create a plan."""
        prompt = PLANNING_PROMPT.format(task=task)
        response = self.llm.chat([
            {"role": "system", "content": "You are a planning assistant."},
            {"role": "user", "content": prompt}
        ])

        # Parse response into steps
        steps = self._parse_plan(response)
        return Plan(task=task, steps=steps)

    def _execute_step(self, plan: Plan, step: PlanStep, previous: List) -> 'StepResult':
        """Execute a single plan step."""
        # ... implementation
        pass

    def _replan(self, plan: Plan, failed_step: PlanStep, error: str) -> bool:
        """Attempt to create alternative steps after failure."""
        # ... implementation
        pass
```

### 3.3 Verification Agents

Agents that verify their own work before declaring completion.

```python
# patterns/verification.py

VERIFICATION_PROMPT = """You just completed a task. Verify your work.

Task: {task}
Your output: {output}

Verification checklist:
1. Does the output satisfy all requirements?
2. Are there any errors or issues?
3. Is the output complete?
4. Are there edge cases not handled?

Rate your confidence (1-10) and explain any concerns.
If confidence < 8, suggest improvements.
"""

class VerifyingAgent:
    """Agent that verifies its outputs."""

    def __init__(self, llm_client, tools, confidence_threshold: float = 0.8):
        self.llm = llm_client
        self.tools = tools
        self.confidence_threshold = confidence_threshold

    def run_with_verification(self, task: str) -> str:
        # Initial execution
        result = self._execute_task(task)

        # Verification loop
        for attempt in range(3):
            verification = self._verify(task, result)

            if verification.confidence >= self.confidence_threshold:
                return result

            # Improve based on feedback
            result = self._improve(task, result, verification.feedback)

        # Return best effort after max attempts
        return result

    def _verify(self, task: str, output: str) -> 'Verification':
        """Verify the output."""
        prompt = VERIFICATION_PROMPT.format(task=task, output=output)
        response = self.llm.chat([
            {"role": "user", "content": prompt}
        ])
        return self._parse_verification(response)

    def _improve(self, task: str, output: str, feedback: str) -> str:
        """Improve output based on verification feedback."""
        prompt = f"""Improve this output based on feedback.

Task: {task}
Current output: {output}
Feedback: {feedback}

Provide improved output addressing the feedback."""

        return self.llm.chat([{"role": "user", "content": prompt}])
```

### 3.4 Pattern Selection Guide

```markdown
## When to Use Each Pattern

### ReAct (Reasoning + Acting)
✅ Use when:
- Task requires exploration
- Multiple possible paths
- Need to adapt based on findings
- Debugging/investigation tasks

❌ Avoid when:
- Task is straightforward
- Steps are known in advance
- Speed is critical

### Planning
✅ Use when:
- Complex multi-step tasks
- Need to coordinate dependencies
- Risk of wrong order causing issues
- User needs to approve plan first

❌ Avoid when:
- Simple, single-step tasks
- Highly dynamic situations
- Requirements unclear (explore first)

### Verification
✅ Use when:
- Output correctness is critical
- Code generation tasks
- Tasks with testable criteria
- High-stakes decisions

❌ Avoid when:
- Verification would be as hard as the task
- Speed is critical
- Output is inherently subjective
```

---

<a name="exercise-1"></a>
## 4. Exercise 1: Design an Agent (15 min)

### Task
Design an agent architecture for a "Code Migration Assistant" that migrates Python 2 code to Python 3.

### Template

```markdown
## Code Migration Agent Design

### Agent Type
[ ] ReAct (explore and migrate incrementally)
[ ] Planning (analyze all, plan migration, execute)
[ ] Hybrid (plan first, use ReAct for each step)

Why:

### Required Tools
1. Tool name:
   - Purpose:
   - Parameters:

2. Tool name:
   - Purpose:
   - Parameters:

3. (add more as needed)

### Agent Flow
```
[Draw or describe the flow]
```

### Memory Requirements
- Short-term:
- Long-term:
- Working memory:

### Error Handling
How will the agent handle:
- Syntax errors in migrated code?
- Ambiguous migration patterns?
- Files it can't migrate automatically?

### Verification Strategy
How will the agent verify migrations are correct?

### Estimated Iterations
Typical iterations for a single file:
Typical iterations for a project:
```

---

<a name="multi-agent"></a>
## 5. Multi-Agent Systems (1 hour)

### 5.1 When Single Agents Aren't Enough

```
┌─────────────────────────────────────────────────────────────────┐
│                Single Agent Limitations                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CONTEXT EXHAUSTION                                          │
│     Complex tasks exceed context window                         │
│                                                                 │
│  2. ROLE CONFUSION                                              │
│     One agent trying to be expert in everything                 │
│                                                                 │
│  3. SERIAL EXECUTION                                            │
│     Can't parallelize independent subtasks                      │
│                                                                 │
│  4. SINGLE POINT OF FAILURE                                     │
│     One mistake derails entire process                          │
│                                                                 │
│  5. LACK OF CHECKS                                              │
│     No second opinion on outputs                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Multi-Agent Architectures

**Architecture 1: Supervisor Pattern**
```
┌─────────────────────────────────────────────────────────────────┐
│                    Supervisor Pattern                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    ┌─────────────┐                              │
│                    │ SUPERVISOR  │                              │
│                    │   AGENT     │                              │
│                    └──────┬──────┘                              │
│                           │                                     │
│         ┌─────────────────┼─────────────────┐                   │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  RESEARCH   │  │   CODING    │  │   REVIEW    │             │
│  │   AGENT     │  │   AGENT     │  │   AGENT     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  Supervisor:                                                    │
│  - Receives task from user                                      │
│  - Delegates to specialized agents                              │
│  - Aggregates results                                           │
│  - Handles failures and retries                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Architecture 2: Pipeline Pattern**
```
┌─────────────────────────────────────────────────────────────────┐
│                     Pipeline Pattern                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐ │
│  │  ANALYZE  │──▶│  PLAN     │──▶│  EXECUTE  │──▶│  VERIFY   │ │
│  │  AGENT    │   │  AGENT    │   │  AGENT    │   │  AGENT    │ │
│  └───────────┘   └───────────┘   └───────────┘   └───────────┘ │
│       │               │               │               │        │
│       ▼               ▼               ▼               ▼        │
│  [Analysis]      [Plan Doc]      [Output]       [Verified]     │
│                                                                 │
│  Each agent:                                                    │
│  - Specialized for one phase                                    │
│  - Passes structured output to next                             │
│  - Can request redo from previous                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Architecture 3: Debate/Consensus Pattern**
```
┌─────────────────────────────────────────────────────────────────┐
│                  Debate/Consensus Pattern                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│         ┌─────────────┐     ┌─────────────┐                    │
│         │  AGENT A    │     │  AGENT B    │                    │
│         │ (Advocate)  │     │ (Skeptic)   │                    │
│         └──────┬──────┘     └──────┬──────┘                    │
│                │                   │                            │
│                └─────────┬─────────┘                            │
│                          │                                      │
│                          ▼                                      │
│                   ┌─────────────┐                               │
│                   │   JUDGE     │                               │
│                   │   AGENT     │                               │
│                   └─────────────┘                               │
│                                                                 │
│  Flow:                                                          │
│  1. Agent A proposes solution                                   │
│  2. Agent B critiques/challenges                                │
│  3. Agent A responds to critique                                │
│  4. Repeat until Judge calls consensus                          │
│  5. Judge synthesizes final answer                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Communication Patterns

```python
# agents/multi_agent.py
from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from enum import Enum

class MessageType(Enum):
    TASK = "task"
    RESULT = "result"
    QUESTION = "question"
    FEEDBACK = "feedback"
    ERROR = "error"

@dataclass
class AgentMessage:
    """Message passed between agents."""
    from_agent: str
    to_agent: str
    type: MessageType
    content: Any
    metadata: Dict[str, Any] = None

class MessageBus:
    """Central message bus for agent communication."""

    def __init__(self):
        self.messages: List[AgentMessage] = []
        self.subscribers: Dict[str, List[callable]] = {}

    def publish(self, message: AgentMessage):
        """Publish a message."""
        self.messages.append(message)

        # Notify subscribers
        if message.to_agent in self.subscribers:
            for callback in self.subscribers[message.to_agent]:
                callback(message)

    def subscribe(self, agent_id: str, callback: callable):
        """Subscribe to messages for an agent."""
        if agent_id not in self.subscribers:
            self.subscribers[agent_id] = []
        self.subscribers[agent_id].append(callback)

    def get_conversation(self, agent1: str, agent2: str) -> List[AgentMessage]:
        """Get conversation between two agents."""
        return [
            m for m in self.messages
            if (m.from_agent in [agent1, agent2] and m.to_agent in [agent1, agent2])
        ]
```

### 5.4 Avoiding Infinite Loops

```python
# agents/safety.py

class LoopDetector:
    """Detects and prevents infinite agent loops."""

    def __init__(self, max_iterations: int = 50, similarity_threshold: float = 0.9):
        self.max_iterations = max_iterations
        self.similarity_threshold = similarity_threshold
        self.state_history: List[str] = []

    def check_state(self, state: str) -> bool:
        """
        Check if current state suggests a loop.
        Returns True if loop detected.
        """
        # Check iteration limit
        if len(self.state_history) >= self.max_iterations:
            return True

        # Check for repeated states
        for past_state in self.state_history[-10:]:
            if self._similarity(state, past_state) > self.similarity_threshold:
                return True

        self.state_history.append(state)
        return False

    def _similarity(self, s1: str, s2: str) -> float:
        """Simple similarity check."""
        # Use more sophisticated comparison in production
        words1 = set(s1.lower().split())
        words2 = set(s2.lower().split())
        if not words1 or not words2:
            return 0.0
        intersection = len(words1 & words2)
        union = len(words1 | words2)
        return intersection / union


class MultiAgentOrchestrator:
    """Orchestrates multiple agents with safety controls."""

    def __init__(self, agents: Dict[str, 'BaseAgent'], max_rounds: int = 10):
        self.agents = agents
        self.max_rounds = max_rounds
        self.loop_detector = LoopDetector()
        self.message_bus = MessageBus()

    def run(self, task: str) -> str:
        """Run multi-agent workflow."""
        for round_num in range(self.max_rounds):
            # Collect current state
            state = self._get_system_state()

            # Check for loops
            if self.loop_detector.check_state(state):
                return self._handle_loop_detected()

            # Run one round
            result = self._execute_round(round_num)

            if result.is_complete:
                return result.output

        return "Max rounds exceeded without completion"

    def _get_system_state(self) -> str:
        """Get string representation of system state for loop detection."""
        # Include recent messages and agent states
        recent_messages = self.message_bus.messages[-10:]
        return str([(m.from_agent, m.type, m.content[:100]) for m in recent_messages])

    def _handle_loop_detected(self) -> str:
        """Handle detected infinite loop."""
        # Options: return partial result, escalate, or try different approach
        return "Loop detected - returning best effort result"
```

### 5.5 Supervisor Agent Implementation

```python
# agents/supervisor.py

SUPERVISOR_PROMPT = """You are a supervisor managing a team of specialized agents.

Available agents:
{agent_descriptions}

Your job:
1. Analyze the incoming task
2. Break it into subtasks for your agents
3. Delegate to appropriate agents
4. Synthesize their outputs into a final result

For each decision, output:
DELEGATE: agent_name
TASK: specific task for that agent

When all subtasks are done, output:
SYNTHESIZE: [your final synthesis]

Current task: {task}
Previous results: {results}
"""

class SupervisorAgent:
    """Supervisor that coordinates specialized agents."""

    def __init__(self, llm_client, worker_agents: Dict[str, 'BaseAgent']):
        self.llm = llm_client
        self.workers = worker_agents
        self.agent_descriptions = self._build_descriptions()

    def run(self, task: str) -> str:
        results = {}
        iterations = 0
        max_iterations = 20

        while iterations < max_iterations:
            # Get supervisor decision
            decision = self._get_decision(task, results)

            if decision.type == "SYNTHESIZE":
                return decision.content

            if decision.type == "DELEGATE":
                # Execute worker agent
                worker = self.workers[decision.agent]
                result = worker.run(decision.task)
                results[f"{decision.agent}_{iterations}"] = result

            iterations += 1

        return self._force_synthesis(task, results)

    def _get_decision(self, task: str, results: Dict) -> 'Decision':
        """Get next decision from supervisor."""
        prompt = SUPERVISOR_PROMPT.format(
            agent_descriptions=self.agent_descriptions,
            task=task,
            results=json.dumps(results, indent=2)
        )

        response = self.llm.chat([
            {"role": "system", "content": "You are a project supervisor."},
            {"role": "user", "content": prompt}
        ])

        return self._parse_decision(response)

    def _build_descriptions(self) -> str:
        """Build description of available worker agents."""
        lines = []
        for name, agent in self.workers.items():
            lines.append(f"- {name}: {agent.description}")
        return "\n".join(lines)
```

---

<a name="frameworks"></a>
## 6. Framework Comparison (30 min)

### 6.1 Framework Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Agent Framework Landscape                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LangChain/LangGraph                                            │
│  ──────────────────                                             │
│  • Most popular, largest ecosystem                              │
│  • LangGraph for complex state machines                         │
│  • Great for RAG and chains                                     │
│  • Can be verbose for simple cases                              │
│                                                                 │
│  CrewAI                                                         │
│  ──────                                                         │
│  • Focus on multi-agent collaboration                           │
│  • Role-based agent definitions                                 │
│  • Built-in task delegation                                     │
│  • Good for team simulations                                    │
│                                                                 │
│  AutoGen (Microsoft)                                            │
│  ─────────────────                                              │
│  • Conversational agent focus                                   │
│  • Human-in-the-loop support                                    │
│  • Code execution capabilities                                  │
│  • Enterprise-oriented                                          │
│                                                                 │
│  Custom Implementation                                          │
│  ─────────────────────                                          │
│  • Full control                                                 │
│  • No framework overhead                                        │
│  • More work but more flexibility                               │
│  • Good for learning                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Quick Comparison

| Feature | LangChain/LangGraph | CrewAI | AutoGen | Custom |
|---------|---------------------|--------|---------|--------|
| Learning Curve | Medium-High | Low-Medium | Medium | Low |
| Flexibility | High | Medium | Medium | Very High |
| Multi-Agent | ✅ (LangGraph) | ✅ Native | ✅ Native | Build yourself |
| RAG Support | ✅ Excellent | ✅ Good | ✅ Good | Build yourself |
| Production Ready | ✅ | ⚠️ Maturing | ✅ | Depends |
| Community | Very Large | Growing | Large | N/A |
| Best For | Complex pipelines | Team tasks | Conversations | Specific needs |

### 6.3 Code Comparison

**Simple Agent: LangChain**
```python
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_anthropic import ChatAnthropic
from langchain.tools import tool

@tool
def search(query: str) -> str:
    """Search for information."""
    return f"Results for: {query}"

llm = ChatAnthropic(model="claude-3-5-sonnet-20241022")
tools = [search]
agent = create_tool_calling_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools)
result = executor.invoke({"input": "Find Python tutorials"})
```

**Simple Agent: CrewAI**
```python
from crewai import Agent, Task, Crew

researcher = Agent(
    role="Researcher",
    goal="Find accurate information",
    backstory="Expert at finding information",
    tools=[search_tool]
)

task = Task(
    description="Find Python tutorials",
    agent=researcher
)

crew = Crew(agents=[researcher], tasks=[task])
result = crew.kickoff()
```

**Simple Agent: Custom**
```python
class SimpleAgent:
    def __init__(self, llm, tools):
        self.llm = llm
        self.tools = tools

    def run(self, task: str) -> str:
        messages = [{"role": "user", "content": task}]
        while True:
            response, tool_calls = self.llm.chat_with_tools(messages, self.tools)
            if not tool_calls:
                return response
            for tc in tool_calls:
                result = self.tools[tc.name](**tc.args)
                messages.append({"role": "tool", "content": result})

agent = SimpleAgent(llm, tools)
result = agent.run("Find Python tutorials")
```

### 6.4 Decision Matrix

```markdown
## Framework Selection Guide

Choose **LangChain/LangGraph** if:
- [ ] Building complex RAG pipelines
- [ ] Need extensive integrations
- [ ] Want large community support
- [ ] Building production systems

Choose **CrewAI** if:
- [ ] Multi-agent collaboration is core
- [ ] Want role-based agent design
- [ ] Simulating team workflows
- [ ] Prefer simpler API

Choose **AutoGen** if:
- [ ] Need human-in-the-loop
- [ ] Building conversational systems
- [ ] Enterprise requirements
- [ ] Microsoft ecosystem

Choose **Custom** if:
- [ ] Learning how agents work
- [ ] Very specific requirements
- [ ] Minimal dependencies needed
- [ ] Full control required
```

---

<a name="lab-03"></a>
## 7. Lab 03: Migration Workflow Agent (1h 45min)

### Lab Overview

**Goal:** Build a multi-step agent that migrates code between frameworks.

**The agent will:**
1. Analyze source code
2. Create a migration plan
3. Execute migration steps
4. Verify the migration

**Stack:**
- Python
- Planning + Execution pattern
- LLM-agnostic design

### Lab Instructions

Navigate to `labs/lab03-migration-workflow/` and follow the README.

**Quick Start:**
```bash
cd labs/lab03-migration-workflow
cat README.md
# Follow steps to build the migration agent
```

### Expected Outcome

By the end of this lab, you should have:
1. A working migration workflow agent
2. Experience with the planning pattern
3. Multi-step verification
4. Deployment to Railway

---

## Day 3 Summary

### What We Covered
1. **Agent Fundamentals**: The agent loop, memory, state management
2. **Tool-Use**: Function calling across providers, error handling
3. **Agent Patterns**: ReAct, Planning, Verification
4. **Multi-Agent Systems**: Supervisor, Pipeline, Debate patterns
5. **Frameworks**: LangChain, CrewAI, AutoGen comparison

### Key Takeaways
- Agents = LLM + Tools + Loop + Memory
- Tool definitions are crucial—clear descriptions help the LLM
- Choose patterns based on task complexity
- Multi-agent systems solve context and specialization problems
- Start simple, add complexity as needed

### Architecture Diagrams You Should Have
- [ ] Basic agent loop
- [ ] ReAct pattern
- [ ] Planning agent flow
- [ ] Supervisor pattern

### Preparation for Day 4
- Think about data you'd want to search over
- Consider how you'd evaluate agent outputs
- Review the migration agent—we'll add RAG to it

---

**Navigation**: [← Day 2](./DAY2-PROMPTING.md) | [Day 4: RAG & Evaluation →](./DAY4-RAG-EVAL.md)
