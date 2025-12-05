---
marp: true
theme: default
paginate: true
header: 'Agentic AI Training'
footer: 'Day 4 - RAG & Evaluation'
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
# Day 4: RAG & Evaluation

## Agentic AI Training Program

**Grounding AI in your data and measuring what matters**

---

# Learning Objectives

By the end of Day 4, you will be able to:

- Explain how RAG systems work and when to use them
- Implement effective chunking and embedding strategies
- Identify and avoid common RAG pitfalls
- Build evaluation frameworks for AI systems
- Debug and observe AI system behavior

---

# What is RAG?

**Retrieval-Augmented Generation**

Combines information retrieval with LLM generation to ground responses in specific data.

**The problem RAG solves:**
- LLMs have knowledge cutoff dates
- Can't access private/proprietary data
- Hallucinate when uncertain
- Can't cite sources

---

# RAG Pipeline Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      RAG PIPELINE                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  INDEXING PHASE (Offline)                                   │
│  ─────────────────────────                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌─────────┐   │
│  │Documents │──▶│  Chunk   │──▶│  Embed   │──▶│  Store  │   │
│  │          │   │          │   │          │   │(Vector) │   │
│  └──────────┘   └──────────┘   └──────────┘   └─────────┘   │
│                                                             │
│  QUERY PHASE (Online)                                       │
│  ────────────────────                                       │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────┐    │
│  │  Query   │──▶│  Embed   │──▶│ Retrieve │──▶│  LLM   │    │
│  │          │   │  Query   │   │ Similar  │   │Generate│    │
│  └──────────┘   └──────────┘   └──────────┘   └────────┘    │
│                                     │                       │
│                                     ▼                       │
│                              Top-K Documents                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# Why RAG vs Fine-tuning?

| Consideration | RAG | Fine-tuning |
|---------------|-----|-------------|
| **Update frequency** | Easy - update index | Hard - retrain model |
| **Cost** | Low - embed once | High - full retraining |
| **Traceability** | Can cite sources | No source attribution |
| **Domain knowledge** | Add via documents | Baked into weights |
| **Control** | Easy to update/remove | Hard to "unlearn" |

**Use RAG when** data changes frequently or you need citations.
**Use fine-tuning when** you need behavior/style changes.

---

# When to Use RAG

**Use RAG when:**
✅ Need access to private/proprietary data
✅ Data changes frequently
✅ Need to cite sources
✅ Domain-specific knowledge required
✅ Want to reduce hallucinations with factual grounding

**Don't use RAG when:**
❌ General knowledge questions (use base LLM)
❌ Data fits entirely in context window
❌ Real-time data needed (use function calling)
❌ Simple classification tasks

---

# Understanding Embeddings

Embeddings convert text to **dense vectors** that capture semantic meaning.

```python
# Similar sentences have similar embeddings
sentences = [
    "How do I reset my password?",
    "I forgot my password and need to change it",
    "What are your business hours?",
]

# After embedding, cosine similarities:
# "reset password" ↔ "forgot password": ~0.92 (very similar)
# "reset password" ↔ "business hours":  ~0.23 (not similar)
```

**Key insight**: Semantic similarity, not just keyword matching!

---

# Embedding Models Comparison

| Model | Dimensions | Speed | Quality | Cost |
|-------|------------|-------|---------|------|
| text-embedding-3-small | 1536 | Fast | Good | $0.02/1M |
| text-embedding-3-large | 3072 | Medium | Excellent | $0.13/1M |
| Voyage-3 | 1024 | Fast | Excellent | $0.06/1M |
| Cohere embed-v3 | 1024 | Fast | Excellent | $0.10/1M |
| BGE-large (local) | 1024 | Varies | Good | Free |

---

# Vector Databases

```
┌──────────────────────────────────────────────────────────────┐
│                 VECTOR DATABASE OPTIONS                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  LIGHTWEIGHT (Getting Started)                               │
│  • ChromaDB - Simple, local, great for prototyping           │
│  • LanceDB - Local, integrated with pandas/arrow             │
│  • SQLite + pgvector - Minimal infrastructure                │
│                                                              │
│  PRODUCTION SCALE                                            │
│  • Pinecone - Managed, fast, scales well                     │
│  • Weaviate - Open source, feature-rich                      │
│  • Qdrant - Open source, fast, Rust-based                    │
│  • Milvus - Open source, very scalable                       │
│                                                              │
│  EXISTING INFRASTRUCTURE                                     │
│  • PostgreSQL + pgvector - If you use Postgres               │
│  • Elasticsearch - If you use ES                             │
│  • Redis - If you use Redis                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

<!-- _class: lead -->
# Chunking Strategies

---

# Why Chunking Matters

```
┌─────────────────────────────────────────────────────────────┐
│                     CHUNKING IMPACT                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TOO SMALL              JUST RIGHT              TOO LARGE   │
│  ──────────             ──────────              ─────────   │
│  ┌─────┐                ┌──────────┐            [Entire     │
│  │ The │                │ Product  │             document   │
│  └─────┘                │ supports │             with       │
│  ┌────────┐             │ Slack,   │             everything]│
│  │product │             │ GitHub,  │                        │
│  └────────┘             │ Jira     │            Problems:   │
│  ...                    └──────────┘            • Diluted   │
│                                                 • Expensive │
│  Problems:                                      • Too much  │
│  • Loses context                                            │
│  • Fragments meaning                                        │
│  • Many irrelevant matches                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# Chunking Strategy 1: Fixed Size

**Simple but effective**

```python
def fixed_size_chunks(
    text: str,
    chunk_size: int = 500,
    overlap: int = 50
) -> List[str]:
    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size

        # Find sentence boundary
        if end < len(text):
            for sep in ['. ', '.\n', '\n\n']:
                last_sep = text[start:end].rfind(sep)
                if last_sep > chunk_size * 0.5:
                    end = start + last_sep + len(sep)
                    break

        chunks.append(text[start:end].strip())
        start = end - overlap

    return chunks
```

---

# Chunking Strategy 2: Semantic

**Group semantically similar sentences**

```python
def semantic_chunks(
    text: str,
    embedding_func,
    similarity_threshold: float = 0.8
) -> List[str]:
    sentences = split_into_sentences(text)
    embeddings = [embedding_func(s) for s in sentences]

    chunks = []
    current_chunk = [sentences[0]]

    for i in range(1, len(sentences)):
        similarity = cosine_similarity(
            embeddings[i-1],
            embeddings[i]
        )

        if similarity > similarity_threshold:
            current_chunk.append(sentences[i])
        else:
            chunks.append(' '.join(current_chunk))
            current_chunk = [sentences[i]]

    return chunks
```

---

# Chunking Strategy 3: Structure-Aware (Code)

**Respect code structure**

```python
def chunk_python_code(code: str) -> List[Dict]:
    chunks = []
    tree = ast.parse(code)

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            chunk = {
                'type': 'function',
                'name': node.name,
                'content': ast.get_source_segment(code, node),
                'line_start': node.lineno,
                'line_end': node.end_lineno
            }
            chunks.append(chunk)

        elif isinstance(node, ast.ClassDef):
            chunk = {
                'type': 'class',
                'name': node.name,
                'content': ast.get_source_segment(code, node),
                # ...
            }
            chunks.append(chunk)

    return chunks
```

---

# Chunking Best Practices

**General Guidelines:**
- Chunk size: 200-1000 tokens (depends on embedding model)
- Overlap: 10-20% to maintain context
- Preserve sentence/paragraph boundaries
- Include relevant metadata with each chunk

**For Code:**
- Chunk by logical units (functions, classes)
- Include function signatures in metadata
- Preserve import statements context

**For Documentation:**
- Respect heading hierarchy
- Keep related sections together
- Include heading context in each chunk

---

# Metadata Enrichment

```python
@dataclass
class ChunkMetadata:
    source: str              # File path or document ID
    chunk_index: int         # Position in original
    total_chunks: int        # Total from this source
    doc_type: str           # 'code', 'docs', 'conversation'

    # For code
    language: Optional[str]
    function_name: Optional[str]
    class_name: Optional[str]

    # For documents
    heading: Optional[str]
    section: Optional[str]

def enrich_chunks(chunks: List[str], source: str) -> List[Tuple]:
    enriched = []
    for i, chunk in enumerate(chunks):
        metadata = ChunkMetadata(
            source=source,
            chunk_index=i,
            total_chunks=len(chunks),
            doc_type="code"
        )
        enriched.append((chunk, metadata.to_dict()))
    return enriched
```

---

<!-- _class: lead -->
# RAG Pitfalls & Solutions

---

# Common RAG Failures

```
┌──────────────────────────────────────────────────────────────┐
│                   COMMON RAG FAILURES                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. RETRIEVAL FAILURES                                       │
│     ├── Wrong documents retrieved                            │
│     ├── Relevant documents missed                            │
│     ├── Too many irrelevant results                          │
│     └── Semantic gap between query and documents             │
│                                                              │
│  2. GENERATION FAILURES                                      │
│     ├── LLM ignores retrieved context                        │
│     ├── LLM contradicts retrieved context                    │
│     ├── LLM extrapolates beyond context                      │
│     └── Answer format doesn't match query intent             │
│                                                              │
│  3. SYSTEM FAILURES                                          │
│     ├── Stale/outdated index                                 │
│     ├── Chunking destroys important context                  │
│     ├── Embedding quality issues                             │
│     └── Latency too high for use case                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

# RAG Debugging Checklist

**If Answers Are Wrong:**
1. Check retrieved documents - are they relevant?
2. Check if answer is in retrieved docs at all
3. Try different number of retrieved docs (k)
4. Examine embedding similarity scores
5. Test query reformulation

**If Retrieval Is Poor:**
1. Check chunk sizes - too small/large?
2. Verify embeddings are working correctly
3. Test with exact phrase from document
4. Consider hybrid search (vector + keyword)

---

# Advanced: Hybrid Search

Combine **vector search** + **keyword search** (BM25)

```python
class HybridSearch:
    def search(
        self,
        query: str,
        k: int = 10,
        vector_weight: float = 0.7,
        bm25_weight: float = 0.3
    ) -> List[Dict]:
        # Vector search
        vector_results = self.vector_store.query(query, k*2)

        # BM25 search
        bm25_scores = self.bm25.get_scores(query)

        # Combine scores
        combined_scores = (
            vector_weight * normalize(vector_results) +
            bm25_weight * normalize(bm25_scores)
        )

        return top_k(combined_scores, k)
```

---

# Improving Retrieval Quality

**Query Rewriting:**
```
Original query: "How to fix error?"

Rewritten: "What are the steps to troubleshoot and resolve
            the following error: [error details]"
```

**Hypothetical Document Embeddings (HyDE):**
```
Query: "How does authentication work?"

Generate hypothetical answer → Embed that → Search
(Matches better with actual documents)
```

**Query Expansion:**
```
Query: "Python async"

Expanded: "Python async await asyncio coroutines"
```

---

<!-- _class: lead -->
# Evaluation Fundamentals

---

# Why Evaluate?

**You can't improve what you don't measure**

```
Without Evaluation:
"The RAG system seems to work... I think?"

With Evaluation:
"Retrieval precision: 0.85
 Answer relevance: 0.78
 Faithfulness: 0.92
 → Focus improvement on answer relevance"
```

**Benefits:**
- Quantify improvements
- Compare approaches objectively
- Catch regressions
- Build confidence for production

---

# Key RAG Metrics

| Metric | What It Measures | Good Score |
|--------|------------------|------------|
| **Retrieval Precision** | % of retrieved docs that are relevant | > 0.8 |
| **Retrieval Recall** | % of relevant docs that are retrieved | > 0.7 |
| **Answer Relevance** | Does answer address the question? | > 0.8 |
| **Faithfulness** | Is answer grounded in context? | > 0.9 |
| **Context Relevance** | Are retrieved docs relevant? | > 0.7 |

---

# Faithfulness Metric

**Does the answer stay true to the retrieved context?**

```python
def evaluate_faithfulness(
    answer: str,
    context: str,
    llm_client
) -> float:
    """Check if answer is supported by context."""

    prompt = f"""
Given this context:
{context}

And this answer:
{answer}

For each statement in the answer, determine if it is
supported by the context. Return a score from 0-1.

Score:"""

    score = llm_client.chat(prompt)
    return float(score)
```

**Key insight**: Use LLM-as-judge for qualitative metrics!

---

# Answer Relevance Metric

**Does the answer actually address the question?**

```python
def evaluate_relevance(
    question: str,
    answer: str,
    llm_client
) -> float:
    """Check if answer is relevant to question."""

    prompt = f"""
Question: {question}
Answer: {answer}

Does the answer directly address the question?
Rate from 0 (not relevant) to 1 (perfectly relevant).

Consider:
- Does it answer what was asked?
- Is it complete?
- Is it focused?

Score:"""

    score = llm_client.chat(prompt)
    return float(score)
```

---

# Building an Eval Dataset

**Golden dataset structure:**

```python
@dataclass
class EvalExample:
    question: str
    ground_truth_answer: str
    relevant_doc_ids: List[str]  # Which docs should be retrieved
    metadata: Dict

# Example
examples = [
    EvalExample(
        question="How do I reset my password?",
        ground_truth_answer="Click 'Forgot Password' on login page...",
        relevant_doc_ids=["doc_123", "doc_456"],
        metadata={"category": "authentication"}
    ),
    # ... more examples
]
```

**Tips:**
- Start with 20-50 examples
- Cover common query types
- Include edge cases
- Update as system evolves

---

# Running Evaluations

```python
class RAGEvaluator:
    def evaluate(
        self,
        rag_system: RAGSystem,
        eval_dataset: List[EvalExample]
    ) -> Dict[str, float]:
        results = {
            "retrieval_precision": [],
            "answer_relevance": [],
            "faithfulness": []
        }

        for example in eval_dataset:
            # Run RAG system
            retrieved = rag_system.retrieve(example.question)
            answer = rag_system.generate(example.question, retrieved)

            # Evaluate
            results["retrieval_precision"].append(
                self.calc_precision(retrieved, example.relevant_doc_ids)
            )
            results["answer_relevance"].append(
                self.eval_relevance(example.question, answer)
            )
            results["faithfulness"].append(
                self.eval_faithfulness(answer, retrieved)
            )

        # Aggregate
        return {k: sum(v)/len(v) for k, v in results.items()}
```

---

# Debugging with Observability

**What to log:**

```python
@dataclass
class RAGTrace:
    query: str
    query_embedding: List[float]
    retrieved_docs: List[Dict]
    retrieval_scores: List[float]
    context_sent_to_llm: str
    llm_response: str
    latency_ms: float
    timestamp: datetime

# Usage
trace = rag_system.run_with_tracing(query)

# Analyze
if trace.retrieval_scores[0] < 0.6:
    print("Low retrieval confidence!")

if trace.latency_ms > 2000:
    print("Slow response!")
```

---

# Observability Tools

| Tool | Purpose |
|------|---------|
| **LangSmith** | LangChain-native tracing |
| **Weights & Biases** | Experiment tracking |
| **Arize Phoenix** | Open-source observability |
| **Helicone** | LLM request monitoring |
| **Custom logging** | Full control |

---

# Common Evaluation Pitfalls

**Pitfall 1: Overfitting to eval set**
- Use separate train/eval/test splits
- Rotate eval examples regularly

**Pitfall 2: Not testing edge cases**
- Include queries with no answer
- Test with misleading context
- Test with conflicting information

**Pitfall 3: Ignoring latency**
- 99% accuracy but 10s latency = unusable
- Balance quality vs speed

---

# Lab 04: RAG System with Evaluation

**Project: Code Q&A System**

You'll build:
- Document chunking for code files
- Vector store integration (ChromaDB)
- RAG pipeline for Q&A
- Evaluation metrics and dataset
- Performance monitoring

```bash
# Navigate to the lab
cd labs/lab04-rag-system

# Read the instructions
cat README.md
```

---

# Day 4 Key Takeaways

1. **RAG = Retrieval + Generation** - Ground LLMs in your data
2. **Chunking is critical** - Bad chunks = bad retrieval
3. **Evaluate everything** - Measure to improve
4. **Faithfulness matters** - Prevent hallucinations
5. **Observability is key** - Log, trace, debug

---

# Evaluation Checklist

By now you should have:

- [ ] Golden eval dataset (20+ examples)
- [ ] Retrieval metrics (precision, recall)
- [ ] Generation metrics (relevance, faithfulness)
- [ ] Observability/tracing setup
- [ ] Performance benchmarks

---

# What's Next: Day 5

**Production & Capstone**

- Rate limiting and caching
- Security (prompt injection defense)
- Cost management
- Deployment strategies
- Final capstone project

---

<!-- _class: lead -->
# Questions?

**Lab 04 awaits!**

```
cd labs/lab04-rag-system
```
