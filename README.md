# Agentic AI Intensive Training Program

## 1-Week Full-Time Training for Senior Contractors

```
 _____ _____ _____ _____ _____ _____ _____    _____ _____
|  _  |   __|   __|   | |_   _|     |     |  |  _  |     |
|     |  |  |   __| | | | | | |-   -|   --|  |     |-   -|
|__|__|_____|_____|_|___| |_| |_____|_____|  |__|__|_____|

From Zero GenAI Experience to Production-Ready in 5 Days
```

---

## Program Overview

This intensive 40-hour training program transforms experienced software engineers into productive agentic AI practitioners. Designed for contractors who work with multiple clients, this program emphasizes:

- **LLM-Agnostic Skills**: Work with Claude, GPT-4, Gemini, or any model
- **Real-World Engineering**: Production patterns, not toy examples
- **Immediate Applicability**: Skills you can use on client projects tomorrow

### What You'll Build

| Day | Project | Deployment |
|-----|---------|------------|
| 1 | AI-Assisted Full-Stack App | Vercel |
| 2 | Code Analyzer Agent | Railway |
| 3 | Migration Workflow System | Railway |
| 4 | RAG System with Evaluation | Railway |
| 5 | Capstone Project (your choice) | Multiple options |

---

## Prerequisites

### Required Skills
- [ ] Proficient in at least one programming language (Python preferred, JavaScript/TypeScript also used)
- [ ] Experience building web applications and APIs
- [ ] Familiarity with Git, CLI tools, and cloud deployments
- [ ] Understanding of REST APIs and HTTP protocols
- [ ] Basic understanding of JSON and data structures

### Required Accounts (100% FREE Options Available!)

> **Note:** This training can be completed at **zero cost** using free tiers. See [FREE-TIER-STRATEGY.md](./FREE-TIER-STRATEGY.md) for complete details.

**LLM APIs (choose one - all free):**
- [ ] **Google AI Studio** (RECOMMENDED): https://aistudio.google.com/ - Most generous free tier
- [ ] **Groq**: https://console.groq.com/ - Fastest free inference
- [ ] **Ollama** (local): https://ollama.ai/ - 100% free, runs on your machine

**Deployment (free):**
- [ ] **GitHub**: https://github.com
- [ ] **Vercel** (frontend): https://vercel.com - Free tier
- [ ] **Render** (backend): https://render.com - Free tier

**Optional (paid, but NOT required):**
- [ ] OpenAI API: https://platform.openai.com/signup
- [ ] Anthropic API: https://console.anthropic.com/

### Required Software
```bash
# Check your versions
python --version    # 3.10+ required
node --version      # 18+ required
npm --version       # 9+ required
git --version       # Any recent version
```

---

## Choose Your Language

All labs are available in **Python** and **TypeScript**. Choose based on your preference:

| Aspect | Python | TypeScript |
|--------|--------|------------|
| Directory | `labs/labXX/python/` | `labs/labXX/typescript/` |
| Web Framework | FastAPI | Hono |
| Validation | Pydantic | Zod |
| Run Command | `uvicorn main:app` | `npm run dev` |
| Strengths | ML ecosystem, AI libraries | Type safety, frontend integration |

> **Recommendation**: If you're undecided, Python has more mature AI tooling. TypeScript is ideal if you're building full-stack web applications. See [docs/LANGUAGE-CHOICE-GUIDE.md](./docs/LANGUAGE-CHOICE-GUIDE.md) for detailed guidance.

---

## Quick Start

### 1. Clone and Navigate
```bash
cd /path/to/AI_Training
```

### 2. Setup Your Language

<details>
<summary><b>Python Setup</b></summary>

```bash
# Create Python virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

</details>

<details>
<summary><b>TypeScript Setup</b></summary>

```bash
# Install Node.js dependencies
npm install

# For individual labs
cd labs/lab02-code-analyzer-agent/typescript
npm install
```

</details>

### 3. Configure API Keys
```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your API keys
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# GOOGLE_API_KEY=...
```

### 4. Verify Setup

Run the universal setup verification script:

```bash
# Verify all environments (Python + TypeScript)
./scripts/verify-setup.sh

# Verify Python only
./scripts/verify-setup.sh python

# Verify TypeScript only
./scripts/verify-setup.sh typescript
```

The script checks versions, API keys, and installed packages for your chosen language.

---

## Program Structure

```
AI_Training/
├── README.md                 # You are here
├── SCHEDULE.md               # Detailed daily/hourly schedule
├── requirements.txt          # Python dependencies
├── package.json              # Node.js/TypeScript dependencies
├── tsconfig.base.json        # TypeScript base configuration
├── .env.example              # Environment template
│
├── DAY1-FOUNDATIONS.md       # GenAI Foundations & Vibe Coding
├── DAY2-PROMPTING.md         # Advanced Prompting Engineering
├── DAY3-AGENTS.md            # Agent Architectures
├── DAY4-RAG-EVAL.md          # RAG & Evaluation
├── DAY5-PRODUCTION-CAPSTONE.md # Production & Capstone
│
├── CHECKLISTS.md             # Daily progress tracking
├── CAPSTONE-RUBRIC.md        # Final project evaluation
│
├── docs/                     # Additional documentation
│   └── LANGUAGE-CHOICE-GUIDE.md  # Python vs TypeScript guidance
│
├── labs/                     # Hands-on lab exercises
│   ├── lab01-vibe-coding-intro/
│   │   ├── README.md         # Lab instructions
│   │   ├── python/           # Python implementation
│   │   └── typescript/       # TypeScript implementation
│   ├── lab02-code-analyzer-agent/
│   ├── lab03-migration-workflow/
│   ├── lab04-rag-system/
│   ├── lab05-multi-agent/
│   └── capstone-options/
│
├── templates/                # Reusable starter templates
│   ├── python-agent/         # Python agent template
│   ├── typescript-agent/     # TypeScript agent template
│   ├── typescript-api/
│   ├── rag-starter/
│   └── deployment/
│
└── solutions/                # Reference implementations
```

---

## Daily Schedule Overview

| Day | Theme | Hours | Key Outcome |
|-----|-------|-------|-------------|
| **Day 1** | GenAI Foundations & Vibe Coding | 8h | Understand LLMs, deploy first AI app |
| **Day 2** | Advanced Prompting | 8h | Master prompt engineering for code tasks |
| **Day 3** | Agent Architectures | 8h | Build and deploy agentic systems |
| **Day 4** | RAG & Evaluation | 8h | Implement RAG with proper evaluation |
| **Day 5** | Production & Capstone | 8h | Ship a complete AI-powered project |

---

## Tools Covered (LLM-Agnostic)

### AI Coding Assistants
| Tool | Type | Best For |
|------|------|----------|
| Claude Code | CLI | Terminal-based development |
| Cursor | IDE | Full IDE experience |
| Gemini CLI | CLI | Google ecosystem integration |
| GitHub Copilot | IDE Extension | Inline completions |
| Aider | CLI | Git-integrated coding |
| Continue | IDE Extension | Open-source alternative |

### LLM Providers
| Provider | Models | Strengths |
|----------|--------|-----------|
| Anthropic | Claude 3.5 Sonnet, Claude 3 Opus | Reasoning, safety, long context |
| OpenAI | GPT-4o, GPT-4 Turbo, o1 | Broad capabilities, function calling |
| Google | Gemini Pro, Gemini Ultra | Multimodal, speed |
| Local | Llama, Mistral, Mixtral | Privacy, cost control |

### Agentic Frameworks
| Framework | Language | Best For |
|-----------|----------|----------|
| LangChain | Python/JS | Rapid prototyping |
| LangGraph | Python | Complex agent workflows |
| CrewAI | Python | Multi-agent teams |
| AutoGen | Python | Conversational agents |
| Semantic Kernel | Python/C# | Enterprise integration |

---

## Capstone Project Options

Choose one for your final project on Day 5:

### Option A: AI Code Review Bot (Medium)
Build a GitHub-integrated code review agent.
- Analyzes pull requests automatically
- Provides structured feedback
- Deploys as a GitHub webhook

### Option B: Legacy Code Documenter (Medium-High)
Create an agent that generates documentation for legacy code.
- Analyzes code structure and patterns
- Generates README, API docs, architecture diagrams
- Works with any language

### Option C: Tech Debt Analyzer (High)
Build a RAG-enhanced system for technical debt analysis.
- Indexes codebase with semantic search
- Identifies and prioritizes tech debt
- Generates remediation reports

### Option D: Multi-Agent Research Assistant (High)
Create an orchestrated multi-agent system.
- Multiple specialized agents working together
- Research, analysis, and report generation
- Complex workflow orchestration

---

## Learning Outcomes

By the end of this program, you will be able to:

### Technical Skills
- [ ] Explain how LLMs work and their practical limitations
- [ ] Write effective prompts for code generation, analysis, and refactoring
- [ ] Build and deploy agentic systems with tool-use capabilities
- [ ] Implement RAG systems with proper evaluation
- [ ] Apply production patterns (rate limiting, caching, fallbacks)

### Professional Skills
- [ ] Evaluate when to use AI vs. traditional approaches
- [ ] Estimate and scope AI-augmented features for clients
- [ ] Debug and troubleshoot AI system failures
- [ ] Communicate AI capabilities and limitations to stakeholders

---

## Support and Resources

### During Training
- All labs include step-by-step instructions
- Reference solutions available in `/solutions`
- Exercises include expected outputs for verification

### External Resources
- [Anthropic Documentation](https://docs.anthropic.com/)
- [OpenAI Documentation](https://platform.openai.com/docs/)
- [LangChain Documentation](https://python.langchain.com/docs/)
- [Vercel AI SDK](https://sdk.vercel.ai/docs/)

---

## Quick Reference

### Common Commands

<details>
<summary><b>Python</b></summary>

```bash
# Activate environment
source .venv/bin/activate

# Run a lab
cd labs/lab02-code-analyzer-agent/python
uvicorn main:app --reload

# Run tests
pytest

# Deploy to Railway
railway up
```

</details>

<details>
<summary><b>TypeScript</b></summary>

```bash
# Run a lab
cd labs/lab02-code-analyzer-agent/typescript
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Deploy to Vercel
vercel --prod
```

</details>

### Cost Options

#### FREE Option (Recommended for Students)
| Activity | Cost |
|----------|------|
| All Labs & Capstone | **$0** |

*Using Google AI Studio, Groq, or Ollama + Render free tier. See [FREE-TIER-STRATEGY.md](./FREE-TIER-STRATEGY.md)*

#### Paid Option (If preferred)
| Activity | Estimated Cost |
|----------|----------------|
| Day 1 Labs | $2-5 |
| Day 2 Labs | $3-7 |
| Day 3 Labs | $5-10 |
| Day 4 Labs | $5-15 |
| Day 5 Capstone | $5-20 |
| **Total Week** | **$20-60** |

*Using OpenAI/Anthropic APIs. Costs vary based on model choice.*

---

## License and Usage

This training material is designed for educational purposes. You may:
- Use these materials for personal learning
- Adapt exercises for internal team training
- Reference patterns in client projects

---

**Ready to begin?** Start with [SCHEDULE.md](./SCHEDULE.md) for the detailed daily breakdown, then proceed to [DAY1-FOUNDATIONS.md](./DAY1-FOUNDATIONS.md).
