# Capstone Project Evaluation Rubric

## Overview

The capstone project is worth **100 points** total, distributed across five categories:

| Category | Points | Weight |
|----------|--------|--------|
| Core Functionality | 40 | 40% |
| Architecture & Code Quality | 20 | 20% |
| Production Readiness | 20 | 20% |
| Documentation | 10 | 10% |
| Presentation | 10 | 10% |

**Passing Score**: 70 points (70%)
**Excellent Score**: 90+ points (90%)

---

## Detailed Rubric

### 1. Core Functionality (40 points)

#### Primary Features (25 points)

| Score | Criteria |
|-------|----------|
| 25 | All required features fully implemented and working correctly |
| 20-24 | Most features working, minor issues that don't affect core usage |
| 15-19 | Core features work but significant features missing or buggy |
| 10-14 | Some features work but major functionality issues |
| 0-9 | Features largely non-functional |

**Required Features by Project:**

**Option A: Code Review Bot**
- [ ] Accepts code input (via API or webhook)
- [ ] Performs structured analysis
- [ ] Returns categorized feedback (issues, suggestions)
- [ ] Handles multiple file types

**Option B: Legacy Code Documenter**
- [ ] Parses and analyzes code files
- [ ] Generates README documentation
- [ ] Creates function/class documentation
- [ ] Produces architecture overview

**Option C: Tech Debt Analyzer**
- [ ] Indexes codebase into vector store
- [ ] Semantic search working
- [ ] Identifies tech debt patterns
- [ ] Generates prioritized report

**Option D: Multi-Agent Research Assistant**
- [ ] Multiple specialized agents implemented
- [ ] Agent coordination working
- [ ] Task decomposition functioning
- [ ] Results synthesis working

#### Error Handling (10 points)

| Score | Criteria |
|-------|----------|
| 10 | Comprehensive error handling, graceful failures, informative messages |
| 7-9 | Good error handling for common cases, some edge cases missed |
| 4-6 | Basic error handling, some crashes or unclear errors |
| 1-3 | Minimal error handling, frequent crashes |
| 0 | No error handling |

#### Input Validation (5 points)

| Score | Criteria |
|-------|----------|
| 5 | All inputs validated, injection risks addressed, limits enforced |
| 3-4 | Most inputs validated, minor gaps |
| 1-2 | Basic validation only |
| 0 | No input validation |

---

### 2. Architecture & Code Quality (20 points)

#### Code Organization (8 points)

| Score | Criteria |
|-------|----------|
| 8 | Clear module structure, separation of concerns, consistent patterns |
| 6-7 | Good organization, minor inconsistencies |
| 4-5 | Reasonable structure but some mixing of concerns |
| 2-3 | Poorly organized, hard to navigate |
| 0-1 | No clear organization |

**Expected Structure:**
```
project/
├── src/
│   ├── agents/           # Agent implementations
│   ├── tools/            # Tool definitions
│   ├── api/              # API routes
│   ├── utils/            # Shared utilities
│   └── config/           # Configuration
├── tests/                # Test files
├── docs/                 # Documentation
└── deployment/           # Deploy configs
```

#### LLM Integration (6 points)

| Score | Criteria |
|-------|----------|
| 6 | Clean abstraction, LLM-agnostic design, proper prompt management |
| 4-5 | Good integration, minor coupling issues |
| 2-3 | Working but tightly coupled to specific provider |
| 0-1 | Poor integration, hardcoded prompts scattered |

#### Code Quality (6 points)

| Score | Criteria |
|-------|----------|
| 6 | Clean code, proper typing, consistent style, no duplication |
| 4-5 | Good quality, minor issues |
| 2-3 | Functional but quality issues (long functions, poor naming) |
| 0-1 | Poor quality, hard to read/maintain |

---

### 3. Production Readiness (20 points)

#### Deployment (8 points)

| Score | Criteria |
|-------|----------|
| 8 | Successfully deployed, accessible, stable |
| 6-7 | Deployed with minor issues |
| 4-5 | Deployed but unstable or difficult to access |
| 2-3 | Partially deployed or local only |
| 0-1 | Not deployed |

#### Monitoring & Logging (6 points)

| Score | Criteria |
|-------|----------|
| 6 | Structured logging, request tracing, basic monitoring |
| 4-5 | Good logging, some monitoring |
| 2-3 | Basic logging only |
| 0-1 | No logging |

#### Configuration (6 points)

| Score | Criteria |
|-------|----------|
| 6 | Environment-based config, no hardcoded secrets, .env documented |
| 4-5 | Good config management, minor issues |
| 2-3 | Basic config, some hardcoding |
| 0-1 | Hardcoded values, secrets in code |

---

### 4. Documentation (10 points)

#### README (5 points)

| Score | Criteria |
|-------|----------|
| 5 | Clear setup instructions, feature overview, usage examples |
| 3-4 | Good README, missing some sections |
| 1-2 | Basic README, minimal information |
| 0 | No README |

**README Should Include:**
- [ ] Project description
- [ ] Setup instructions
- [ ] Environment variables list
- [ ] Usage examples
- [ ] API documentation (if applicable)

#### Code Documentation (3 points)

| Score | Criteria |
|-------|----------|
| 3 | Docstrings on public functions, inline comments where needed |
| 2 | Some documentation, inconsistent |
| 1 | Minimal documentation |
| 0 | No documentation |

#### Architecture Overview (2 points)

| Score | Criteria |
|-------|----------|
| 2 | Clear diagram or description of system architecture |
| 1 | Basic architecture notes |
| 0 | No architecture documentation |

---

### 5. Presentation (10 points)

#### Demo Quality (5 points)

| Score | Criteria |
|-------|----------|
| 5 | Smooth demo, all features shown, handles questions well |
| 3-4 | Good demo, minor hiccups |
| 1-2 | Demo works but issues or incomplete |
| 0 | Demo fails or not presented |

#### Technical Explanation (3 points)

| Score | Criteria |
|-------|----------|
| 3 | Clear explanation of architecture, decisions, and trade-offs |
| 2 | Good explanation, some gaps |
| 1 | Basic explanation |
| 0 | Unable to explain technical decisions |

#### Time Management (2 points)

| Score | Criteria |
|-------|----------|
| 2 | Within 5-minute limit, well-paced |
| 1 | Slightly over/under, pacing issues |
| 0 | Significantly over time or incomplete |

---

## Project-Specific Requirements

### Option A: AI Code Review Bot

**Minimum Requirements:**
- Accept code via API endpoint
- Analyze code for issues (bugs, style, security)
- Return structured JSON response
- Support at least 2 programming languages

**Bonus Points (up to 5 extra):**
- GitHub webhook integration (+2)
- Inline comment suggestions (+1)
- Severity scoring (+1)
- Custom rule configuration (+1)

### Option B: Legacy Code Documenter

**Minimum Requirements:**
- Parse code files from directory
- Generate function-level documentation
- Create README with project overview
- CLI interface

**Bonus Points (up to 5 extra):**
- Architecture diagram generation (+2)
- Dependency analysis (+1)
- Multiple output formats (+1)
- Web UI (+1)

### Option C: Tech Debt Analyzer

**Minimum Requirements:**
- Index codebase into vector store
- Semantic code search
- Tech debt pattern detection
- Report generation

**Bonus Points (up to 5 extra):**
- Priority scoring algorithm (+2)
- Remediation suggestions (+1)
- Trend tracking over time (+1)
- CI/CD integration (+1)

### Option D: Multi-Agent Research Assistant

**Minimum Requirements:**
- At least 3 specialized agents
- Supervisor/orchestrator
- Task decomposition
- Result synthesis

**Bonus Points (up to 5 extra):**
- Human-in-the-loop option (+2)
- Memory persistence (+1)
- Parallel execution (+1)
- Citation tracking (+1)

---

## Submission Requirements

### Code Submission
- [ ] GitHub repository link
- [ ] Clean commit history
- [ ] No sensitive data in repo

### Deployment
- [ ] Live URL provided
- [ ] Application accessible
- [ ] Test credentials if needed

### Documentation
- [ ] README complete
- [ ] Environment variables documented
- [ ] API documented (if applicable)

---

## Grading Workflow

### Peer Review (During Presentations)
Each participant reviews 2 other projects using this simplified rubric:

```markdown
## Peer Review Form

Project: ________________
Reviewer: ________________

### Quick Ratings (1-5)
- Does the project work? [ ]
- Is the code organized? [ ]
- Is it properly deployed? [ ]
- Is it well documented? [ ]
- Was the demo clear? [ ]

### Comments
What worked well:


What could be improved:


Overall impression:
```

### Instructor Evaluation
Full rubric applied with detailed scoring per category.

---

## Score Interpretation

| Score | Grade | Description |
|-------|-------|-------------|
| 95-100 | A+ | Exceptional - Production ready, innovative |
| 90-94 | A | Excellent - High quality, well executed |
| 85-89 | A- | Very Good - Minor improvements possible |
| 80-84 | B+ | Good - Solid implementation, some gaps |
| 75-79 | B | Satisfactory - Meets requirements |
| 70-74 | B- | Passing - Basic requirements met |
| 65-69 | C+ | Below expectations - Significant gaps |
| 60-64 | C | Needs improvement - Core issues |
| <60 | F | Not passing - Major functionality missing |

---

## Sample Scoring

### Example: Good Project (Score: 85/100)

| Category | Max | Score | Notes |
|----------|-----|-------|-------|
| Core Functionality | 40 | 35 | Features work, minor edge cases |
| Architecture | 20 | 17 | Clean structure, good LLM integration |
| Production Ready | 20 | 16 | Deployed, basic logging |
| Documentation | 10 | 9 | Good README, some code docs |
| Presentation | 10 | 8 | Good demo, clear explanation |

### Example: Excellent Project (Score: 95/100)

| Category | Max | Score | Notes |
|----------|-----|-------|-------|
| Core Functionality | 40 | 40 | All features, comprehensive error handling |
| Architecture | 20 | 19 | Excellent design, fully LLM-agnostic |
| Production Ready | 20 | 18 | Full monitoring, proper config |
| Documentation | 10 | 10 | Complete docs, architecture diagram |
| Presentation | 10 | 8 | Excellent demo |

---

## FAQ

**Q: Can I use a framework like LangChain?**
A: Yes, but you must demonstrate understanding of the underlying patterns, not just framework usage.

**Q: What if my deployment fails during the demo?**
A: Have a backup (local demo, screenshots, video). Minor technical issues won't tank your score if you handle them gracefully.

**Q: Can I continue working after the deadline?**
A: The evaluation is based on what's submitted by the demo time. You can continue improving afterward for your portfolio.

**Q: What if I can't finish all features?**
A: Focus on core functionality working well rather than many half-finished features. Quality over quantity.

**Q: How important is the presentation vs. the code?**
A: Code quality is 80% of the score. A great demo can't save poor implementation, but a poor demo won't ruin excellent work.
