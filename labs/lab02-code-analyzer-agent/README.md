# Lab 02: Code Analyzer Agent

## Objective
Build a code analysis agent that uses LLM to analyze code files and provide structured feedback.

**Time Allotted**: 1 hour 15 minutes

## Learning Goals
- Create effective system prompts for code analysis
- Implement structured output extraction
- Build a simple agent with tool-use
- Deploy to Railway

---

## What You'll Build

A FastAPI service that:
1. Accepts code via API
2. Analyzes it using an LLM
3. Returns structured JSON with issues and suggestions

```
┌─────────────────────────────────────────────────────────────┐
│                    Code Analyzer Flow                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  POST /analyze                                              │
│    ├── Input: {"code": "...", "language": "python"}         │
│    │                                                        │
│    ├── [System Prompt + Code] → LLM                         │
│    │                                                        │
│    └── Output: {                                            │
│          "summary": "Brief overview",                       │
│          "issues": [                                        │
│            {"severity": "high", "line": 5, "issue": "..."}  │
│          ],                                                 │
│          "suggestions": ["..."],                            │
│          "metrics": {"complexity": "medium", ...}           │
│        }                                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Instructions

### Step 1: Create the System Prompt (15 min)

Create a prompt that instructs the LLM to analyze code:

```python
# prompts.py
CODE_ANALYZER_SYSTEM = """You are an expert code reviewer. Analyze the provided code and return a structured analysis.

Your analysis must include:

1. SUMMARY: A 2-3 sentence overview of what the code does and its overall quality.

2. ISSUES: List of problems found, each with:
   - severity: "critical", "high", "medium", or "low"
   - line: line number (if applicable)
   - category: "bug", "security", "performance", "style", "maintainability"
   - description: clear explanation of the issue
   - suggestion: how to fix it

3. SUGGESTIONS: General improvements that aren't bugs but would make the code better.

4. METRICS:
   - complexity: "low", "medium", "high"
   - readability: "poor", "fair", "good", "excellent"
   - test_coverage_estimate: "none", "partial", "good" (based on testability)

Return your response as valid JSON matching this schema:
{
  "summary": "string",
  "issues": [
    {
      "severity": "critical|high|medium|low",
      "line": number or null,
      "category": "bug|security|performance|style|maintainability",
      "description": "string",
      "suggestion": "string"
    }
  ],
  "suggestions": ["string"],
  "metrics": {
    "complexity": "low|medium|high",
    "readability": "poor|fair|good|excellent",
    "test_coverage_estimate": "none|partial|good"
  }
}

Be thorough but constructive. Focus on actionable feedback."""
```

### Step 2: Implement the Analyzer (20 min)

```python
# analyzer.py
from typing import Optional
from pydantic import BaseModel
import json

class Issue(BaseModel):
    severity: str
    line: Optional[int]
    category: str
    description: str
    suggestion: str

class Metrics(BaseModel):
    complexity: str
    readability: str
    test_coverage_estimate: str

class AnalysisResult(BaseModel):
    summary: str
    issues: list[Issue]
    suggestions: list[str]
    metrics: Metrics

class CodeAnalyzer:
    def __init__(self, llm_client):
        self.llm = llm_client
        self.system_prompt = CODE_ANALYZER_SYSTEM

    def analyze(self, code: str, language: str = "python") -> AnalysisResult:
        """Analyze code and return structured result."""
        user_prompt = f"""Analyze this {language} code:

```{language}
{code}
```

Return your analysis as JSON."""

        response = self.llm.chat([
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_prompt}
        ])

        # Parse JSON from response
        result = self._parse_response(response)
        return result

    def _parse_response(self, response: str) -> AnalysisResult:
        """Parse LLM response into structured result."""
        # Handle markdown code blocks
        if "```json" in response:
            response = response.split("```json")[1].split("```")[0]
        elif "```" in response:
            response = response.split("```")[1].split("```")[0]

        data = json.loads(response.strip())
        return AnalysisResult(**data)
```

### Step 3: Build the API (15 min)

```python
# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from analyzer import CodeAnalyzer, AnalysisResult
from llm_client import get_llm_client

app = FastAPI(title="Code Analyzer Agent")

class AnalyzeRequest(BaseModel):
    code: str
    language: str = "python"

# Initialize analyzer
llm = get_llm_client("anthropic")  # or "openai"
analyzer = CodeAnalyzer(llm)

@app.post("/analyze", response_model=AnalysisResult)
async def analyze_code(request: AnalyzeRequest):
    """Analyze code and return structured feedback."""
    try:
        result = analyzer.analyze(request.code, request.language)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

### Step 4: Test Locally (10 min)

```bash
# Run the server
uvicorn main:app --reload

# Test with sample code
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "code": "def add(a,b):\n    return a+b\n\ndef process(data):\n    result=[]\n    for i in range(len(data)):\n        if data[i]>0:\n            result.append(data[i]*2)\n    return result",
    "language": "python"
  }'
```

Expected output should include:
- Issues about missing type hints
- Suggestions for list comprehension
- Metrics about complexity

### Step 5: Add Multiple Analysis Types (10 min)

Extend to support different analysis focuses:

```python
# Add to analyzer.py
SECURITY_FOCUS_PROMPT = """Focus specifically on security vulnerabilities:
- SQL injection
- Command injection
- Path traversal
- Hardcoded secrets
- Input validation issues
..."""

PERFORMANCE_FOCUS_PROMPT = """Focus specifically on performance:
- Algorithm complexity
- Memory usage
- Unnecessary loops
- Caching opportunities
..."""

def analyze_security(self, code: str, language: str) -> AnalysisResult:
    """Security-focused analysis."""
    # Implementation

def analyze_performance(self, code: str, language: str) -> AnalysisResult:
    """Performance-focused analysis."""
    # Implementation
```

### Step 6: Deploy to Railway (15 min)

```bash
# Initialize Railway
railway init

# Create Procfile
echo "web: uvicorn main:app --host 0.0.0.0 --port \$PORT" > Procfile

# Set environment variables
railway variables set ANTHROPIC_API_KEY=your_key

# Deploy
railway up

# Get URL
railway status
```

---

## Starter Files

### requirements.txt
```
fastapi==0.109.0
uvicorn==0.27.0
pydantic==2.5.3
anthropic==0.18.0
openai==1.12.0
python-dotenv==1.0.0
```

### llm_client.py
```python
"""LLM client abstraction."""
import os
from abc import ABC, abstractmethod

class LLMClient(ABC):
    @abstractmethod
    def chat(self, messages: list) -> str:
        pass

class AnthropicClient(LLMClient):
    def __init__(self):
        from anthropic import Anthropic
        self.client = Anthropic()
        self.model = "claude-3-5-sonnet-20241022"

    def chat(self, messages: list) -> str:
        system = None
        filtered = []
        for m in messages:
            if m["role"] == "system":
                system = m["content"]
            else:
                filtered.append(m)

        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=system,
            messages=filtered
        )
        return response.content[0].text

class OpenAIClient(LLMClient):
    def __init__(self):
        from openai import OpenAI
        self.client = OpenAI()
        self.model = "gpt-4o"

    def chat(self, messages: list) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages
        )
        return response.choices[0].message.content

def get_llm_client(provider: str = "anthropic") -> LLMClient:
    if provider == "anthropic":
        return AnthropicClient()
    elif provider == "openai":
        return OpenAIClient()
    else:
        raise ValueError(f"Unknown provider: {provider}")
```

---

## Deliverables

- [ ] Working code analyzer API
- [ ] Custom system prompt for analysis
- [ ] Structured JSON output
- [ ] At least 2 analysis types (general + security OR performance)
- [ ] Deployed to Railway
- [ ] Tested with sample code

---

## Extension Challenges

1. **Multi-file Analysis**: Accept multiple files and analyze relationships
2. **Diff Analysis**: Analyze code changes between two versions
3. **Language Detection**: Auto-detect programming language
4. **Caching**: Cache results for identical code

---

**Next**: [Lab 03 - Migration Workflow Agent](../lab03-migration-workflow/)
