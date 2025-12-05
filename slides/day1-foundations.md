---
marp: true
theme: default
paginate: true
header: 'Agentic AI Training'
footer: 'Day 1 - GenAI Foundations'
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
# Day 1: GenAI Foundations & Vibe Coding

## Agentic AI Training Program

**From Zero GenAI Experience to Production-Ready**

---

# Learning Objectives

By the end of Day 1, you will be able to:

- Explain how LLMs work at a conceptual level
- Understand tokens, context windows, and limitations
- Use AI coding assistants effectively
- Apply "vibe coding" techniques for rapid development
- Build and deploy your first AI-assisted application

---

# What is Generative AI?

**AI that creates new content** rather than just analyzing existing data

```
Traditional ML          vs          Generative AI
─────────────                       ──────────────
Input → Classification              Input → New Content
"Is this spam?" → Yes/No            "Write an email" → Full email
```

**Types of Generative AI:**
- Text (LLMs): GPT-4, Claude, Gemini
- Images: DALL-E, Midjourney, Stable Diffusion
- Audio: Whisper, ElevenLabs
- Video: Sora, Runway
- Code: Copilot, Claude Code

---

# Large Language Models (LLMs)

Neural networks trained on massive text datasets to **predict the next token**

```
Training: "The cat sat on the ___"
                                ↓
          [mat: 0.3, floor: 0.2, chair: 0.15, dog: 0.01, ...]
```

**Key insight**: Next-token prediction at massive scale produces emergent capabilities:
- Following instructions
- Reasoning
- Code generation
- Translation

---

# The Transformer Architecture (Simplified)

```
┌─────────────────────────────────────────────────────────────┐
│                    TRANSFORMER                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Input Text                                                │
│       ↓                                                     │
│   ┌──────────────┐                                          │
│   │ Tokenization │  "Hello world" → [15496, 995]            │
│   └──────────────┘                                          │
│       ↓                                                     │
│   ┌──────────────┐                                          │
│   │  Embeddings  │  Tokens → Dense vectors                  │
│   └──────────────┘                                          │
│       ↓                                                     │
│   ┌──────────────┐                                          │
│   │  Attention   │  "Which tokens relate to each other?"    │
│   └──────────────┘                                          │
│       ↓                                                     │
│   ┌──────────────┐                                          │
│   │   Output     │  Probability distribution over tokens    │
│   └──────────────┘                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# Self-Attention: The Key Innovation

Attention allows the model to **focus on relevant parts** of the input

```
"The cat sat on the mat because it was tired"
                                 ↑
                          What does "it" refer to?
```

Attention scores show **"it" → "cat"** has high attention

This enables:
- Long-range dependencies
- Context understanding
- Nuanced interpretation

---

# Understanding Tokens

Tokens are the **basic units** LLMs work with (not characters, not words)

```python
# Common tokenization examples
"Hello"     → ["Hello"]           # 1 token
"hello"     → ["hello"]           # 1 token
"Hello!"    → ["Hello", "!"]      # 2 tokens
"don't"     → ["don", "'t"]       # 2 tokens
"ChatGPT"   → ["Chat", "GPT"]     # 2 tokens
"🎉"        → ["🎉"]               # 1 token (usually)
```

**Rule of thumb**: 1 token ≈ 4 characters in English

**Why it matters**:
- API pricing is per token
- Context limits are in tokens
- Long code = many tokens

---

# Context Windows

The **maximum tokens** an LLM can process at once

| Model | Context Window | ~Pages of Text |
|-------|----------------|----------------|
| GPT-3.5 | 4,096 tokens | ~6 pages |
| GPT-4 | 8,192 - 128K | 12 - 200 pages |
| Claude 3.5 | 200K tokens | ~300 pages |
| Claude 3 Opus | 200K tokens | ~300 pages |
| Gemini 1.5 Pro | 1M tokens | ~1,500 pages |

**Context = Input + Output**
- Your prompt uses tokens
- The response uses tokens
- Both count toward the limit!

---

# LLM Limitations

**Know the boundaries:**

| Limitation | Description |
|------------|-------------|
| **Knowledge Cutoff** | No info after training date |
| **Hallucinations** | Confidently wrong answers |
| **No Execution** | Can't run code or access internet |
| **Context Limits** | Can't process unlimited text |
| **Consistency** | May give different answers to same question |
| **Math** | Unreliable for complex calculations |

---

# Hallucinations: The Critical Challenge

LLMs can generate **plausible but false** information

```
User: "What is the airspeed velocity of an unladen swallow?"

LLM: "The airspeed velocity of an unladen European swallow
      is approximately 11 meters per second or 24 mph."

      ❌ Sounds authoritative but this specific number is made up!
```

**Mitigation strategies:**
- Ask for sources
- Verify critical facts
- Use RAG for grounding
- Chain-of-thought prompting

---

# The Temperature Parameter

Controls **randomness** in outputs

```
Temperature 0.0          Temperature 0.7          Temperature 1.0
─────────────           ─────────────           ─────────────
Deterministic           Balanced                Creative
Repetitive              Natural                 Unpredictable
Best for:               Best for:               Best for:
- Code                  - Chat                  - Brainstorming
- Facts                 - Writing               - Creative writing
- Analysis              - General use           - Exploration
```

**Default**: Most APIs use 0.7-1.0

---

# API Basics: Making LLM Calls

```python
# Python with OpenAI
from openai import OpenAI
client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is Python?"}
    ],
    temperature=0.7
)

print(response.choices[0].message.content)
```

**Three message types:**
- `system`: Sets behavior/persona
- `user`: Human input
- `assistant`: LLM responses

---

# API Basics: TypeScript Version

```typescript
// TypeScript with Anthropic
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const response = await client.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  system: "You are a helpful assistant.",
  messages: [
    { role: "user", content: "What is TypeScript?" }
  ]
});

console.log(response.content[0].text);
```

---

# AI Coding Assistants

Tools that integrate LLMs into your development workflow

| Tool | Type | Best For |
|------|------|----------|
| **Claude Code** | CLI | Terminal-based development |
| **Cursor** | IDE | Full IDE experience |
| **GitHub Copilot** | Extension | Inline completions |
| **Aider** | CLI | Git-integrated coding |
| **Continue** | Extension | Open-source alternative |

---

# What is Vibe Coding?

**Collaborative coding with AI** where you guide the direction and the AI handles implementation details

```
Traditional Coding:
1. Think of solution
2. Type every character
3. Debug syntax errors
4. Look up documentation

Vibe Coding:
1. Describe what you want
2. Review AI suggestion
3. Refine with feedback
4. Integrate and test
```

**You're the architect, AI is the builder**

---

# Vibe Coding Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                   VIBE CODING LOOP                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. DESCRIBE          "Create a REST API endpoint that..." │
│        ↓                                                    │
│   2. REVIEW            Read generated code carefully        │
│        ↓                                                    │
│   3. REFINE            "Add error handling for..."          │
│        ↓                                                    │
│   4. TEST              Run it, see what breaks              │
│        ↓                                                    │
│   5. ITERATE           "Now also handle the case where..."  │
│        ↓                                                    │
│   [Back to step 2]                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# Effective AI Prompting for Code

**Be specific about what you want:**

```
❌ Bad: "Make this better"

✅ Good: "Refactor this function to:
         1. Use type hints
         2. Handle the case where input is empty
         3. Add a docstring with examples
         4. Reduce time complexity to O(n)"
```

**Include context:**
- Language and version
- Framework being used
- Existing patterns in codebase
- Constraints (performance, security)

---

# When to Use AI Assistance

**Great for:**
- Boilerplate code generation
- Converting between formats
- Writing tests
- Documentation
- Exploring unfamiliar APIs
- Debugging error messages
- Refactoring suggestions

**Be careful with:**
- Security-critical code
- Novel algorithms
- Highly optimized code
- Domain-specific business logic

---

# Trust but Verify

**AI makes mistakes.** Always:

1. **Read the code** - Don't blindly copy-paste
2. **Understand the logic** - Can you explain it?
3. **Test thoroughly** - Edge cases especially
4. **Check security** - SQL injection, XSS, etc.
5. **Verify facts** - Documentation claims, version numbers

```python
# AI might generate this:
import os
os.system(f"rm -rf {user_input}")  # 🚨 DANGEROUS!

# Always review for security issues!
```

---

# Free Tier LLM Options

You can complete this training at **zero cost**:

| Provider | Free Tier | Best For |
|----------|-----------|----------|
| **Google AI Studio** | Very generous | General use |
| **Groq** | Fast inference | Speed |
| **Ollama** | 100% free, local | Privacy |
| **Anthropic** | $5 free credit | Claude models |
| **OpenAI** | $5 free credit | GPT models |

See `FREE-TIER-STRATEGY.md` for details

---

# Model Selection Guide

```
┌────────────────────────────────────────────────────────────┐
│                    CHOOSING A MODEL                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│   TASK COMPLEXITY                                          │
│   ────────────────                                         │
│   Simple → Use smaller/faster models (GPT-3.5, Haiku)      │
│   Complex → Use larger models (GPT-4, Claude Sonnet/Opus)  │
│                                                            │
│   REQUIREMENTS                                             │
│   ────────────                                             │
│   Speed critical → Groq, Haiku                             │
│   Quality critical → Claude Opus, GPT-4                    │
│   Cost sensitive → Open source, smaller models             │
│   Privacy needed → Local models (Ollama)                   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

# Lab 01: Build Your First AI App

**Project: URL Shortener**

You'll build:
- REST API with FastAPI (Python) or Hono (TypeScript)
- LLM-powered URL categorization
- Deploy to cloud platform

```bash
# Navigate to the lab
cd labs/lab01-vibe-coding-intro

# Read the instructions
cat README.md

# Choose your language
cd python/    # or typescript/
```

---

# Day 1 Key Takeaways

1. **LLMs predict tokens** - Understanding this helps predict behavior
2. **Context has limits** - Plan for what fits in the window
3. **Hallucinations happen** - Always verify important facts
4. **Vibe coding is collaborative** - You direct, AI assists
5. **Trust but verify** - Review all generated code

---

# What's Next: Day 2

**Advanced Prompting for Engineering**

- RCFG Framework
- Chain-of-Thought prompting
- Few-shot learning
- System prompts & personas
- Code-focused prompting patterns

---

<!-- _class: lead -->
# Questions?

**Lab 01 awaits!**

```
cd labs/lab01-vibe-coding-intro
```
