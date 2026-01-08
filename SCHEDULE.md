# Complete Weekly Schedule

## Training Timeline: 40 Hours Over 5 Days

---

## Schedule Legend

| Symbol | Meaning |
|--------|---------|
| **Theory** | Conceptual content, explanations |
| **Demo** | Live demonstrations |
| **Hands-on** | Guided exercises |
| **Lab** | Independent project work |
| **Exercise** | Short practice activities |

---

## Day 1: GenAI Foundations & AI-First Engineering

**Theme**: Understanding how LLMs work and adopting AI-first development practices

### Morning Session (09:00 - 12:30)

| Time | Duration | Topic | Type | Materials |
|------|----------|-------|------|-----------|
| 09:00-09:30 | 30 min | **Welcome & Program Overview** | Intro | [DAY1-FOUNDATIONS.md#welcome](./DAY1-FOUNDATIONS.md#welcome) |
| | | - Training objectives and outcomes | | |
| | | - Setting up development environment | | |
| | | - Verifying API keys and tools | | |
| 09:30-10:30 | 1 hr | **LLM Fundamentals** | Theory | [DAY1-FOUNDATIONS.md#llm-fundamentals](./DAY1-FOUNDATIONS.md#llm-fundamentals) |
| | | - Transformer architecture (simplified) | | |
| | | - Tokens, context windows, attention | | |
| | | - Temperature, top-p, and sampling | | |
| | | - Model comparison: Claude vs GPT vs Gemini | | |
| 10:30-10:45 | 15 min | **Break** | - | - |
| 10:45-11:45 | 1 hr | **Model Behavior & Constraints** | Theory | [DAY1-FOUNDATIONS.md#model-behavior](./DAY1-FOUNDATIONS.md#model-behavior) |
| | | - How models "reason" (and don't) | | |
| | | - Hallucinations: causes and mitigation | | |
| | | - Context limitations and strategies | | |
| | | - Safety boundaries and refusals | | |
| 11:45-12:30 | 45 min | **Exercise: Model Comparison** | Hands-on | [DAY1-FOUNDATIONS.md#exercise-1](./DAY1-FOUNDATIONS.md#exercise-1) |
| | | - Test same prompt across 3 providers | | |
| | | - Document behavior differences | | |
| | | - Identify strengths/weaknesses | | |
| 12:30-13:30 | 1 hr | **Lunch Break** | - | - |

### Afternoon Session (13:30 - 17:00)

| Time | Duration | Topic | Type | Materials |
|------|----------|-------|------|-----------|
| 13:30-14:30 | 1 hr | **Vibe Coding & AI-First Development** | Theory | [DAY1-FOUNDATIONS.md#vibe-coding](./DAY1-FOUNDATIONS.md#vibe-coding) |
| | | - What is "Vibe Coding"? | | |
| | | - AI-first development methodology | | |
| | | - When to use AI vs. traditional coding | | |
| | | - Effective human-AI collaboration patterns | | |
| 14:30-15:30 | 1 hr | **Tool Landscape Deep Dive** | Demo | [DAY1-FOUNDATIONS.md#tool-landscape](./DAY1-FOUNDATIONS.md#tool-landscape) |
| | | - Claude Code walkthrough | | |
| | | - Cursor IDE demonstration | | |
| | | - Gemini CLI features | | |
| | | - Comparison matrix and selection guide | | |
| 15:30-15:45 | 15 min | **Break** | - | - |
| 15:45-17:00 | 1h 15m | **Lab 01: Build First AI-Assisted App** | Lab | [labs/lab01-vibe-coding-intro/](./labs/lab01-vibe-coding-intro/) |
| | | - Build a URL shortener with AI assistance | | |
| | | - Python backend + TypeScript frontend | | |
| | | - Deploy to Vercel | | |

### Day 1 Deliverables
- [ ] Completed model comparison report
- [ ] Tool selection matrix filled out
- [ ] Deployed URL shortener application
- [ ] Environment fully configured

---

## Day 2: Advanced Prompting for Engineering

**Theme**: Master prompt engineering specifically for software development tasks

### Morning Session (09:00 - 12:30)

| Time | Duration | Topic | Type | Materials |
|------|----------|-------|------|-----------|
| 09:00-09:45 | 45 min | **Prompt Engineering Fundamentals** | Theory | [DAY2-PROMPTING.md#fundamentals](./DAY2-PROMPTING.md#fundamentals) |
| | | - Anatomy of an effective prompt | | |
| | | - Role, context, task, format pattern | | |
| | | - Clear vs. ambiguous instructions | | |
| 09:45-10:45 | 1 hr | **Advanced Prompting Patterns** | Theory+Demo | [DAY2-PROMPTING.md#advanced-patterns](./DAY2-PROMPTING.md#advanced-patterns) |
| | | - Chain-of-Thought (CoT) prompting | | |
| | | - Few-shot learning with examples | | |
| | | - Self-consistency and verification | | |
| | | - Tree-of-thought for complex problems | | |
| 10:45-11:00 | 15 min | **Break** | - | - |
| 11:00-12:00 | 1 hr | **System Prompts & Personas** | Theory+Practice | [DAY2-PROMPTING.md#system-prompts](./DAY2-PROMPTING.md#system-prompts) |
| | | - Crafting effective system prompts | | |
| | | - Persona engineering for different tasks | | |
| | | - Context injection strategies | | |
| | | - Hands-on: Build a code review persona | | |
| 12:00-12:30 | 30 min | **Exercise: Prompt Optimization** | Hands-on | [DAY2-PROMPTING.md#exercise-1](./DAY2-PROMPTING.md#exercise-1) |
| | | - Take a weak prompt, make it strong | | |
| | | - A/B test prompt variations | | |
| | | - Document improvement patterns | | |
| 12:30-13:30 | 1 hr | **Lunch Break** | - | - |

### Afternoon Session (13:30 - 17:00)

| Time | Duration | Topic | Type | Materials |
|------|----------|-------|------|-----------|
| 13:30-14:30 | 1 hr | **Code-Focused Prompting** | Theory | [DAY2-PROMPTING.md#code-prompting](./DAY2-PROMPTING.md#code-prompting) |
| | | - Prompts for code analysis | | |
| | | - Prompts for code generation | | |
| | | - Prompts for code review | | |
| | | - Prompts for debugging | | |
| 14:30-15:30 | 1 hr | **Multimodal Prompting** ⭐ NEW | Theory+Demo | [DAY2-PROMPTING.md#multimodal-prompting](./DAY2-PROMPTING.md#multimodal-prompting) |
| | | - Working with images (screenshots, diagrams) | | |
| | | - Processing PDFs and documents | | |
| | | - Code extraction from images | | |
| | | - Real-world multimodal use cases | | |
| 15:30-15:45 | 15 min | **Break** | - | - |
| 15:45-16:30 | 45 min | **Migration & Refactoring Prompts** | Theory+Demo | [DAY2-PROMPTING.md#migration-prompts](./DAY2-PROMPTING.md#migration-prompts) |
| | | - Large-scale code transformation | | |
| | | - Framework migration strategies | | |
| | | - Technical debt identification | | |
| 16:30-17:00 | 30 min | **Lab 02: Build Code Analyzer Agent** | Lab | [labs/lab02-code-analyzer-agent/](./labs/lab02-code-analyzer-agent/) |
| | | - Build agent with custom prompts | | |
| | | - Deploy to Railway | | |
| | | **Continue after hours if needed** | | |

### Day 2 Deliverables
- [ ] Personal prompt library (10+ prompts)
- [ ] System prompt templates (3+)
- [ ] Deployed code analyzer agent
- [ ] Prompt optimization documentation

---

## Day 3: Agent Architectures

**Theme**: Understanding and building agentic AI systems

### Morning Session (09:00 - 12:30)

| Time | Duration | Topic | Type | Materials |
|------|----------|-------|------|-----------|
| 09:00-10:00 | 1 hr | **Agent Fundamentals** | Theory | [DAY3-AGENTS.md#fundamentals](./DAY3-AGENTS.md#fundamentals) |
| | | - What makes an "agent"? | | |
| | | - The agent loop: Observe → Think → Act | | |
| | | - Memory types overview | | |
| | | - State management patterns | | |
| 10:00-10:30 | 30 min | **Context Management Strategies** ⭐ NEW | Theory+Code | [DAY3-AGENTS.md#context-management](./DAY3-AGENTS.md#context-management) |
| | | - Sliding window, summarization, selective retention | | |
| | | - When to use each strategy | | |
| | | - Implementation examples | | |
| 10:30-11:00 | 30 min | **Memory Systems Implementation** ⭐ NEW | Theory+Code | [DAY3-AGENTS.md#memory-systems](./DAY3-AGENTS.md#memory-systems) |
| | | - Long-term memory with Vector DB | | |
| | | - Episodic memory (task history) | | |
| | | - Integrating multiple memory types | | |
| 11:00-11:15 | 15 min | **Break** | - | - |
| 11:15-12:00 | 45 min | **Tool-Use & Function Calling** | Theory+Demo | [DAY3-AGENTS.md#tool-use](./DAY3-AGENTS.md#tool-use) |
| | | - Function calling across providers | | |
| | | - Tool definition best practices | | |
| | | - Error handling and retries | | |
| 12:00-12:30 | 30 min | **Structured Output & Schema Validation** ⭐ NEW | Theory+Code | [DAY3-AGENTS.md#structured-output](./DAY3-AGENTS.md#structured-output) |
| | | - Pydantic/Zod schema enforcement | | |
| | | - Smart retry with validation feedback | | |
| | | - Production reliability patterns | | |
| 12:30-13:30 | 1 hr | **Lunch Break** | - | - |

### Afternoon Session (13:30 - 17:00)

| Time | Duration | Topic | Type | Materials |
|------|----------|-------|------|-----------|
| 13:30-14:00 | 30 min | **Agent Patterns** | Theory | [DAY3-AGENTS.md#patterns](./DAY3-AGENTS.md#patterns) |
| | | - ReAct: Reasoning + Acting | | |
| | | - Planning and verification patterns | | |
| | | - When to use which pattern | | |
| 14:00-14:15 | 15 min | **Exercise: Design an Agent** | Hands-on | [DAY3-AGENTS.md#exercise-1](./DAY3-AGENTS.md#exercise-1) |
| | | - Whiteboard agent architecture | | |
| | | - Define tools and capabilities | | |
| 14:15-15:00 | 45 min | **Multi-Agent Systems** | Theory | [DAY3-AGENTS.md#multi-agent](./DAY3-AGENTS.md#multi-agent) |
| | | - When single agents aren't enough | | |
| | | - Communication & orchestration patterns | | |
| | | - Avoiding infinite loops | | |
| 15:00-15:30 | 30 min | **Framework Comparison** | Comparison | [DAY3-AGENTS.md#frameworks](./DAY3-AGENTS.md#frameworks) |
| | | - LangChain/LangGraph, CrewAI, AutoGen | | |
| | | - Choosing the right framework | | |
| 15:30-15:45 | 15 min | **Break** | - | - |
| 15:45-17:00 | 1h 15m | **Lab 03: Migration Workflow Agent** | Lab | [labs/lab03-migration-workflow/](./labs/lab03-migration-workflow/) |
| | | - Build multi-step migration agent | | |
| | | - Implement planning and execution | | |
| | | - Deploy to Railway | | |
| | | **Continue after hours if needed** | | |

### Day 3 Deliverables
- [ ] Agent architecture diagrams
- [ ] Framework decision matrix
- [ ] Deployed migration workflow agent
- [ ] Agent pattern reference sheet

---

## Day 4: RAG & Evaluation

**Theme**: Building retrieval-augmented systems with proper evaluation

### Morning Session (09:00 - 12:30)

| Time | Duration | Topic | Type | Materials |
|------|----------|-------|------|-----------|
| 09:00-10:00 | 1 hr | **RAG Fundamentals** | Theory | [DAY4-RAG-EVAL.md#rag-fundamentals](./DAY4-RAG-EVAL.md#rag-fundamentals) |
| | | - Why RAG? Use cases and limitations | | |
| | | - Embeddings: how they work | | |
| | | - Vector databases overview | | |
| | | - The RAG pipeline end-to-end | | |
| 10:00-11:00 | 1 hr | **Chunking & Document Processing** | Theory+Demo | [DAY4-RAG-EVAL.md#chunking](./DAY4-RAG-EVAL.md#chunking) |
| | | - Chunking strategies comparison | | |
| | | - Semantic vs. fixed-size chunking | | |
| | | - Handling code vs. documentation | | |
| | | - Metadata and filtering | | |
| 11:00-11:15 | 15 min | **Break** | - | - |
| 11:15-12:00 | 45 min | **RAG Pitfalls & Advanced Patterns** | Theory | [DAY4-RAG-EVAL.md#pitfalls](./DAY4-RAG-EVAL.md#pitfalls) |
| | | - Common failure modes | | |
| | | - Hybrid search (vector + keyword) | | |
| | | - Reranking strategies | | |
| | | - Query transformation | | |
| 12:00-12:30 | 30 min | **Exercise: RAG Architecture Design** | Hands-on | [DAY4-RAG-EVAL.md#exercise-1](./DAY4-RAG-EVAL.md#exercise-1) |
| | | - Design RAG for a codebase | | |
| | | - Choose chunking strategy | | |
| | | - Plan retrieval approach | | |
| 12:30-13:30 | 1 hr | **Lunch Break** | - | - |

### Afternoon Session (13:30 - 17:00)

| Time | Duration | Topic | Type | Materials |
|------|----------|-------|------|-----------|
| 13:30-14:15 | 45 min | **Evaluation Fundamentals** | Theory | [DAY4-RAG-EVAL.md#evaluation](./DAY4-RAG-EVAL.md#evaluation) |
| | | - Why evaluation matters | | |
| | | - Metrics: precision, recall, MRR, etc. | | |
| | | - LLM-as-judge approaches | | |
| | | - Building evaluation datasets | | |
| 14:15-15:00 | 45 min | **Debugging & Observability** | Theory+Demo | [DAY4-RAG-EVAL.md#observability](./DAY4-RAG-EVAL.md#observability) |
| | | - Tracing and logging for AI systems | | |
| | | - Common debugging patterns | | |
| | | - Tools: LangSmith, Weights & Biases | | |
| | | - Cost monitoring and optimization | | |
| 15:00-15:15 | 15 min | **Break** | - | - |
| 15:15-17:00 | 1h 45m | **Lab 04: Build & Evaluate RAG System** | Lab | [labs/lab04-rag-system/](./labs/lab04-rag-system/) |
| | | - Index a codebase with embeddings | | |
| | | - Build retrieval pipeline | | |
| | | - Implement evaluation suite | | |
| | | - Deploy to Railway | | |

### Day 4 Deliverables
- [ ] RAG architecture documentation
- [ ] Chunking strategy comparison
- [ ] Deployed RAG system with evaluation
- [ ] Evaluation metrics dashboard

---

## Day 5: Production & Capstone

**Theme**: Production patterns and building your capstone project

### Morning Session (09:00 - 12:30)

| Time | Duration | Topic | Type | Materials |
|------|----------|-------|------|-----------|
| 09:00-09:45 | 45 min | **Production Patterns** | Theory | [DAY5-PRODUCTION-CAPSTONE.md#production](./DAY5-PRODUCTION-CAPSTONE.md#production) |
| | | - Rate limiting and throttling | | |
| | | - Caching strategies for LLM calls | | |
| | | - Fallback and retry patterns | | |
| | | - Graceful degradation | | |
| 09:45-10:15 | 30 min | **Security & Cost Management** | Theory | [DAY5-PRODUCTION-CAPSTONE.md#security](./DAY5-PRODUCTION-CAPSTONE.md#security) |
| | | - Prompt injection attacks | | |
| | | - Output validation | | |
| | | - API key management | | |
| 10:15-10:45 | 30 min | **Advanced Cost Optimization** ⭐ NEW | Theory | [DAY5-PRODUCTION-CAPSTONE.md#advanced-cost-optimization](./DAY5-PRODUCTION-CAPSTONE.md#advanced-cost-optimization) |
| | | - Semantic caching (60-80% savings) | | |
| | | - Model routing strategies | | |
| | | - Prompt compression techniques | | |
| | | - Batch processing optimization | | |
| 10:45-11:00 | 15 min | **Break** | - | - |
| 11:00-11:45 | 45 min | **Integration Patterns** ⭐ NEW | Theory + Demo | [DAY5-PRODUCTION-CAPSTONE.md#integration-patterns](./DAY5-PRODUCTION-CAPSTONE.md#integration-patterns) |
| | | - Webhook integration (GitHub, Slack) | | |
| | | - Message queues with Celery/Redis | | |
| | | - Event-driven architecture | | |
| | | - Microservices patterns | | |
| 11:45-12:30 | 45 min | **Deployment & Capstone Briefing** | Demo + Intro | [DAY5-PRODUCTION-CAPSTONE.md#deployment](./DAY5-PRODUCTION-CAPSTONE.md#deployment) |
| | | - Vercel: serverless AI apps | | |
| | | - Railway: backend services | | |
| | | - Review 4 capstone options | | |
| | | - Select your project | | |
| 12:30-13:30 | 1 hr | **Lunch Break** | - | - |

### Afternoon Session (13:30 - 17:00)

| Time | Duration | Topic | Type | Materials |
|------|----------|-------|------|-----------|
| 13:30-16:00 | 2h 30m | **Capstone Project Development** | Project | [labs/capstone-options/](./labs/capstone-options/) |
| | | - Build your selected project | | |
| | | - Implement core features | | |
| | | - Deploy to production | | |
| | | - Prepare demo | | |
| 16:00-16:15 | 15 min | **Break** | - | - |
| 16:15-17:00 | 45 min | **Presentations & Peer Review** | Presentation | - |
| | | - 5-minute demos | | |
| | | - Peer feedback | | |
| | | - Program wrap-up | | |

### Day 5 Deliverables
- [ ] Production patterns checklist completed
- [ ] Security audit checklist completed
- [ ] **Advanced cost optimization strategies implemented** ⭐ NEW
- [ ] **Integration pattern selected and applied** ⭐ NEW
- [ ] **Capstone project deployed and demoed**

---

## Time Allocation Summary

### By Activity Type
| Type | Total Hours | Percentage |
|------|-------------|------------|
| Theory | 16.5 | 41% |
| Demos | 4.5 | 11% |
| Exercises | 2.5 | 6% |
| Labs | 8.5 | 21% |
| Capstone | 3.0 | 8% |
| Breaks/Lunch | 8.0 | 20% |

**Note:** +3 hours theory added (Multimodal, Context/Memory/Structured Output, Testing, Cost Opt, Integration)

### By Topic Area
| Topic | Hours |
|-------|-------|
| GenAI Foundations | 4.5 |
| Vibe Coding & Tools | 3.0 |
| Prompting | 6.0 | ⭐ +1.0 (Multimodal)
| Agents | 7.0 | ⭐ +1.5 (Context/Memory/Structured)
| RAG | 4.0 |
| Evaluation | 3.25 | ⭐ +0.75 (Testing)
| Production | 4.25 | ⭐ +1.25 (Cost Opt/Integration)
| Capstone | 4.0 |

---

## Optional Pre-Work

For participants who want to prepare:

1. **Read**: "Attention Is All You Need" paper summary (30 min)
2. **Watch**: 3Blue1Brown's "Neural Networks" series (2 hrs)
3. **Practice**: Complete 5 coding tasks with any AI assistant (1 hr)
4. **Setup**: Ensure all prerequisites are installed and accounts created

---

## Post-Training Resources

After completing the program:

1. **Join**: Community Discord/Slack for ongoing support
2. **Practice**: Weekly challenge problems
3. **Build**: Apply skills to a real client project within 2 weeks
4. **Review**: Revisit material after 30 days to reinforce learning

---

**Navigation**: [← README](./README.md) | [Day 1 →](./DAY1-FOUNDATIONS.md)
