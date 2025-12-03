# Day 1: GenAI Foundations & AI-First Engineering

## Learning Objectives

By the end of Day 1, you will be able to:
- Explain how Large Language Models work at a practical level
- Identify the strengths, limitations, and appropriate use cases for different LLMs
- Apply "Vibe Coding" and AI-first development methodologies
- Select and configure AI coding tools for your workflow
- Build and deploy your first AI-assisted application

---

## Table of Contents

1. [Welcome & Setup](#welcome)
2. [LLM Fundamentals](#llm-fundamentals)
3. [Model Behavior & Constraints](#model-behavior)
4. [Exercise 1: Model Comparison](#exercise-1)
5. [Vibe Coding & AI-First Development](#vibe-coding)
6. [Tool Landscape](#tool-landscape)
7. [Lab 01: Build First AI-Assisted App](#lab-01)

---

<a name="welcome"></a>
## 1. Welcome & Program Overview (30 min)

### What This Program Is

This is an **intensive, engineering-focused** training program designed to make you productive in agentic AI projects within one week. We emphasize:

- **Practical skills** over theoretical depth
- **Production patterns** over toy examples
- **LLM-agnostic approaches** that work across providers
- **Real deployments** on every lab

### What You'll Build This Week

```
Day 1: URL Shortener (AI-assisted full-stack)
Day 2: Code Analyzer Agent
Day 3: Migration Workflow Agent
Day 4: RAG System with Evaluation
Day 5: Capstone Project (your choice)
```

### Environment Setup Verification

Run this script to verify your setup:

```python
# scripts/verify_setup.py
import sys
import os

def check_python():
    version = sys.version_info
    if version.major >= 3 and version.minor >= 10:
        print(f"✓ Python {version.major}.{version.minor}.{version.micro}")
        return True
    print(f"✗ Python {version.major}.{version.minor} (need 3.10+)")
    return False

def check_env_vars():
    required = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY"]
    optional = ["GOOGLE_API_KEY"]

    all_good = True
    for var in required:
        if os.getenv(var):
            print(f"✓ {var} is set")
        else:
            print(f"✗ {var} is missing (required)")
            all_good = False

    for var in optional:
        if os.getenv(var):
            print(f"✓ {var} is set")
        else:
            print(f"○ {var} is missing (optional)")

    return all_good

def check_packages():
    packages = ["openai", "anthropic", "langchain", "fastapi", "chromadb"]
    all_good = True

    for pkg in packages:
        try:
            __import__(pkg)
            print(f"✓ {pkg}")
        except ImportError:
            print(f"✗ {pkg} not installed")
            all_good = False

    return all_good

if __name__ == "__main__":
    print("\n=== Environment Verification ===\n")

    print("Python Version:")
    py_ok = check_python()

    print("\nEnvironment Variables:")
    env_ok = check_env_vars()

    print("\nPython Packages:")
    pkg_ok = check_packages()

    print("\n" + "="*35)
    if py_ok and env_ok and pkg_ok:
        print("✓ All checks passed! Ready to go.")
    else:
        print("✗ Some checks failed. Please fix before continuing.")
```

---

<a name="llm-fundamentals"></a>
## 2. LLM Fundamentals (1 hour)

### 2.1 What is a Large Language Model?

An LLM is a neural network trained to predict the next token in a sequence. Despite this simple objective, scale and training data have produced emergent capabilities.

```
┌─────────────────────────────────────────────────────────────────┐
│                    How LLMs Generate Text                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Input: "The capital of France is"                              │
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────────────┐   │
│  │ Tokenize │───▶│   Process    │───▶│ Probability over    │   │
│  │          │    │  (Attention) │    │ all tokens          │   │
│  └──────────┘    └──────────────┘    └─────────────────────┘   │
│                                              │                  │
│  Tokens:                            "Paris": 0.92               │
│  ["The", "capital",                 "Lyon": 0.03                │
│   "of", "France", "is"]             "Berlin": 0.01              │
│                                     ...                         │
│                                              │                  │
│                                              ▼                  │
│                                     Sample: "Paris"             │
│                                                                 │
│  Output: "The capital of France is Paris"                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Tokens: The Atomic Unit

LLMs don't see characters or words—they see **tokens**. Understanding tokens is essential for:
- Estimating costs
- Working within context limits
- Debugging unexpected behavior

```python
# Token counting example (works with any tiktoken-compatible model)
import tiktoken

def count_tokens(text: str, model: str = "gpt-4") -> int:
    """Count tokens for a given text."""
    encoding = tiktoken.encoding_for_model(model)
    return len(encoding.encode(text))

# Examples
examples = [
    "Hello, world!",
    "def fibonacci(n): return n if n < 2 else fibonacci(n-1) + fibonacci(n-2)",
    "The quick brown fox jumps over the lazy dog.",
    "supercalifragilisticexpialidocious",
]

for text in examples:
    tokens = count_tokens(text)
    ratio = len(text) / tokens
    print(f"{tokens:3d} tokens | {len(text):3d} chars | ratio: {ratio:.1f} | {text[:50]}...")
```

**Token Rules of Thumb:**
- English: ~4 characters per token
- Code: ~3 characters per token (more symbols)
- Other languages: varies widely (can be 1-2 chars/token for CJK)

### 2.3 Context Windows

The context window is the total tokens the model can "see" at once (input + output).

| Model | Context Window | Approx. Pages |
|-------|---------------|---------------|
| GPT-4o | 128K | ~300 pages |
| Claude 3.5 Sonnet | 200K | ~500 pages |
| Gemini 1.5 Pro | 1M+ | ~2,500 pages |
| GPT-4 Turbo | 128K | ~300 pages |

**Practical Implications:**
- Longer context = can include more code/documentation
- Longer context ≠ perfect recall (attention degrades)
- Cost scales with context length

### 2.4 Key Parameters

#### Temperature
Controls randomness in output. Range: 0.0 to 2.0 (typically 0.0 to 1.0)

```
Temperature 0.0: Deterministic, always picks highest probability
Temperature 0.7: Balanced creativity and coherence (default)
Temperature 1.0+: More creative/random, can be incoherent
```

**Guidelines:**
- Code generation: 0.0-0.3 (want consistency)
- Creative writing: 0.7-0.9
- Brainstorming: 0.8-1.0
- Factual Q&A: 0.0-0.2

#### Top-p (Nucleus Sampling)
Alternative to temperature. Considers only tokens whose cumulative probability reaches p.

```
Top-p 0.1: Very focused, only most likely tokens
Top-p 0.9: Considers wider range of possibilities
Top-p 1.0: Considers all tokens
```

**Best Practice:** Use temperature OR top-p, not both at extreme values.

### 2.5 Model Comparison Overview

| Aspect | Claude 3.5 Sonnet | GPT-4o | Gemini 1.5 Pro |
|--------|-------------------|--------|----------------|
| **Strengths** | Reasoning, safety, long context | Broad capabilities, vision | Speed, multimodal, huge context |
| **Code Quality** | Excellent | Excellent | Very Good |
| **Speed** | Fast | Fast | Very Fast |
| **Context** | 200K | 128K | 1M+ |
| **Cost** | $3/$15 per 1M tokens | $5/$15 per 1M tokens | $1.25/$5 per 1M tokens |
| **Best For** | Complex reasoning, code review | General purpose, function calling | Large codebases, multimodal |

### 2.6 API Basics (LLM-Agnostic Pattern)

Here's a pattern that works across all major providers:

```python
# utils/llm_client.py
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import os

class LLMClient(ABC):
    """Abstract base class for LLM clients."""

    @abstractmethod
    def chat(self, messages: List[Dict[str, str]], **kwargs) -> str:
        """Send a chat completion request."""
        pass

class OpenAIClient(LLMClient):
    def __init__(self, model: str = "gpt-4o"):
        from openai import OpenAI
        self.client = OpenAI()
        self.model = model

    def chat(self, messages: List[Dict[str, str]], **kwargs) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            **kwargs
        )
        return response.choices[0].message.content

class AnthropicClient(LLMClient):
    def __init__(self, model: str = "claude-3-5-sonnet-20241022"):
        from anthropic import Anthropic
        self.client = Anthropic()
        self.model = model

    def chat(self, messages: List[Dict[str, str]], **kwargs) -> str:
        # Anthropic uses 'system' separately
        system = None
        filtered_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system = msg["content"]
            else:
                filtered_messages.append(msg)

        response = self.client.messages.create(
            model=self.model,
            max_tokens=kwargs.get("max_tokens", 4096),
            system=system,
            messages=filtered_messages
        )
        return response.content[0].text

class GeminiClient(LLMClient):
    def __init__(self, model: str = "gemini-1.5-pro"):
        import google.generativeai as genai
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        self.model = genai.GenerativeModel(model)

    def chat(self, messages: List[Dict[str, str]], **kwargs) -> str:
        # Convert to Gemini format
        history = []
        for msg in messages[:-1]:
            role = "user" if msg["role"] == "user" else "model"
            history.append({"role": role, "parts": [msg["content"]]})

        chat = self.model.start_chat(history=history)
        response = chat.send_message(messages[-1]["content"])
        return response.text

def get_llm_client(provider: str = "anthropic") -> LLMClient:
    """Factory function to get the appropriate LLM client."""
    providers = {
        "openai": OpenAIClient,
        "anthropic": AnthropicClient,
        "gemini": GeminiClient,
    }

    if provider not in providers:
        raise ValueError(f"Unknown provider: {provider}. Choose from: {list(providers.keys())}")

    return providers[provider]()

# Usage example
if __name__ == "__main__":
    # Same code works with any provider
    client = get_llm_client("anthropic")  # or "openai" or "gemini"

    messages = [
        {"role": "system", "content": "You are a helpful coding assistant."},
        {"role": "user", "content": "Write a Python function to reverse a string."}
    ]

    response = client.chat(messages)
    print(response)
```

---

<a name="model-behavior"></a>
## 3. Model Behavior & Constraints (1 hour)

### 3.1 How Models "Reason"

LLMs don't truly reason—they pattern match at massive scale. This has implications:

**What LLMs Do Well:**
- Pattern completion based on training data
- Following structured formats
- Combining concepts in novel ways
- Code generation for common patterns

**What LLMs Struggle With:**
- True logical deduction
- Counting and arithmetic (improving with newer models)
- Maintaining state across long contexts
- Tasks requiring world state knowledge

```python
# Demonstration: Where reasoning breaks down
prompts_that_fool_llms = [
    # Counting challenge
    "How many 'r's are in 'strawberry'?",  # Often gets wrong

    # Logic puzzle with twist
    "A bat and ball cost $1.10 total. The bat costs $1 more than the ball. How much does the ball cost?",

    # Temporal reasoning
    "If I put a book on the table, then put a cup on the book, then remove the book, where is the cup?",
]
```

### 3.2 Hallucinations

Hallucinations are confident-sounding but incorrect outputs. They occur because:
- The model optimizes for plausible-sounding text
- Training data contains errors
- The model interpolates between patterns

**Types of Hallucinations:**

| Type | Example | Mitigation |
|------|---------|------------|
| **Factual** | Incorrect dates, names, stats | RAG, verification prompts |
| **Code** | Non-existent APIs/functions | Testing, documentation reference |
| **Citation** | Made-up references | Explicit "cite only real sources" |
| **Logical** | Invalid reasoning steps | Chain-of-thought, verification |

**Hallucination Mitigation Strategies:**

```python
# Strategy 1: Explicit uncertainty acknowledgment
UNCERTAINTY_PROMPT = """
If you're not certain about something, say so explicitly.
Use phrases like "I believe", "I'm not certain", or "You should verify this".
Never make up information.
"""

# Strategy 2: Verification chain
VERIFICATION_PROMPT = """
After providing your answer, add a "Verification" section where you:
1. List any facts that should be verified
2. Note any assumptions you made
3. Suggest how to validate your response
"""

# Strategy 3: Grounding with context
def grounded_query(question: str, context: str) -> str:
    return f"""
Answer the following question using ONLY the provided context.
If the context doesn't contain the answer, say "I cannot find this in the provided context."

Context:
{context}

Question: {question}
"""
```

### 3.3 Context Window Limitations

Even with large context windows, performance degrades:

```
┌─────────────────────────────────────────────────────────────────┐
│              Attention Pattern in Long Contexts                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Attention Strength                                             │
│  █████████                                                      │
│  ████████  ←── Beginning (strong)                               │
│  ███████                                                        │
│  ██████                                                         │
│  █████                                                          │
│  ████     ←── Middle (weakest - "lost in the middle")           │
│  ████                                                           │
│  █████                                                          │
│  ██████                                                         │
│  ███████                                                        │
│  ████████ ←── End (strong, recency bias)                        │
│  █████████                                                      │
│                                                                 │
│  Position in Context ──────────────────────────────────────▶    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Best Practices for Long Context:**
1. Put critical information at the beginning AND end
2. Use clear section headers
3. Summarize key points before asking questions
4. For code: include relevant files, not entire codebase

### 3.4 Safety Boundaries and Refusals

Models have built-in safety filters that sometimes trigger unexpectedly:

**Common Refusal Triggers:**
- Security-related code (even legitimate)
- Content that could be misused
- Requests that seem to bypass guidelines

**Working with Refusals:**

```python
# Bad: Vague request that might trigger safety
bad_prompt = "How do I hack into a system?"

# Good: Clear, legitimate context
good_prompt = """
I'm a security engineer conducting authorized penetration testing on our company's
web application. I need to test for SQL injection vulnerabilities.

Can you show me common SQL injection patterns I should test for, and how to
properly parameterize queries to prevent them?
"""

# Best: Include explicit authorization context
best_prompt = """
Context: I'm writing a security scanning tool for our internal DevOps pipeline.
Task: Generate test cases for common web vulnerabilities (OWASP Top 10).
Purpose: These will be used in our CI/CD pipeline to catch vulnerabilities before deployment.
Output: Python pytest functions that test for each vulnerability type.
"""
```

### 3.5 Checklist: Working with Model Constraints

```markdown
## Model Constraints Checklist

### Before Sending a Prompt
- [ ] Is my request clear and unambiguous?
- [ ] Have I provided necessary context?
- [ ] Am I asking for something within the model's capabilities?
- [ ] Have I considered potential hallucination risks?

### For Code Generation
- [ ] Have I specified the language and framework?
- [ ] Have I provided example input/output?
- [ ] Will I test the generated code?
- [ ] Have I included relevant API documentation?

### For Long Contexts
- [ ] Is critical information at the start and end?
- [ ] Have I used clear section markers?
- [ ] Is there a summary of key points?
- [ ] Have I chunked appropriately?

### For Sensitive Requests
- [ ] Have I provided legitimate context?
- [ ] Is my purpose clearly stated?
- [ ] Would a human reviewer understand the intent?
```

---

<a name="exercise-1"></a>
## 4. Exercise 1: Model Comparison (45 min)

### Objective
Compare behavior across three LLM providers to understand their differences.

### Setup

```python
# exercise1_model_comparison.py
from utils.llm_client import get_llm_client
import json
from datetime import datetime

# Test prompts covering different capabilities
TEST_PROMPTS = [
    {
        "name": "code_generation",
        "prompt": "Write a Python function that finds the longest palindromic substring in a string. Include type hints and a docstring.",
        "evaluate": ["correctness", "code_quality", "documentation"]
    },
    {
        "name": "reasoning",
        "prompt": "A farmer has 17 sheep. All but 9 die. How many sheep are left? Explain your reasoning step by step.",
        "evaluate": ["correct_answer", "explanation_quality"]
    },
    {
        "name": "refactoring",
        "prompt": """Refactor this code to be more Pythonic:

def get_evens(numbers):
    result = []
    for i in range(len(numbers)):
        if numbers[i] % 2 == 0:
            result.append(numbers[i])
    return result
""",
        "evaluate": ["improvement", "explanation"]
    },
    {
        "name": "ambiguous_request",
        "prompt": "Make this better: x = [i for i in range(10) if i % 2]",
        "evaluate": ["interpretation", "suggestions"]
    },
]

def run_comparison():
    providers = ["openai", "anthropic", "gemini"]
    results = {}

    for test in TEST_PROMPTS:
        results[test["name"]] = {}
        print(f"\n{'='*60}")
        print(f"Test: {test['name']}")
        print(f"{'='*60}")

        for provider in providers:
            try:
                client = get_llm_client(provider)
                messages = [
                    {"role": "system", "content": "You are a helpful programming assistant."},
                    {"role": "user", "content": test["prompt"]}
                ]

                response = client.chat(messages, temperature=0.0)
                results[test["name"]][provider] = {
                    "response": response,
                    "timestamp": datetime.now().isoformat()
                }

                print(f"\n--- {provider.upper()} ---")
                print(response[:500] + "..." if len(response) > 500 else response)

            except Exception as e:
                results[test["name"]][provider] = {"error": str(e)}
                print(f"\n--- {provider.upper()} ---")
                print(f"Error: {e}")

    # Save results
    with open("model_comparison_results.json", "w") as f:
        json.dump(results, f, indent=2)

    return results

if __name__ == "__main__":
    run_comparison()
```

### Your Task

1. **Run the comparison** with all three providers
2. **Fill out this evaluation matrix:**

```markdown
## Model Comparison Report

### Code Generation
| Criteria | OpenAI | Anthropic | Gemini | Notes |
|----------|--------|-----------|--------|-------|
| Correctness | | | | |
| Code Quality | | | | |
| Documentation | | | | |

### Reasoning
| Criteria | OpenAI | Anthropic | Gemini | Notes |
|----------|--------|-----------|--------|-------|
| Correct Answer | | | | |
| Explanation | | | | |

### Refactoring
| Criteria | OpenAI | Anthropic | Gemini | Notes |
|----------|--------|-----------|--------|-------|
| Improvement | | | | |
| Explanation | | | | |

### Ambiguous Request Handling
| Criteria | OpenAI | Anthropic | Gemini | Notes |
|----------|--------|-----------|--------|-------|
| Interpretation | | | | |
| Suggestions | | | | |

### Overall Impressions
- Best for code generation:
- Best for reasoning:
- Best for refactoring:
- Most helpful with ambiguous requests:
- Fastest response time:
- Personal preference and why:
```

3. **Document 3 interesting differences** you observed

---

<a name="vibe-coding"></a>
## 5. Vibe Coding & AI-First Development (1 hour)

### 5.1 What is "Vibe Coding"?

"Vibe Coding" is a term coined to describe a new paradigm where developers:
- Describe what they want in natural language
- Let AI generate the implementation
- Guide and refine through conversation
- Focus on high-level architecture and validation

```
Traditional Development:
┌──────────────────────────────────────────────────────┐
│  Developer writes every line of code manually        │
│  ↓                                                   │
│  Developer debugs every error manually               │
│  ↓                                                   │
│  Developer refactors by rewriting                    │
└──────────────────────────────────────────────────────┘

Vibe Coding:
┌──────────────────────────────────────────────────────┐
│  Developer describes intent clearly                  │
│  ↓                                                   │
│  AI generates implementation                         │
│  ↓                                                   │
│  Developer reviews, tests, guides refinement         │
│  ↓                                                   │
│  Developer validates correctness and edge cases      │
└──────────────────────────────────────────────────────┘
```

### 5.2 AI-First Development Methodology

**The AI-First Loop:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI-First Development Loop                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│     ┌─────────┐                                                 │
│     │ SPECIFY │ ◄────────────────────────────────────┐          │
│     └────┬────┘                                      │          │
│          │ What do I need?                           │          │
│          ▼                                           │          │
│     ┌─────────┐                                      │          │
│     │GENERATE │                                      │          │
│     └────┬────┘                                      │          │
│          │ AI creates implementation                 │ Iterate  │
│          ▼                                           │          │
│     ┌─────────┐                                      │          │
│     │ REVIEW  │                                      │          │
│     └────┬────┘                                      │          │
│          │ Is this correct?                          │          │
│          ▼                                           │          │
│     ┌─────────┐      No                              │          │
│     │ VERIFY  │ ─────────────────────────────────────┘          │
│     └────┬────┘                                                 │
│          │ Yes                                                  │
│          ▼                                                      │
│     ┌─────────┐                                                 │
│     │ DEPLOY  │                                                 │
│     └─────────┘                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 When to Use AI vs. Traditional Coding

| Situation | Use AI | Use Traditional |
|-----------|--------|-----------------|
| Boilerplate/scaffolding | ✅ | |
| Well-understood patterns | ✅ | |
| Code you need to deeply understand | | ✅ |
| Security-critical sections | Review only | ✅ |
| Novel algorithms | Assist | ✅ |
| Documentation | ✅ | |
| Tests for existing code | ✅ | |
| Performance optimization | Assist | ✅ |
| Learning new technologies | ✅ | |

### 5.4 Effective Human-AI Collaboration Patterns

**Pattern 1: Scaffolding First**
```
Human: "Create the project structure for a FastAPI app with
       authentication, a PostgreSQL database, and Redis caching."
AI:    [Generates project structure, files, configs]
Human: "Now implement the user model and authentication endpoints."
AI:    [Generates specific implementation]
```

**Pattern 2: Iterative Refinement**
```
Human: "Write a function to parse log files."
AI:    [Generates basic implementation]
Human: "Add support for gzipped files and handle malformed lines."
AI:    [Refines implementation]
Human: "Add type hints and improve error messages."
AI:    [Final refinement]
```

**Pattern 3: Review and Explain**
```
Human: "Review this code for potential issues: [code]"
AI:    [Identifies issues, suggests improvements]
Human: "Fix the SQL injection vulnerability you identified."
AI:    [Provides fix]
```

**Pattern 4: Test-Driven Generation**
```
Human: "Here are my test cases: [tests]. Write code to pass them."
AI:    [Generates implementation matching tests]
```

### 5.5 Common Vibe Coding Pitfalls

| Pitfall | Problem | Solution |
|---------|---------|----------|
| **Blind acceptance** | Accepting code without understanding | Always review, run tests |
| **Underspecification** | Vague prompts → wrong code | Be specific about requirements |
| **Context overload** | Dumping too much code | Provide relevant context only |
| **Over-reliance** | Using AI for everything | Know when traditional is better |
| **Ignoring errors** | Assuming AI output is correct | Test everything |

### 5.6 Vibe Coding Quick Reference

```markdown
## Vibe Coding Best Practices

### Do:
- ✅ Specify language, framework, and version
- ✅ Provide example inputs and expected outputs
- ✅ Break complex tasks into steps
- ✅ Review and test all generated code
- ✅ Ask for explanations when needed
- ✅ Use AI for boilerplate and scaffolding

### Don't:
- ❌ Accept code blindly without review
- ❌ Use overly vague prompts
- ❌ Dump entire codebases as context
- ❌ Assume AI understands your full system
- ❌ Skip testing because "AI wrote it"
- ❌ Use AI for code you need to deeply understand
```

---

<a name="tool-landscape"></a>
## 6. Tool Landscape (1 hour)

### 6.1 AI Coding Tools Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Coding Tool Categories                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CLI Tools              IDE Extensions           Full IDEs      │
│  ──────────             ──────────────           ─────────      │
│  • Claude Code          • GitHub Copilot         • Cursor       │
│  • Aider                • Continue               • Windsurf     │
│  • Gemini CLI           • Codeium                               │
│  • GPT CLI              • Amazon Q                              │
│                                                                 │
│  Best for:              Best for:                Best for:      │
│  Terminal workflows     Existing IDE users       Full AI-first  │
│  Git integration        Inline completions       Integrated exp │
│  Scripting              Quick suggestions        Chat + code    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Claude Code (CLI)

**Installation:**
```bash
# Install via npm
npm install -g @anthropic-ai/claude-code

# Or via pip
pip install claude-code
```

**Key Features:**
- Terminal-based interface
- Deep file system integration
- Git-aware operations
- Multi-file editing

**Example Workflow:**
```bash
# Start Claude Code in a project
cd my-project
claude

# Common commands within Claude Code
> /help              # Show available commands
> /add file.py       # Add file to context
> /clear             # Clear conversation
```

### 6.3 Cursor IDE

**Key Features:**
- VS Code fork with native AI
- Cmd+K for inline edits
- Cmd+L for chat
- Multi-file context

**Setup:**
```
1. Download from cursor.sh
2. Import VS Code settings (optional)
3. Configure AI provider in settings
```

**Power User Tips:**
```
Cmd+K: "Convert this to TypeScript"  → Inline transformation
Cmd+L: "Explain this function"       → Sidebar chat
Cmd+Shift+L: Add selection to chat context
@ mentions: @file.py @codebase @docs
```

### 6.4 Gemini CLI

**Installation:**
```bash
# Install via npm
npm install -g @anthropic-ai/gemini-cli

# Or use Google Cloud SDK
gcloud components install gemini-cli
```

**Key Features:**
- Google ecosystem integration
- Fast responses
- Large context window
- Multimodal support

### 6.5 Tool Selection Matrix

Fill this out based on your needs:

```markdown
## Tool Selection Matrix

| Factor | Weight | Claude Code | Cursor | Gemini CLI | Your Choice |
|--------|--------|-------------|--------|------------|-------------|
| Terminal preference | /10 | | | | |
| IDE integration | /10 | | | | |
| Cost sensitivity | /10 | | | | |
| Team collaboration | /10 | | | | |
| Offline capability | /10 | | | | |
| Learning curve | /10 | | | | |
| **Total** | | | | | |

My primary tool: ________________
My backup tool: ________________
```

### 6.6 Tool Configuration Templates

**Claude Code Settings:**
```json
// ~/.claude/settings.json
{
  "model": "claude-3-5-sonnet-20241022",
  "temperature": 0.1,
  "max_tokens": 4096,
  "auto_save": true,
  "git_integration": true
}
```

**Cursor Settings:**
```json
// .cursor/settings.json
{
  "ai.model": "claude-3-5-sonnet",
  "ai.temperature": 0.2,
  "ai.contextLength": 16000,
  "ai.autoComplete": true
}
```

---

<a name="lab-01"></a>
## 7. Lab 01: Build First AI-Assisted App (1h 15min)

### Lab Overview

**Goal:** Build and deploy a URL shortener using AI-assisted development.

**Stack:**
- Python FastAPI backend
- TypeScript/Next.js frontend
- SQLite database (simple)
- Deployment to Vercel

**What You'll Practice:**
- AI-assisted scaffolding
- Iterative development with AI
- Deployment workflow

### Lab Instructions

Navigate to `labs/lab01-vibe-coding-intro/` and follow the README.

**Quick Start:**
```bash
cd labs/lab01-vibe-coding-intro
# Read the lab instructions
cat README.md
# Follow steps to build the URL shortener
```

### Expected Outcome

By the end of this lab, you should have:
1. A working URL shortener running locally
2. The application deployed to Vercel
3. Experience with AI-assisted development workflow

### Verification

```bash
# Test locally
curl -X POST http://localhost:8000/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.example.com/very/long/url"}'

# Should return something like:
# {"short_url": "http://localhost:8000/abc123"}
```

---

## Day 1 Summary

### What We Covered
1. **LLM Fundamentals**: Tokens, context windows, parameters
2. **Model Behavior**: Reasoning limits, hallucinations, constraints
3. **Vibe Coding**: AI-first development methodology
4. **Tool Landscape**: Claude Code, Cursor, and alternatives
5. **Practical Lab**: Built and deployed first AI-assisted app

### Key Takeaways
- LLMs are pattern matchers, not reasoners—work with this, not against it
- Hallucinations are inevitable—always verify
- AI-first development requires clear specifications and verification
- Choose tools based on your workflow, not hype

### Preparation for Day 2
- Review your model comparison notes
- Think about code tasks that could benefit from better prompts
- Consider a codebase you'd like to analyze

---

**Navigation**: [← Schedule](./SCHEDULE.md) | [Day 2: Prompting →](./DAY2-PROMPTING.md)
