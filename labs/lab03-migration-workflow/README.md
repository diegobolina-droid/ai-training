# Lab 03: Migration Workflow Agent

## Objective
Build a multi-step agent that can migrate code between frameworks using the planning pattern.

**Time Allotted**: 1 hour 45 minutes

## Learning Goals
- Implement the planning agent pattern
- Build multi-step workflows with verification
- Handle complex tasks with tool-use
- Manage state across agent iterations

---

## What You'll Build

An agent that can:
1. Analyze source code to understand its structure
2. Create a migration plan
3. Execute migration steps
4. Verify the migration worked

```
┌─────────────────────────────────────────────────────────────┐
│                 Migration Agent Workflow                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Input: Source files + target framework                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ PHASE 1: ANALYSIS                                    │   │
│  │  • Parse source files                                │   │
│  │  • Identify patterns and dependencies                │   │
│  │  • Detect potential issues                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ PHASE 2: PLANNING                                    │   │
│  │  • Create step-by-step migration plan                │   │
│  │  • Identify dependencies between steps               │   │
│  │  • Estimate complexity per step                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ PHASE 3: EXECUTION                                   │   │
│  │  • Execute each step in order                        │   │
│  │  • Generate migrated code                            │   │
│  │  • Track progress and results                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ PHASE 4: VERIFICATION                                │   │
│  │  • Check migrated code compiles/runs                 │   │
│  │  • Identify any remaining issues                     │   │
│  │  • Generate migration report                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Output: Migrated files + report                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Instructions

### Step 1: Define the Agent State (15 min)

```python
# state.py
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
from enum import Enum

class Phase(Enum):
    ANALYSIS = "analysis"
    PLANNING = "planning"
    EXECUTION = "execution"
    VERIFICATION = "verification"
    COMPLETE = "complete"

@dataclass
class MigrationStep:
    id: int
    description: str
    status: str = "pending"  # pending, in_progress, completed, failed
    input_files: List[str] = field(default_factory=list)
    output_files: List[str] = field(default_factory=list)
    result: Optional[str] = None

@dataclass
class MigrationState:
    source_framework: str
    target_framework: str
    source_files: Dict[str, str]  # filename -> content
    phase: Phase = Phase.ANALYSIS
    analysis: Optional[Dict[str, Any]] = None
    plan: List[MigrationStep] = field(default_factory=list)
    current_step: int = 0
    migrated_files: Dict[str, str] = field(default_factory=dict)
    verification_result: Optional[Dict] = None
    errors: List[str] = field(default_factory=list)
```

### Step 2: Implement the Agent Tools (20 min)

```python
# tools.py
from typing import Dict, List

def analyze_code_tool(code: str, language: str) -> Dict:
    """Analyze code structure and patterns."""
    # This would use LLM in real implementation
    return {
        "name": "analyze_code",
        "description": "Analyze source code to understand structure and patterns",
        "parameters": {
            "type": "object",
            "properties": {
                "code": {"type": "string"},
                "language": {"type": "string"}
            },
            "required": ["code", "language"]
        }
    }

def create_plan_tool() -> Dict:
    """Create a migration plan."""
    return {
        "name": "create_plan",
        "description": "Create a step-by-step migration plan",
        "parameters": {
            "type": "object",
            "properties": {
                "analysis": {"type": "object"},
                "target_framework": {"type": "string"}
            },
            "required": ["analysis", "target_framework"]
        }
    }

def migrate_code_tool() -> Dict:
    """Migrate a piece of code."""
    return {
        "name": "migrate_code",
        "description": "Migrate code from source to target framework",
        "parameters": {
            "type": "object",
            "properties": {
                "source_code": {"type": "string"},
                "source_framework": {"type": "string"},
                "target_framework": {"type": "string"},
                "context": {"type": "string"}
            },
            "required": ["source_code", "source_framework", "target_framework"]
        }
    }

def verify_code_tool() -> Dict:
    """Verify migrated code."""
    return {
        "name": "verify_code",
        "description": "Verify that migrated code is valid",
        "parameters": {
            "type": "object",
            "properties": {
                "code": {"type": "string"},
                "language": {"type": "string"}
            },
            "required": ["code", "language"]
        }
    }
```

### Step 3: Implement the Agent Core (25 min)

```python
# agent.py
from state import MigrationState, Phase, MigrationStep
from typing import Dict, List
import json

ANALYSIS_PROMPT = """Analyze this code for migration from {source} to {target}.

Code:
```{language}
{code}
```

Identify:
1. Main components (classes, functions, routes)
2. Dependencies and imports
3. Framework-specific patterns
4. Potential migration challenges

Return as JSON:
{{
  "components": [...],
  "dependencies": [...],
  "patterns": [...],
  "challenges": [...]
}}"""

PLANNING_PROMPT = """Create a migration plan based on this analysis.

Analysis: {analysis}

Source Framework: {source}
Target Framework: {target}

Create a step-by-step plan. Each step should be:
- Independent enough to execute separately
- Ordered by dependencies
- Specific about what changes

Return as JSON:
{{
  "steps": [
    {{
      "id": 1,
      "description": "...",
      "input_files": ["..."],
      "dependencies": [],
      "complexity": "low|medium|high"
    }}
  ]
}}"""

MIGRATION_PROMPT = """Migrate this code from {source} to {target}.

Source Code:
```
{code}
```

Context from previous steps:
{context}

Provide the migrated code that follows {target} best practices.
Explain any significant changes."""

class MigrationAgent:
    def __init__(self, llm_client):
        self.llm = llm_client

    def run(self, state: MigrationState) -> MigrationState:
        """Run the migration agent through all phases."""
        while state.phase != Phase.COMPLETE:
            state = self._step(state)
            if state.errors:
                break
        return state

    def _step(self, state: MigrationState) -> MigrationState:
        """Execute one phase of the migration."""
        if state.phase == Phase.ANALYSIS:
            return self._analyze(state)
        elif state.phase == Phase.PLANNING:
            return self._plan(state)
        elif state.phase == Phase.EXECUTION:
            return self._execute(state)
        elif state.phase == Phase.VERIFICATION:
            return self._verify(state)
        return state

    def _analyze(self, state: MigrationState) -> MigrationState:
        """Analyze source code."""
        all_analysis = {}

        for filename, code in state.source_files.items():
            prompt = ANALYSIS_PROMPT.format(
                source=state.source_framework,
                target=state.target_framework,
                language=self._detect_language(filename),
                code=code
            )

            response = self.llm.chat([
                {"role": "user", "content": prompt}
            ])

            all_analysis[filename] = self._parse_json(response)

        state.analysis = all_analysis
        state.phase = Phase.PLANNING
        return state

    def _plan(self, state: MigrationState) -> MigrationState:
        """Create migration plan."""
        prompt = PLANNING_PROMPT.format(
            analysis=json.dumps(state.analysis, indent=2),
            source=state.source_framework,
            target=state.target_framework
        )

        response = self.llm.chat([
            {"role": "user", "content": prompt}
        ])

        plan_data = self._parse_json(response)

        state.plan = [
            MigrationStep(
                id=step["id"],
                description=step["description"],
                input_files=step.get("input_files", [])
            )
            for step in plan_data.get("steps", [])
        ]

        state.phase = Phase.EXECUTION
        return state

    def _execute(self, state: MigrationState) -> MigrationState:
        """Execute migration steps."""
        while state.current_step < len(state.plan):
            step = state.plan[state.current_step]
            step.status = "in_progress"

            # Get relevant source code
            source_code = self._get_step_code(state, step)

            prompt = MIGRATION_PROMPT.format(
                source=state.source_framework,
                target=state.target_framework,
                code=source_code,
                context=self._get_context(state)
            )

            response = self.llm.chat([
                {"role": "user", "content": prompt}
            ])

            # Extract code from response
            migrated_code = self._extract_code(response)

            # Store result
            for filename in step.input_files:
                new_filename = self._transform_filename(filename, state.target_framework)
                state.migrated_files[new_filename] = migrated_code

            step.status = "completed"
            step.result = migrated_code
            state.current_step += 1

        state.phase = Phase.VERIFICATION
        return state

    def _verify(self, state: MigrationState) -> MigrationState:
        """Verify migration results."""
        verification = {
            "files_migrated": len(state.migrated_files),
            "steps_completed": len([s for s in state.plan if s.status == "completed"]),
            "issues": []
        }

        # Check each migrated file
        for filename, code in state.migrated_files.items():
            # Basic syntax check
            issues = self._check_syntax(code, state.target_framework)
            if issues:
                verification["issues"].extend(issues)

        state.verification_result = verification
        state.phase = Phase.COMPLETE
        return state

    def _detect_language(self, filename: str) -> str:
        """Detect language from filename."""
        ext_map = {
            ".py": "python",
            ".js": "javascript",
            ".ts": "typescript",
            ".java": "java"
        }
        for ext, lang in ext_map.items():
            if filename.endswith(ext):
                return lang
        return "unknown"

    def _parse_json(self, response: str) -> Dict:
        """Parse JSON from LLM response."""
        if "```json" in response:
            response = response.split("```json")[1].split("```")[0]
        elif "```" in response:
            response = response.split("```")[1].split("```")[0]
        return json.loads(response.strip())

    def _extract_code(self, response: str) -> str:
        """Extract code block from response."""
        if "```" in response:
            parts = response.split("```")
            if len(parts) >= 2:
                code = parts[1]
                if code.startswith(("python", "javascript", "typescript")):
                    code = code.split("\n", 1)[1] if "\n" in code else ""
                return code.strip()
        return response

    def _get_step_code(self, state: MigrationState, step: MigrationStep) -> str:
        """Get source code for a migration step."""
        code_parts = []
        for filename in step.input_files:
            if filename in state.source_files:
                code_parts.append(f"# {filename}\n{state.source_files[filename]}")
        return "\n\n".join(code_parts)

    def _get_context(self, state: MigrationState) -> str:
        """Get context from previous steps."""
        completed = [s for s in state.plan if s.status == "completed"]
        if not completed:
            return "No previous steps completed."
        return "\n".join([f"Step {s.id}: {s.description}" for s in completed[-3:]])

    def _transform_filename(self, filename: str, target: str) -> str:
        """Transform filename for target framework."""
        # Example: Express routes/users.js -> FastAPI routers/users.py
        if target == "fastapi":
            return filename.replace(".js", ".py").replace("routes/", "routers/")
        return filename

    def _check_syntax(self, code: str, framework: str) -> List[str]:
        """Basic syntax check."""
        issues = []
        # Add framework-specific checks
        return issues
```

### Step 4: Build the API (15 min)

```python
# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict
from agent import MigrationAgent
from state import MigrationState
from llm_client import get_llm_client

app = FastAPI(title="Migration Workflow Agent")

class MigrationRequest(BaseModel):
    source_framework: str
    target_framework: str
    files: Dict[str, str]  # filename -> content

class MigrationResponse(BaseModel):
    success: bool
    migrated_files: Dict[str, str]
    plan_executed: list
    verification: dict
    errors: list

@app.post("/migrate", response_model=MigrationResponse)
async def migrate(request: MigrationRequest):
    """Run migration workflow."""
    llm = get_llm_client("anthropic")
    agent = MigrationAgent(llm)

    state = MigrationState(
        source_framework=request.source_framework,
        target_framework=request.target_framework,
        source_files=request.files
    )

    result = agent.run(state)

    return MigrationResponse(
        success=len(result.errors) == 0,
        migrated_files=result.migrated_files,
        plan_executed=[
            {"id": s.id, "description": s.description, "status": s.status}
            for s in result.plan
        ],
        verification=result.verification_result or {},
        errors=result.errors
    )

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

### Step 5: Test with Sample Migration (15 min)

Test migrating Express.js to FastAPI:

```bash
# Sample Express.js code
cat > sample_express.js << 'EOF'
const express = require('express');
const router = express.Router();

router.get('/users', async (req, res) => {
    const users = await db.getUsers();
    res.json(users);
});

router.post('/users', async (req, res) => {
    const { name, email } = req.body;
    const user = await db.createUser({ name, email });
    res.status(201).json(user);
});

module.exports = router;
EOF

# Test migration
curl -X POST http://localhost:8000/migrate \
  -H "Content-Type: application/json" \
  -d '{
    "source_framework": "express",
    "target_framework": "fastapi",
    "files": {
      "routes/users.js": "const express = require('\''express'\'');\nconst router = express.Router();\n\nrouter.get('\''/users'\'', async (req, res) => {\n    const users = await db.getUsers();\n    res.json(users);\n});\n\nmodule.exports = router;"
    }
  }'
```

### Step 6: Deploy to Railway (10 min)

```bash
# Initialize Railway
railway init

# Deploy
railway up

# Set environment variables
railway variables set ANTHROPIC_API_KEY=xxx
```

---

## Deliverables

- [ ] Working migration agent with all 4 phases
- [ ] Proper state management
- [ ] Plan creation and execution
- [ ] Verification step
- [ ] Deployed to Railway

---

## Extension Challenges

1. **Rollback Support**: Add ability to rollback failed migrations
2. **Parallel Execution**: Execute independent steps in parallel
3. **Human Approval**: Add human-in-the-loop for plan approval
4. **Multiple Frameworks**: Support more source/target combinations

---

**Next**: [Lab 04 - RAG System](../lab04-rag-system/)
