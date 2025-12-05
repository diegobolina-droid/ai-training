---
marp: true
theme: default
paginate: true
header: 'Agentic AI Training'
footer: 'Day 2 - Advanced Prompting'
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
# Day 2: Advanced Prompting for Engineering

## Agentic AI Training Program

**Master the art of communicating with LLMs**

---

# Learning Objectives

By the end of Day 2, you will be able to:

- Write effective prompts using advanced patterns
- Design system prompts and personas
- Create specialized prompts for code tasks
- Build prompts for migrations and refactoring
- Develop your personal prompt library

---

# What is Prompt Engineering?

**The practice of designing inputs to get desired outputs from LLMs**

```
┌─────────────────────────────────────────────────────────────┐
│                The Prompt Engineering Stack                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  System Prompt       "You are a senior Python developer..." │
│       ↓                                                     │
│  Context/Examples    "Here's an example of good code..."    │
│       ↓                                                     │
│  Task Definition     "Refactor the following function to..."│
│       ↓                                                     │
│  Format Spec         "Return as JSON with fields..."        │
│       ↓                                                     │
│  Input               [The actual code/data to process]      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# The RCFG Framework

Structure effective prompts with four components:

| Component | Purpose | Example |
|-----------|---------|---------|
| **R**ole | Set expertise | "You are a security-focused code reviewer" |
| **C**ontext | Provide background | "We're migrating Django 2.x to 4.x" |
| **F**ormat | Specify output | "Return JSON with 'issues' and 'suggestions'" |
| **G**oal | Define the task | "Identify breaking changes" |

---

# RCFG Example: Before & After

**Before (Vague):**
```
Review this code for issues.

def calc(x,y):
    return x+y
```

**After (RCFG-Structured):**
```
Role: You are a senior Python developer specializing in clean code.

Context: This is part of a financial calculation library where
precision and readability are critical.

Goal: Review for naming, readability, bugs, and improvements.

Format: Return as ## Issues and ## Suggestions sections.

Code to review: [code here]
```

---

# Clarity Principles

**Be Specific, Not Vague:**

| Vague | Specific |
|-------|----------|
| "Make this better" | "Reduce time complexity from O(n²) to O(n log n)" |
| "Fix the bug" | "Fix the off-by-one error in the loop bounds" |
| "Add comments" | "Add docstrings with params, returns, and exceptions" |
| "Optimize this" | "Reduce memory usage by avoiding list copies" |

---

# Use Concrete Examples

**Bad:**
```
Format output nicely
```

**Good:**
```
Format output as:
{
  "status": "success",
  "data": {
    "processed": 150,
    "failed": 3
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

# Common Prompting Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| **Ambiguity** | Model guesses intent | Be explicit about requirements |
| **Missing context** | Wrong assumptions | Provide relevant background |
| **No format spec** | Inconsistent output | Define exact output structure |
| **Too much at once** | Confused/incomplete | Break into steps |
| **Assuming knowledge** | Hallucinations | Provide facts, don't expect them |

---

<!-- _class: lead -->
# Advanced Prompting Patterns

---

# Chain-of-Thought (CoT) Prompting

Encourage the model to **show its reasoning**

```
Solve this step by step:

A function receives a list of timestamps and needs to find
the longest gap between consecutive timestamps.
The timestamps are not sorted.

Think through each step before writing code.
```

**When to use**: Complex reasoning, math, multi-step logic

---

# Structured Chain-of-Thought

```
Analyze this algorithm problem step by step:

Problem: Find the longest palindromic substring in a string.

Step 1: Understand the problem
- What is a palindrome?
- What does "longest" mean here?

Step 2: Consider approaches
- What algorithms could solve this?
- What are their complexities?

Step 3: Choose and justify
- Which approach is best and why?

Step 4: Implement with comments

Step 5: Verify with an example
```

---

# Few-Shot Prompting

Provide examples to establish patterns:

```
Convert English descriptions to SQL queries.

Example 1:
Description: Get all users who signed up in 2024
SQL: SELECT * FROM users WHERE YEAR(signup_date) = 2024;

Example 2:
Description: Count orders by status
SQL: SELECT status, COUNT(*) FROM orders GROUP BY status;

Now convert:
Description: Get active users with at least 3 orders
SQL:
```

---

# Few-Shot for Code Style

```
Refactor functions to follow our team's style guide.

Before:
def getData(userID):
    result = db.query(f"SELECT * FROM users WHERE id = {userID}")
    return result

After:
def get_user_data(user_id: int) -> Optional[User]:
    """Fetch user data by ID."""
    return db.query(User).filter(User.id == user_id).first()

---
Now refactor:
def processOrder(o):
    if o.status == "pending":
        o.status = "processing"
        sendEmail(o.user)
        return True
    return False
```

---

# Self-Consistency Pattern

Ask the model to **verify its own output**:

```
Write a function to check if a binary tree is balanced.

After writing the code:
1. Verify the logic by tracing through an example
2. Check edge cases (empty tree, single node)
3. Confirm time and space complexity
4. If you find any issues, revise the code
```

---

# Tree of Thought

Explore **multiple approaches** before committing:

```
Problem: Design a rate limiter for an API.

Approach 1: Fixed Window
- How it works: [explain]
- Pros: [list]
- Cons: [list]

Approach 2: Sliding Window
- How it works: [explain]
- Pros: [list]
- Cons: [list]

Approach 3: Token Bucket
- How it works: [explain]
- Pros: [list]
- Cons: [list]

Given our requirements (high-traffic, distributed),
which is best and why?
```

---

# Prompt Chaining

Break complex tasks into **sequential steps**:

```python
CHAIN = [
    {
        "name": "understand",
        "prompt": "Analyze this code and provide:\n1. What it does\n2. Key functions\n3. Dependencies\n\nCode: {code}"
    },
    {
        "name": "identify_issues",
        "prompt": "Based on this understanding:\n{understanding}\n\nIdentify bugs, performance issues, security vulnerabilities."
    },
    {
        "name": "suggest_fixes",
        "prompt": "For each issue:\n{issues}\n\nProvide specific fix with code."
    }
]
```

---

# Pattern Quick Reference

| Pattern | When to Use | Trigger Phrase |
|---------|-------------|----------------|
| **Chain-of-Thought** | Complex reasoning | "Think step by step" |
| **Few-Shot** | Specific format needed | "Here are examples..." |
| **Self-Consistency** | High accuracy needed | "Verify your answer" |
| **Tree of Thought** | Design decisions | "Consider approaches..." |
| **Prompt Chaining** | Multi-stage tasks | Multiple prompts in sequence |

---

<!-- _class: lead -->
# System Prompts & Persona Engineering

---

# What is a System Prompt?

Sets **overall behavior** that persists across the conversation:

```
┌─────────────────────────────────────────────────────────────┐
│                   System Prompt Impact                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  System: "You are a helpful assistant"                      │
│  User: "Write a function to delete files"                   │
│  → Generic, may include unsafe patterns                     │
│                                                             │
│  System: "You are a security-conscious Python developer.    │
│           Always validate inputs, handle errors safely,     │
│           and never use shell=True or eval()."              │
│  User: "Write a function to delete files"                   │
│  → Includes path validation, error handling, safety checks  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# System Prompt Template

```markdown
## Identity & Expertise
You are [role] with expertise in [domains].

## Core Behaviors
- Always [positive behaviors]
- Never [negative behaviors/constraints]

## Response Style
- Tone: [professional/casual/technical]
- Length: [concise/detailed]
- Format: [default output format]

## Special Instructions
[Any project-specific rules]
```

---

# Persona: Code Reviewer

```
You are a senior software engineer conducting code reviews.
You have 15 years of experience across multiple languages.

Core behaviors:
- Be constructive and specific in feedback
- Prioritize issues by severity (critical → minor)
- Explain WHY something is an issue, not just WHAT
- Suggest concrete fixes, not vague improvements
- Acknowledge good practices when you see them

Response format:
1. Summary (1-2 sentences)
2. Critical Issues (must fix)
3. Improvements (should fix)
4. Suggestions (nice to have)
5. Positive Notes (what's done well)
```

---

# Persona: Security Auditor

```
You are a security auditor specializing in application security.

Focus areas:
- OWASP Top 10 vulnerabilities
- Input validation and sanitization
- Authentication and authorization flaws
- Sensitive data exposure

For each vulnerability found:
1. Severity: Critical/High/Medium/Low
2. Location: File and line number
3. Description: What the vulnerability is
4. Impact: What could happen if exploited
5. Fix: Specific remediation code
```

---

# Persona: Legacy Code Archaeologist

```
You are a software archaeologist specializing in understanding
and documenting legacy code. You approach old code with
curiosity, not judgment.

Your approach:
1. Understand before criticizing
2. Document the "why" behind unusual patterns
3. Identify the core business logic
4. Map dependencies and data flows
5. Note technical debt without dramatizing

Output format:
## Purpose - What this code does in business terms
## Architecture - How it's structured and why (probably)
## Key Components - Important pieces and their roles
## Historical Patterns - Outdated patterns and likely reasons
## Modernization Opportunities - What to improve
## Risks - What could break if changed
```

---

# Context Injection Strategies

**Strategy 1: Documentation Injection**
```
You are a developer working with the FastAPI framework.

Here is the relevant documentation for this task:
---
FastAPI Query Parameters:
Query parameters are declared as function parameters...
[relevant docs]
---

Using this documentation, [task]...
```

---

# Context Injection: Codebase Patterns

**Strategy 2: Codebase Patterns**
```
You are working on a codebase with these established patterns:

Error Handling:
class AppError(Exception):
    def __init__(self, message: str, code: str, status: int = 400):
        ...

Logging:
from app.logging import get_logger
logger = get_logger(__name__)

Database Access:
async with get_session() as session:
    result = await session.execute(query)

Follow these patterns exactly in your code.
```

---

# Context Injection: Constraints First

**Strategy 3: Constraints First**
```
CONSTRAINTS (must follow):
- Python 3.10+ only
- No external dependencies beyond stdlib
- Must handle errors gracefully
- All functions need type hints
- Max function length: 30 lines

PREFERENCES (follow when possible):
- Prefer comprehensions over loops
- Use dataclasses for data structures
- Keep cyclomatic complexity under 10

Now, implement [task]...
```

---

<!-- _class: lead -->
# Code-Focused Prompting

---

# Prompt: Understanding Unfamiliar Code

```
Analyze this code as if you're onboarding to a new project.

Provide:
1. Purpose: What problem does this solve? (2-3 sentences)
2. Flow: Step-by-step execution walkthrough
3. Dependencies: External libraries/services used
4. Data: What data structures are used and why
5. Edge Cases: What inputs might cause issues
6. Questions: What would you ask the original author?

Code:
[paste code]
```

---

# Prompt: Identifying Code Smells

```
Identify code smells in this code. For each smell:

1. Name the smell (e.g., "Long Method", "Feature Envy")
2. Location (line numbers or function names)
3. Why it's problematic
4. Refactoring suggestion

Focus on:
- Methods doing too many things
- Inappropriate coupling
- Duplicated logic
- Complex conditionals
- Poor naming

Code:
[paste code]
```

---

# Prompt: Complexity Analysis

```
Analyze the complexity of this code:

1. Time Complexity
   - Best case: O(?)
   - Average case: O(?)
   - Worst case: O(?)
   - What inputs cause each case?

2. Space Complexity
   - Additional space used: O(?)
   - What contributes to space usage?

3. Potential Optimizations
   - What could improve complexity?
   - Trade-offs of each optimization?

Code:
[paste code]
```

---

# Prompt: Feature Implementation

```
Implement a [feature name] for our [system type].

Requirements:
- [Requirement 1]
- [Requirement 2]

Constraints:
- Language: [language and version]
- Must integrate with: [existing components]
- Performance: [any requirements]

Existing interfaces to use:
[relevant existing code/interfaces]

Provide:
1. Implementation with full type hints
2. Docstrings explaining usage
3. Example usage code
4. Unit test cases
```

---

# Prompt: Test Generation

```
Generate comprehensive tests for this function:

def calculate_shipping(
    weight_kg: float,
    distance_km: float,
    express: bool = False
) -> float:
    """Calculate shipping cost based on weight, distance, speed."""
    base_rate = 5.0
    weight_rate = 2.0 * weight_kg
    distance_rate = 0.1 * distance_km
    total = base_rate + weight_rate + distance_rate
    if express:
        total *= 1.5
    return round(total, 2)

Cover:
1. Happy path cases
2. Edge cases (zero, very large values)
3. Error cases (negative, invalid types)
4. Boundary conditions
```

---

# Prompt: Security Review

```
Perform a security review of this code:

Check for:
1. Injection vulnerabilities (SQL, command, template)
2. Authentication/authorization issues
3. Sensitive data exposure
4. Input validation gaps
5. Error handling that leaks information
6. Insecure dependencies or configurations

For each finding:
- Severity: Critical/High/Medium/Low
- OWASP category (if applicable)
- Location in code
- Attack scenario
- Remediation with code example

Code:
[paste code]
```

---

# Prompt: Debugging

```
Debug this code systematically.

Observed behavior:
[What happens]

Expected behavior:
[What should happen]

Error message (if any):
[Paste error]

Code:
[paste code]

Debugging steps:
1. Reproduce: Identify minimum reproduction case
2. Isolate: Which part causes the issue?
3. Hypothesize: What could cause this behavior?
4. Verify: Test each hypothesis
5. Fix: Implement and verify the solution
```

---

<!-- _class: lead -->
# Migration & Refactoring Prompts

---

# Migration Analysis Prompt

```
I need to migrate from {old_framework} to {new_framework}.

Current codebase:
- Size: {approximate size}
- Age: {how old}
- Test coverage: {percentage}

Goals:
- [Goal 1]
- [Goal 2]

Provide:
1. Migration strategy overview
2. Breaking changes to expect
3. Step-by-step migration order
4. Risk areas and mitigation
5. Estimated effort by component
```

---

# Example: Django to FastAPI Migration

```
Analyze this Django view for migration to FastAPI:

[Django code]

Provide:
1. Equivalent FastAPI code
2. Changes needed for:
   - Routing
   - Request/response handling
   - Validation (Pydantic instead of DRF serializers)
   - Database access (async SQLAlchemy)
3. What to watch out for
4. Required dependencies
```

---

# Technical Debt Assessment

```
Assess technical debt in this code:

Categorize debt by:
1. Deliberate/Prudent: Known shortcuts for good reasons
2. Deliberate/Reckless: Known shortcuts, ignoring consequences
3. Inadvertent/Prudent: Unknown best practices at the time
4. Inadvertent/Reckless: Poor understanding led to bad decisions

For each item:
- Type of debt
- Location
- Impact (maintenance cost, bug risk, performance)
- Remediation effort: Low/Medium/High
- Priority: Fix now / Fix soon / Fix eventually

Code:
[paste code]
```

---

# Code Prompting Library

Build your reusable templates:

```python
ANALYZE_CODE = """
Analyze this code and provide:
1. **Purpose** - What problem does this solve?
2. **Key Components** - Functions/classes and their roles
3. **Flow** - Step-by-step execution
4. **Dependencies** - External libraries used
5. **Edge Cases** - Potential issues

Code:
```{language}
{code}
```
"""

# Usage:
prompt = ANALYZE_CODE.format(language="python", code=my_code)
```

---

# Lab 02: Build Code Analyzer Agent

**Project: Code Analyzer API**

You'll build:
- FastAPI/Hono endpoint for code analysis
- System prompt engineering for analysis
- Structured JSON output
- Deployment to Railway

```bash
# Navigate to the lab
cd labs/lab02-code-analyzer-agent

# Read the instructions
cat README.md
```

---

# Day 2 Key Takeaways

1. **RCFG Framework** - Role, Context, Format, Goal
2. **CoT for reasoning** - "Think step by step"
3. **Few-shot for patterns** - Show examples
4. **System prompts shape behavior** - Consistent across conversation
5. **Different tasks need different prompts** - Build your library

---

# Your Prompt Library Checklist

By now you should have started building:

- [ ] At least 5 reusable code prompts
- [ ] 2-3 system prompt templates
- [ ] Examples of before/after prompt optimization

---

# What's Next: Day 3

**Agent Architectures**

- What makes an agent vs simple LLM call
- Tool/Function calling
- ReAct pattern
- State machines for workflows
- Multi-agent patterns

---

<!-- _class: lead -->
# Questions?

**Lab 02 awaits!**

```
cd labs/lab02-code-analyzer-agent
```
