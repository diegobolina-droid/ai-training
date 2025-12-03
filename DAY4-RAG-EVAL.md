# Day 4: RAG & Evaluation

## Learning Objectives

By the end of Day 4, you will be able to:
- Explain how RAG systems work and when to use them
- Implement effective chunking and embedding strategies
- Identify and avoid common RAG pitfalls
- Build evaluation frameworks for AI systems
- Debug and observe AI system behavior
- Deploy a complete RAG system with evaluation

---

## Table of Contents

1. [RAG Fundamentals](#rag-fundamentals)
2. [Chunking Strategies](#chunking)
3. [RAG Pitfalls & Advanced Patterns](#pitfalls)
4. [Exercise 1: RAG Architecture Design](#exercise-1)
5. [Evaluation Fundamentals](#evaluation)
6. [Debugging & Observability](#observability)
7. [Lab 04: Build & Evaluate RAG System](#lab-04)

---

<a name="rag-fundamentals"></a>
## 1. RAG Fundamentals (1 hour)

### 1.1 What is RAG?

**Retrieval-Augmented Generation (RAG)** combines information retrieval with LLM generation to ground responses in specific data.

```
┌─────────────────────────────────────────────────────────────────┐
│                        RAG Pipeline                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INDEXING PHASE (Offline)                                       │
│  ─────────────────────────                                      │
│                                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│  │Documents │──▶│  Chunk   │──▶│  Embed   │──▶│  Store   │    │
│  │          │   │          │   │          │   │(Vector DB)│    │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘    │
│                                                                 │
│  QUERY PHASE (Online)                                           │
│  ────────────────────                                           │
│                                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│  │  Query   │──▶│  Embed   │──▶│ Retrieve │──▶│   LLM    │    │
│  │          │   │  Query   │   │ Similar  │   │ Generate │    │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘    │
│                                     │                          │
│                                     ▼                          │
│                              Top-K Documents                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Why RAG?

| Problem | Without RAG | With RAG |
|---------|-------------|----------|
| **Knowledge Cutoff** | LLM knows only training data | Access to current/custom data |
| **Hallucinations** | Makes up facts | Grounded in source documents |
| **Domain Specificity** | Generic knowledge | Your company's data |
| **Updatability** | Retrain entire model | Update index only |
| **Traceability** | Can't cite sources | Can point to exact source |

### 1.3 When to Use RAG

```markdown
## RAG Decision Guide

Use RAG when:
✅ Need access to private/proprietary data
✅ Data changes frequently
✅ Need to cite sources
✅ Domain-specific knowledge required
✅ Want to reduce hallucinations with factual grounding

Don't use RAG when:
❌ General knowledge questions (use base LLM)
❌ Data fits entirely in context window
❌ Real-time data needed (use function calling)
❌ Reasoning over structured data (use SQL/code)
❌ Simple classification tasks
```

### 1.4 Embeddings Explained

Embeddings convert text to dense vectors that capture semantic meaning.

```python
# embeddings/basics.py
"""Understanding embeddings."""
import numpy as np
from typing import List

def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Calculate cosine similarity between two vectors."""
    a, b = np.array(a), np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Example: Similar sentences have similar embeddings
sentences = [
    "How do I reset my password?",
    "I forgot my password and need to change it",
    "What are your business hours?",
    "When is the store open?",
]

# After embedding, similarities would be:
# "reset password" ↔ "forgot password": ~0.92 (very similar)
# "reset password" ↔ "business hours": ~0.23 (not similar)
# "business hours" ↔ "store open": ~0.88 (very similar)
```

**Embedding Models Comparison:**

| Model | Dimensions | Speed | Quality | Cost |
|-------|------------|-------|---------|------|
| OpenAI text-embedding-3-small | 1536 | Fast | Good | $0.02/1M tokens |
| OpenAI text-embedding-3-large | 3072 | Medium | Excellent | $0.13/1M tokens |
| Voyage-3 | 1024 | Fast | Excellent | $0.06/1M tokens |
| Cohere embed-v3 | 1024 | Fast | Excellent | $0.10/1M tokens |
| BGE-large (local) | 1024 | Varies | Good | Free |

### 1.5 Vector Databases Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Vector Database Options                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LIGHTWEIGHT (Good for getting started)                         │
│  • ChromaDB - Simple, local, great for prototyping              │
│  • LanceDB - Local, integrated with pandas/arrow                │
│  • SQLite + extension - Minimal infrastructure                  │
│                                                                 │
│  PRODUCTION SCALE                                               │
│  • Pinecone - Managed, fast, scales well                        │
│  • Weaviate - Open source, feature-rich                         │
│  • Qdrant - Open source, fast, Rust-based                       │
│  • Milvus - Open source, very scalable                          │
│                                                                 │
│  EXISTING INFRASTRUCTURE                                        │
│  • PostgreSQL + pgvector - If you already use Postgres          │
│  • Elasticsearch - If you already use ES                        │
│  • Redis - If you already use Redis                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.6 Basic RAG Implementation

```python
# rag/basic_rag.py
"""Simple RAG implementation."""
from typing import List, Dict, Any
import chromadb
from chromadb.utils import embedding_functions

class SimpleRAG:
    """Basic RAG system using ChromaDB."""

    def __init__(
        self,
        collection_name: str = "documents",
        embedding_model: str = "text-embedding-3-small"
    ):
        # Initialize ChromaDB
        self.client = chromadb.Client()

        # Use OpenAI embeddings
        self.ef = embedding_functions.OpenAIEmbeddingFunction(
            model_name=embedding_model
        )

        # Create or get collection
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            embedding_function=self.ef
        )

    def add_documents(
        self,
        documents: List[str],
        metadatas: List[Dict] = None,
        ids: List[str] = None
    ):
        """Add documents to the index."""
        if ids is None:
            ids = [f"doc_{i}" for i in range(len(documents))]

        self.collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )

    def query(
        self,
        query: str,
        n_results: int = 5
    ) -> List[Dict[str, Any]]:
        """Query the index and return relevant documents."""
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )

        # Format results
        formatted = []
        for i in range(len(results['documents'][0])):
            formatted.append({
                'content': results['documents'][0][i],
                'metadata': results['metadatas'][0][i] if results['metadatas'] else {},
                'distance': results['distances'][0][i] if results['distances'] else None,
                'id': results['ids'][0][i]
            })

        return formatted

    def generate_response(
        self,
        query: str,
        llm_client,
        n_results: int = 5
    ) -> str:
        """Full RAG pipeline: retrieve + generate."""
        # Retrieve relevant documents
        relevant_docs = self.query(query, n_results)

        # Build context
        context = "\n\n---\n\n".join([
            f"Source: {doc['metadata'].get('source', 'Unknown')}\n{doc['content']}"
            for doc in relevant_docs
        ])

        # Generate response
        prompt = f"""Answer the question based on the provided context.
If the context doesn't contain the answer, say so.

Context:
{context}

Question: {query}

Answer:"""

        response = llm_client.chat([
            {"role": "system", "content": "You answer questions based on provided context."},
            {"role": "user", "content": prompt}
        ])

        return response

# Usage
if __name__ == "__main__":
    rag = SimpleRAG()

    # Add some documents
    docs = [
        "Our company was founded in 2020 by Jane Smith.",
        "The main product is a project management tool called TaskFlow.",
        "TaskFlow supports integrations with Slack, GitHub, and Jira.",
        "Pricing starts at $10/user/month for the basic plan.",
        "Enterprise customers get dedicated support and SLA guarantees."
    ]

    rag.add_documents(
        documents=docs,
        metadatas=[{"source": f"doc_{i}"} for i in range(len(docs))]
    )

    # Query
    from utils.llm_client import get_llm_client
    client = get_llm_client("anthropic")

    response = rag.generate_response(
        "What integrations does TaskFlow support?",
        client
    )
    print(response)
```

---

<a name="chunking"></a>
## 2. Chunking Strategies (1 hour)

### 2.1 Why Chunking Matters

```
┌─────────────────────────────────────────────────────────────────┐
│                    Chunking Impact                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TOO SMALL                    JUST RIGHT                        │
│  ──────────                   ──────────                        │
│  ┌─────┐                      ┌───────────────┐                 │
│  │ The │                      │ The product   │                 │
│  └─────┘                      │ supports      │                 │
│  ┌─────────┐                  │ integration   │                 │
│  │ product │                  │ with Slack,   │                 │
│  └─────────┘                  │ GitHub, Jira  │                 │
│  ┌─────────┐                  └───────────────┘                 │
│  │supports │                                                    │
│  └─────────┘                  TOO LARGE                         │
│  ...                          ──────────                        │
│                               ┌─────────────────────────────┐   │
│  Problems:                    │ [Entire document with       │   │
│  • Loses context              │  company history, product   │   │
│  • Many irrelevant matches    │  details, pricing, support, │   │
│  • Fragments meaning          │  legal terms, FAQs...]      │   │
│                               └─────────────────────────────┘   │
│                                                                 │
│                               Problems:                         │
│                               • Exceeds context window          │
│                               • Dilutes relevant info           │
│                               • Higher costs                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Chunking Strategies

**Strategy 1: Fixed-Size Chunking**
```python
# chunking/fixed_size.py
from typing import List

def fixed_size_chunks(
    text: str,
    chunk_size: int = 500,
    overlap: int = 50
) -> List[str]:
    """Split text into fixed-size chunks with overlap."""
    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size

        # Find a good break point (sentence or word boundary)
        if end < len(text):
            # Look for sentence boundary
            for sep in ['. ', '.\n', '\n\n']:
                last_sep = text[start:end].rfind(sep)
                if last_sep > chunk_size * 0.5:
                    end = start + last_sep + len(sep)
                    break

        chunks.append(text[start:end].strip())
        start = end - overlap  # Overlap for context continuity

    return chunks

# Example
text = """The quick brown fox jumps over the lazy dog.
This is a sample text for demonstrating chunking.
Different strategies work better for different content."""

chunks = fixed_size_chunks(text, chunk_size=100, overlap=20)
for i, chunk in enumerate(chunks):
    print(f"Chunk {i}: {chunk}")
```

**Strategy 2: Semantic Chunking**
```python
# chunking/semantic.py
from typing import List, Tuple
import numpy as np

def semantic_chunks(
    text: str,
    embedding_func,
    similarity_threshold: float = 0.8,
    min_chunk_size: int = 100
) -> List[str]:
    """Split text based on semantic similarity between sentences."""
    import re

    # Split into sentences
    sentences = re.split(r'(?<=[.!?])\s+', text)
    if not sentences:
        return [text]

    # Get embeddings for each sentence
    embeddings = [embedding_func(s) for s in sentences]

    # Group sentences by semantic similarity
    chunks = []
    current_chunk = [sentences[0]]
    current_embedding = embeddings[0]

    for i in range(1, len(sentences)):
        similarity = cosine_similarity(current_embedding, embeddings[i])

        if similarity > similarity_threshold:
            # Add to current chunk
            current_chunk.append(sentences[i])
            # Update embedding (average)
            current_embedding = np.mean([current_embedding, embeddings[i]], axis=0)
        else:
            # Start new chunk
            chunk_text = ' '.join(current_chunk)
            if len(chunk_text) >= min_chunk_size:
                chunks.append(chunk_text)
            current_chunk = [sentences[i]]
            current_embedding = embeddings[i]

    # Don't forget last chunk
    if current_chunk:
        chunks.append(' '.join(current_chunk))

    return chunks
```

**Strategy 3: Structure-Aware Chunking (for Code)**
```python
# chunking/code_aware.py
from typing import List, Dict
import ast
import re

def chunk_python_code(code: str) -> List[Dict[str, str]]:
    """Chunk Python code by logical units (classes, functions)."""
    chunks = []

    try:
        tree = ast.parse(code)
    except SyntaxError:
        # Fall back to regex-based chunking
        return chunk_code_regex(code)

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
                'line_start': node.lineno,
                'line_end': node.end_lineno
            }
            chunks.append(chunk)

    # Handle module-level code
    # ... (implementation details)

    return chunks

def chunk_code_regex(code: str) -> List[Dict[str, str]]:
    """Fallback: chunk code using regex patterns."""
    patterns = {
        'python_func': r'(def \w+\([^)]*\):.*?)(?=\ndef |\nclass |\Z)',
        'python_class': r'(class \w+.*?:.*?)(?=\nclass |\Z)',
        'js_func': r'(function \w+\([^)]*\)\s*{.*?})',
    }
    # ... implementation
    pass
```

### 2.3 Chunking Best Practices

```markdown
## Chunking Checklist

### General Guidelines
- [ ] Chunk size: 200-1000 tokens (depends on embedding model)
- [ ] Overlap: 10-20% to maintain context
- [ ] Preserve sentence/paragraph boundaries
- [ ] Include relevant metadata with each chunk

### For Code
- [ ] Chunk by logical units (functions, classes)
- [ ] Include function signatures in metadata
- [ ] Preserve import statements context
- [ ] Consider including docstrings as separate chunks

### For Documentation
- [ ] Respect heading hierarchy
- [ ] Keep related sections together
- [ ] Include heading context in each chunk
- [ ] Handle tables and lists carefully

### For Conversations/Logs
- [ ] Group by conversation turns
- [ ] Include timestamp metadata
- [ ] Consider speaker/role information
```

### 2.4 Adding Metadata

```python
# chunking/metadata.py
from dataclasses import dataclass
from typing import Optional, List, Dict
from datetime import datetime

@dataclass
class ChunkMetadata:
    """Metadata to store with each chunk."""
    source: str                    # File path or document ID
    chunk_index: int               # Position in original document
    total_chunks: int              # Total chunks from this source
    created_at: datetime
    doc_type: str                  # 'code', 'docs', 'conversation'

    # For code
    language: Optional[str] = None
    function_name: Optional[str] = None
    class_name: Optional[str] = None
    file_path: Optional[str] = None

    # For documents
    heading: Optional[str] = None
    section: Optional[str] = None

    # Custom fields
    custom: Dict = None

    def to_dict(self) -> Dict:
        """Convert to dictionary for storage."""
        result = {
            'source': self.source,
            'chunk_index': self.chunk_index,
            'total_chunks': self.total_chunks,
            'created_at': self.created_at.isoformat(),
            'doc_type': self.doc_type,
        }
        # Add optional fields if set
        for field in ['language', 'function_name', 'class_name',
                      'file_path', 'heading', 'section']:
            value = getattr(self, field)
            if value:
                result[field] = value
        if self.custom:
            result.update(self.custom)
        return result

def enrich_chunks_with_metadata(
    chunks: List[str],
    source: str,
    doc_type: str,
    **kwargs
) -> List[tuple[str, Dict]]:
    """Add metadata to chunks."""
    enriched = []
    total = len(chunks)

    for i, chunk in enumerate(chunks):
        metadata = ChunkMetadata(
            source=source,
            chunk_index=i,
            total_chunks=total,
            created_at=datetime.now(),
            doc_type=doc_type,
            **kwargs
        )
        enriched.append((chunk, metadata.to_dict()))

    return enriched
```

---

<a name="pitfalls"></a>
## 3. RAG Pitfalls & Advanced Patterns (45 min)

### 3.1 Common RAG Failures

```
┌─────────────────────────────────────────────────────────────────┐
│                    Common RAG Failures                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. RETRIEVAL FAILURES                                          │
│     ├── Wrong documents retrieved                               │
│     ├── Relevant documents missed                               │
│     ├── Too many irrelevant results dilute context              │
│     └── Semantic gap between query and documents                │
│                                                                 │
│  2. GENERATION FAILURES                                         │
│     ├── LLM ignores retrieved context                           │
│     ├── LLM contradicts retrieved context                       │
│     ├── LLM extrapolates beyond context                         │
│     └── Answer format doesn't match query intent                │
│                                                                 │
│  3. SYSTEM FAILURES                                             │
│     ├── Stale/outdated index                                    │
│     ├── Chunking destroys important context                     │
│     ├── Embedding quality issues                                │
│     └── Latency too high for use case                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 RAG Failure Checklist

```markdown
## RAG Debugging Checklist

### If Answers Are Wrong
1. [ ] Check retrieved documents - are they relevant?
2. [ ] Check if answer is in retrieved docs at all
3. [ ] Try different number of retrieved docs (k)
4. [ ] Examine embedding similarity scores
5. [ ] Test query reformulation

### If Retrieval Is Poor
1. [ ] Check chunk sizes - too small/large?
2. [ ] Verify embeddings are working correctly
3. [ ] Test with exact phrase from document
4. [ ] Check for vocabulary mismatch
5. [ ] Consider hybrid search (vector + keyword)

### If Generation Is Poor
1. [ ] Check context window usage
2. [ ] Verify prompt template
3. [ ] Test with context in different positions
4. [ ] Check for conflicting information in context
5. [ ] Try explicit instruction to use only context
```

### 3.3 Advanced Pattern: Hybrid Search

```python
# rag/hybrid_search.py
"""Combine vector search with keyword search."""
from typing import List, Dict, Any
import re
from rank_bm25 import BM25Okapi

class HybridSearch:
    """Combines semantic (vector) and lexical (BM25) search."""

    def __init__(self, vector_store, documents: List[str]):
        self.vector_store = vector_store
        self.documents = documents

        # Build BM25 index
        tokenized = [self._tokenize(doc) for doc in documents]
        self.bm25 = BM25Okapi(tokenized)

    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenization."""
        return re.findall(r'\w+', text.lower())

    def search(
        self,
        query: str,
        k: int = 10,
        vector_weight: float = 0.7,
        bm25_weight: float = 0.3
    ) -> List[Dict[str, Any]]:
        """Hybrid search combining vector and BM25 scores."""
        # Vector search
        vector_results = self.vector_store.query(query, n_results=k*2)

        # BM25 search
        tokenized_query = self._tokenize(query)
        bm25_scores = self.bm25.get_scores(tokenized_query)

        # Combine scores
        combined = {}
        for i, result in enumerate(vector_results):
            doc_id = result['id']
            # Normalize vector score (distance to similarity)
            vector_score = 1 / (1 + result['distance'])
            combined[doc_id] = {
                'content': result['content'],
                'vector_score': vector_score,
                'bm25_score': 0,
                'combined': 0
            }

        # Add BM25 scores
        for i, score in enumerate(bm25_scores):
            doc_id = f"doc_{i}"
            if doc_id in combined:
                combined[doc_id]['bm25_score'] = score
            elif score > 0:
                combined[doc_id] = {
                    'content': self.documents[i],
                    'vector_score': 0,
                    'bm25_score': score,
                    'combined': 0
                }

        # Normalize and combine
        max_vector = max(r['vector_score'] for r in combined.values()) or 1
        max_bm25 = max(r['bm25_score'] for r in combined.values()) or 1

        for doc_id in combined:
            combined[doc_id]['vector_score'] /= max_vector
            combined[doc_id]['bm25_score'] /= max_bm25
            combined[doc_id]['combined'] = (
                vector_weight * combined[doc_id]['vector_score'] +
                bm25_weight * combined[doc_id]['bm25_score']
            )

        # Sort by combined score
        sorted_results = sorted(
            combined.items(),
            key=lambda x: x[1]['combined'],
            reverse=True
        )

        return [
            {'id': doc_id, **data}
            for doc_id, data in sorted_results[:k]
        ]
```

### 3.4 Advanced Pattern: Query Transformation

```python
# rag/query_transform.py
"""Transform queries to improve retrieval."""

QUERY_EXPANSION_PROMPT = """Given a user query, generate 3 alternative phrasings
that might help find relevant documents.

Original query: {query}

Alternative phrasings (one per line):"""

HYPOTHETICAL_DOCUMENT_PROMPT = """Given a question, write a short paragraph
that would be a perfect answer to this question. This will be used to find
similar content.

Question: {query}

Hypothetical perfect answer:"""

class QueryTransformer:
    """Transforms queries to improve retrieval."""

    def __init__(self, llm_client):
        self.llm = llm_client

    def expand_query(self, query: str) -> List[str]:
        """Generate alternative query phrasings."""
        prompt = QUERY_EXPANSION_PROMPT.format(query=query)
        response = self.llm.chat([
            {"role": "user", "content": prompt}
        ])

        alternatives = [q.strip() for q in response.split('\n') if q.strip()]
        return [query] + alternatives[:3]  # Original + 3 alternatives

    def hyde(self, query: str) -> str:
        """
        Hypothetical Document Embedding (HyDE).
        Generate a hypothetical answer and use that for retrieval.
        """
        prompt = HYPOTHETICAL_DOCUMENT_PROMPT.format(query=query)
        response = self.llm.chat([
            {"role": "user", "content": prompt}
        ])
        return response

    def step_back(self, query: str) -> str:
        """Generate a more general 'step-back' question."""
        prompt = f"""Given this specific question, generate a more general
question that would help understand the broader context.

Specific question: {query}

More general question:"""

        response = self.llm.chat([
            {"role": "user", "content": prompt}
        ])
        return response.strip()
```

### 3.5 Advanced Pattern: Reranking

```python
# rag/reranking.py
"""Rerank retrieved documents for better relevance."""
from typing import List, Dict

RERANK_PROMPT = """Given a question and a list of documents, rank them by relevance.
Return document numbers in order of relevance (most relevant first).

Question: {query}

Documents:
{documents}

Ranking (comma-separated document numbers, e.g., "3,1,4,2"):"""

class LLMReranker:
    """Use LLM to rerank retrieved documents."""

    def __init__(self, llm_client):
        self.llm = llm_client

    def rerank(
        self,
        query: str,
        documents: List[Dict],
        top_k: int = 5
    ) -> List[Dict]:
        """Rerank documents using LLM."""
        # Format documents for prompt
        doc_text = "\n\n".join([
            f"Document {i+1}:\n{doc['content'][:500]}..."
            for i, doc in enumerate(documents)
        ])

        prompt = RERANK_PROMPT.format(query=query, documents=doc_text)

        response = self.llm.chat([
            {"role": "user", "content": prompt}
        ])

        # Parse ranking
        try:
            ranking = [int(x.strip())-1 for x in response.split(',')]
            reranked = [documents[i] for i in ranking if i < len(documents)]
            return reranked[:top_k]
        except (ValueError, IndexError):
            # Fallback to original order
            return documents[:top_k]


# Alternative: Cross-encoder reranking (faster, more accurate)
def cross_encoder_rerank(query: str, documents: List[str], model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
    """Rerank using a cross-encoder model."""
    from sentence_transformers import CrossEncoder

    model = CrossEncoder(model_name)

    # Score each query-document pair
    pairs = [[query, doc] for doc in documents]
    scores = model.predict(pairs)

    # Sort by score
    scored_docs = list(zip(documents, scores))
    scored_docs.sort(key=lambda x: x[1], reverse=True)

    return [doc for doc, score in scored_docs]
```

---

<a name="exercise-1"></a>
## 4. Exercise 1: RAG Architecture Design (30 min)

### Task
Design a RAG system for a codebase Q&A assistant.

### Scenario
You're building a system that lets developers ask questions about a large codebase:
- 500+ source files
- Mixed Python and TypeScript
- Includes documentation and READMEs
- Need to answer questions like:
  - "How does authentication work?"
  - "Where is the database connection configured?"
  - "What does the processOrder function do?"

### Template

```markdown
## Codebase RAG Architecture

### Document Types to Index
1. Type:
   - Chunking strategy:
   - Chunk size:
   - Metadata to include:

2. Type:
   - Chunking strategy:
   - Chunk size:
   - Metadata to include:

### Query Handling
- How will you handle:
  - Code-specific queries (function names, etc.):
  - Conceptual queries (how does X work):
  - Multi-file queries (how do A and B interact):

### Retrieval Strategy
- Vector search configuration:
- Will you use hybrid search? Why/why not:
- Reranking approach:

### Generation
- System prompt considerations:
- How will you format code in responses:
- How will you cite sources:

### Architecture Diagram
```
[Draw your RAG pipeline]
```

### Potential Issues
1.
2.
3.

### Metrics to Track
1.
2.
3.
```

---

<a name="evaluation"></a>
## 5. Evaluation Fundamentals (45 min)

### 5.1 Why Evaluation Matters

```
┌─────────────────────────────────────────────────────────────────┐
│                    Evaluation Importance                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Without Evaluation:                                            │
│  ───────────────────                                            │
│  "It seems to work" → Ship it → Users complain → Firefighting   │
│                                                                 │
│  With Evaluation:                                               │
│  ────────────────                                               │
│  Measure → Understand → Improve → Measure → Ship with confidence│
│                                                                 │
│  What to Evaluate:                                              │
│  ─────────────────                                              │
│  1. RETRIEVAL QUALITY                                           │
│     • Are we finding the right documents?                       │
│     • Are we ranking them correctly?                            │
│                                                                 │
│  2. GENERATION QUALITY                                          │
│     • Is the answer correct?                                    │
│     • Is it relevant to the question?                           │
│     • Is it well-formatted?                                     │
│                                                                 │
│  3. END-TO-END QUALITY                                          │
│     • Does the system solve user problems?                      │
│     • Would users trust these answers?                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Retrieval Metrics

```python
# evaluation/retrieval_metrics.py
"""Metrics for evaluating retrieval quality."""
from typing import List, Set

def precision_at_k(retrieved: List[str], relevant: Set[str], k: int) -> float:
    """
    Precision@K: What fraction of retrieved docs are relevant?
    """
    retrieved_k = retrieved[:k]
    relevant_retrieved = len(set(retrieved_k) & relevant)
    return relevant_retrieved / k if k > 0 else 0.0

def recall_at_k(retrieved: List[str], relevant: Set[str], k: int) -> float:
    """
    Recall@K: What fraction of relevant docs did we retrieve?
    """
    retrieved_k = retrieved[:k]
    relevant_retrieved = len(set(retrieved_k) & relevant)
    return relevant_retrieved / len(relevant) if relevant else 0.0

def mean_reciprocal_rank(retrieved: List[str], relevant: Set[str]) -> float:
    """
    MRR: How high is the first relevant result?
    """
    for i, doc in enumerate(retrieved):
        if doc in relevant:
            return 1.0 / (i + 1)
    return 0.0

def ndcg_at_k(retrieved: List[str], relevance_scores: dict, k: int) -> float:
    """
    NDCG@K: Normalized Discounted Cumulative Gain.
    Accounts for graded relevance (not just binary).
    """
    import math

    def dcg(scores):
        return sum(score / math.log2(i + 2) for i, score in enumerate(scores))

    # Get scores for retrieved docs
    retrieved_scores = [relevance_scores.get(doc, 0) for doc in retrieved[:k]]

    # Ideal ranking
    ideal_scores = sorted(relevance_scores.values(), reverse=True)[:k]

    dcg_score = dcg(retrieved_scores)
    idcg_score = dcg(ideal_scores)

    return dcg_score / idcg_score if idcg_score > 0 else 0.0

# Evaluation runner
def evaluate_retrieval(
    queries: List[str],
    ground_truth: List[Set[str]],  # Relevant doc IDs for each query
    retriever,
    k: int = 5
) -> dict:
    """Run retrieval evaluation."""
    metrics = {
        'precision': [],
        'recall': [],
        'mrr': []
    }

    for query, relevant in zip(queries, ground_truth):
        retrieved = retriever.query(query, n_results=k)
        retrieved_ids = [r['id'] for r in retrieved]

        metrics['precision'].append(precision_at_k(retrieved_ids, relevant, k))
        metrics['recall'].append(recall_at_k(retrieved_ids, relevant, k))
        metrics['mrr'].append(mean_reciprocal_rank(retrieved_ids, relevant))

    return {
        name: sum(values) / len(values)
        for name, values in metrics.items()
    }
```

### 5.3 LLM-as-Judge Evaluation

```python
# evaluation/llm_judge.py
"""Use LLM to evaluate response quality."""

JUDGE_PROMPT_RELEVANCE = """Rate how relevant this answer is to the question.

Question: {question}
Answer: {answer}

Rate from 1-5:
1 = Completely irrelevant
2 = Slightly relevant
3 = Moderately relevant
4 = Very relevant
5 = Perfectly relevant

Provide your rating as a single number followed by a brief explanation.
Rating:"""

JUDGE_PROMPT_FAITHFULNESS = """Check if the answer is faithful to the provided context.

Context:
{context}

Question: {question}
Answer: {answer}

Does the answer contain any claims not supported by the context?
Rate from 1-5:
1 = Many unsupported claims
2 = Some unsupported claims
3 = Minor unsupported details
4 = Mostly faithful
5 = Completely faithful to context

Rating:"""

JUDGE_PROMPT_CORRECTNESS = """Given the ground truth answer, rate how correct this answer is.

Question: {question}
Ground Truth: {ground_truth}
Generated Answer: {answer}

Rate from 1-5:
1 = Completely wrong
2 = Mostly wrong with some correct elements
3 = Partially correct
4 = Mostly correct with minor errors
5 = Completely correct

Rating:"""

class LLMJudge:
    """Use an LLM to judge response quality."""

    def __init__(self, llm_client, model: str = None):
        self.llm = llm_client
        self.model = model

    def evaluate_relevance(self, question: str, answer: str) -> dict:
        """Evaluate answer relevance to question."""
        prompt = JUDGE_PROMPT_RELEVANCE.format(
            question=question,
            answer=answer
        )
        response = self.llm.chat([{"role": "user", "content": prompt}])
        return self._parse_rating(response)

    def evaluate_faithfulness(
        self,
        context: str,
        question: str,
        answer: str
    ) -> dict:
        """Evaluate if answer is faithful to context."""
        prompt = JUDGE_PROMPT_FAITHFULNESS.format(
            context=context,
            question=question,
            answer=answer
        )
        response = self.llm.chat([{"role": "user", "content": prompt}])
        return self._parse_rating(response)

    def evaluate_correctness(
        self,
        question: str,
        ground_truth: str,
        answer: str
    ) -> dict:
        """Evaluate answer correctness against ground truth."""
        prompt = JUDGE_PROMPT_CORRECTNESS.format(
            question=question,
            ground_truth=ground_truth,
            answer=answer
        )
        response = self.llm.chat([{"role": "user", "content": prompt}])
        return self._parse_rating(response)

    def _parse_rating(self, response: str) -> dict:
        """Parse rating from LLM response."""
        import re
        # Find first number 1-5
        match = re.search(r'\b([1-5])\b', response)
        rating = int(match.group(1)) if match else None
        return {
            'rating': rating,
            'explanation': response
        }
```

### 5.4 Building Evaluation Datasets

```python
# evaluation/dataset.py
"""Building and managing evaluation datasets."""
from dataclasses import dataclass
from typing import List, Optional, Dict
import json

@dataclass
class EvalExample:
    """Single evaluation example."""
    id: str
    question: str
    expected_answer: str
    relevant_docs: List[str]  # IDs of relevant documents
    context: Optional[str] = None  # For faithfulness evaluation
    metadata: Dict = None

class EvalDataset:
    """Evaluation dataset management."""

    def __init__(self, examples: List[EvalExample] = None):
        self.examples = examples or []

    def add_example(self, example: EvalExample):
        """Add an example to the dataset."""
        self.examples.append(example)

    def add_from_production(
        self,
        question: str,
        answer: str,
        rating: int,
        relevant_docs: List[str]
    ):
        """Add example from production feedback."""
        # Only add high-quality examples
        if rating >= 4:
            example = EvalExample(
                id=f"prod_{len(self.examples)}",
                question=question,
                expected_answer=answer,
                relevant_docs=relevant_docs
            )
            self.examples.append(example)

    def save(self, path: str):
        """Save dataset to JSON."""
        data = [
            {
                'id': ex.id,
                'question': ex.question,
                'expected_answer': ex.expected_answer,
                'relevant_docs': ex.relevant_docs,
                'context': ex.context,
                'metadata': ex.metadata
            }
            for ex in self.examples
        ]
        with open(path, 'w') as f:
            json.dump(data, f, indent=2)

    @classmethod
    def load(cls, path: str) -> 'EvalDataset':
        """Load dataset from JSON."""
        with open(path) as f:
            data = json.load(f)

        examples = [
            EvalExample(
                id=ex['id'],
                question=ex['question'],
                expected_answer=ex['expected_answer'],
                relevant_docs=ex['relevant_docs'],
                context=ex.get('context'),
                metadata=ex.get('metadata')
            )
            for ex in data
        ]
        return cls(examples)

# Example: Creating an evaluation dataset
def create_sample_eval_dataset() -> EvalDataset:
    """Create a sample evaluation dataset."""
    dataset = EvalDataset()

    # Add examples
    dataset.add_example(EvalExample(
        id="q1",
        question="What integrations does TaskFlow support?",
        expected_answer="TaskFlow supports integrations with Slack, GitHub, and Jira.",
        relevant_docs=["doc_integrations", "doc_features"]
    ))

    dataset.add_example(EvalExample(
        id="q2",
        question="How much does the basic plan cost?",
        expected_answer="The basic plan costs $10 per user per month.",
        relevant_docs=["doc_pricing"]
    ))

    return dataset
```

### 5.5 Evaluation Pipeline

```python
# evaluation/pipeline.py
"""Complete evaluation pipeline."""
from dataclasses import dataclass
from typing import Dict, List, Any
import time

@dataclass
class EvalResult:
    """Result of a single evaluation."""
    example_id: str
    retrieval_metrics: Dict[str, float]
    generation_metrics: Dict[str, float]
    latency_ms: float
    retrieved_docs: List[str]
    generated_answer: str

class RAGEvaluator:
    """Complete RAG evaluation pipeline."""

    def __init__(self, rag_system, judge: LLMJudge):
        self.rag = rag_system
        self.judge = judge

    def evaluate(self, dataset: EvalDataset) -> Dict[str, Any]:
        """Run full evaluation on dataset."""
        results = []

        for example in dataset.examples:
            start = time.time()

            # Run RAG
            retrieved = self.rag.query(example.question, n_results=5)
            answer = self.rag.generate_response(example.question)

            latency = (time.time() - start) * 1000

            # Evaluate retrieval
            retrieved_ids = [r['id'] for r in retrieved]
            relevant_set = set(example.relevant_docs)

            retrieval_metrics = {
                'precision@5': precision_at_k(retrieved_ids, relevant_set, 5),
                'recall@5': recall_at_k(retrieved_ids, relevant_set, 5),
                'mrr': mean_reciprocal_rank(retrieved_ids, relevant_set)
            }

            # Evaluate generation
            relevance = self.judge.evaluate_relevance(example.question, answer)
            correctness = self.judge.evaluate_correctness(
                example.question,
                example.expected_answer,
                answer
            )

            generation_metrics = {
                'relevance': relevance['rating'],
                'correctness': correctness['rating']
            }

            results.append(EvalResult(
                example_id=example.id,
                retrieval_metrics=retrieval_metrics,
                generation_metrics=generation_metrics,
                latency_ms=latency,
                retrieved_docs=retrieved_ids,
                generated_answer=answer
            ))

        # Aggregate results
        return self._aggregate_results(results)

    def _aggregate_results(self, results: List[EvalResult]) -> Dict[str, Any]:
        """Aggregate individual results into summary."""
        summary = {
            'retrieval': {},
            'generation': {},
            'latency': {
                'mean_ms': sum(r.latency_ms for r in results) / len(results),
                'p50_ms': sorted([r.latency_ms for r in results])[len(results)//2],
                'p95_ms': sorted([r.latency_ms for r in results])[int(len(results)*0.95)]
            },
            'n_examples': len(results)
        }

        # Average retrieval metrics
        for metric in ['precision@5', 'recall@5', 'mrr']:
            values = [r.retrieval_metrics[metric] for r in results]
            summary['retrieval'][metric] = sum(values) / len(values)

        # Average generation metrics
        for metric in ['relevance', 'correctness']:
            values = [r.generation_metrics[metric] for r in results if r.generation_metrics[metric]]
            summary['generation'][metric] = sum(values) / len(values) if values else None

        return summary
```

---

<a name="observability"></a>
## 6. Debugging & Observability (45 min)

### 6.1 Tracing AI Systems

```
┌─────────────────────────────────────────────────────────────────┐
│                    RAG Request Trace                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Request ID: req_abc123                                         │
│  Timestamp: 2024-01-15T10:30:00Z                                │
│  Duration: 1,234ms                                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. Query Processing (50ms)                               │   │
│  │    Input: "How do I configure auth?"                     │   │
│  │    Transformed: "authentication configuration setup"     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 2. Embedding (120ms)                                     │   │
│  │    Model: text-embedding-3-small                         │   │
│  │    Tokens: 8                                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 3. Retrieval (80ms)                                      │   │
│  │    Retrieved: 5 documents                                │   │
│  │    Top score: 0.89, Lowest: 0.71                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 4. Generation (980ms)                                    │   │
│  │    Model: claude-3-5-sonnet                              │   │
│  │    Input tokens: 2,400                                   │   │
│  │    Output tokens: 350                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Logging Implementation

```python
# observability/logging.py
"""Structured logging for RAG systems."""
import logging
import json
import time
from contextlib import contextmanager
from typing import Any, Dict
from dataclasses import dataclass, field
from uuid import uuid4

@dataclass
class RequestContext:
    """Context for a single request."""
    request_id: str = field(default_factory=lambda: str(uuid4()))
    spans: list = field(default_factory=list)
    metadata: dict = field(default_factory=dict)
    start_time: float = field(default_factory=time.time)

class RAGLogger:
    """Structured logger for RAG systems."""

    def __init__(self, service_name: str = "rag"):
        self.service = service_name
        self.logger = logging.getLogger(service_name)
        self._context = None

    def start_request(self, query: str, metadata: Dict = None) -> RequestContext:
        """Start tracking a new request."""
        self._context = RequestContext(
            metadata=metadata or {}
        )
        self.log_event("request_start", {"query": query})
        return self._context

    def end_request(self, result: Any = None, error: str = None):
        """End request tracking."""
        duration = time.time() - self._context.start_time
        self.log_event("request_end", {
            "duration_ms": duration * 1000,
            "success": error is None,
            "error": error
        })
        self._context = None

    @contextmanager
    def span(self, name: str):
        """Track a span within a request."""
        start = time.time()
        span_data = {"name": name, "start": start}

        try:
            yield span_data
            span_data["success"] = True
        except Exception as e:
            span_data["success"] = False
            span_data["error"] = str(e)
            raise
        finally:
            span_data["duration_ms"] = (time.time() - start) * 1000
            self._context.spans.append(span_data)
            self.log_event("span_complete", span_data)

    def log_event(self, event_type: str, data: Dict):
        """Log a structured event."""
        log_data = {
            "service": self.service,
            "event": event_type,
            "request_id": self._context.request_id if self._context else None,
            "timestamp": time.time(),
            **data
        }
        self.logger.info(json.dumps(log_data))

    def log_retrieval(self, query: str, results: list, scores: list):
        """Log retrieval results."""
        self.log_event("retrieval", {
            "query": query,
            "num_results": len(results),
            "top_score": max(scores) if scores else None,
            "min_score": min(scores) if scores else None,
            "result_ids": [r.get('id') for r in results]
        })

    def log_generation(
        self,
        model: str,
        input_tokens: int,
        output_tokens: int,
        latency_ms: float
    ):
        """Log generation details."""
        self.log_event("generation", {
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "latency_ms": latency_ms
        })

# Usage
logger = RAGLogger()

def process_rag_query(query: str):
    ctx = logger.start_request(query)

    try:
        with logger.span("embedding"):
            embedding = get_embedding(query)

        with logger.span("retrieval"):
            results = vector_store.query(embedding, k=5)
            logger.log_retrieval(query, results, [r['score'] for r in results])

        with logger.span("generation"):
            response = llm.generate(query, results)
            logger.log_generation("claude-3-5-sonnet", 2400, 350, 980)

        logger.end_request(result=response)
        return response

    except Exception as e:
        logger.end_request(error=str(e))
        raise
```

### 6.3 Cost Monitoring

```python
# observability/cost.py
"""Track and monitor LLM costs."""
from dataclasses import dataclass
from typing import Dict
from datetime import datetime, timedelta

# Pricing per 1M tokens (as of 2024)
PRICING = {
    "gpt-4o": {"input": 5.0, "output": 15.0},
    "gpt-4-turbo": {"input": 10.0, "output": 30.0},
    "claude-3-5-sonnet": {"input": 3.0, "output": 15.0},
    "claude-3-opus": {"input": 15.0, "output": 75.0},
    "text-embedding-3-small": {"input": 0.02, "output": 0.0},
    "text-embedding-3-large": {"input": 0.13, "output": 0.0},
}

@dataclass
class Usage:
    """Token usage record."""
    model: str
    input_tokens: int
    output_tokens: int
    timestamp: datetime
    request_id: str = None

class CostTracker:
    """Track and monitor LLM costs."""

    def __init__(self):
        self.usage_history: list[Usage] = []
        self.daily_budget: float = 100.0  # Default daily budget

    def record_usage(self, usage: Usage):
        """Record token usage."""
        self.usage_history.append(usage)

    def calculate_cost(self, usage: Usage) -> float:
        """Calculate cost for a usage record."""
        if usage.model not in PRICING:
            return 0.0

        pricing = PRICING[usage.model]
        input_cost = (usage.input_tokens / 1_000_000) * pricing["input"]
        output_cost = (usage.output_tokens / 1_000_000) * pricing["output"]
        return input_cost + output_cost

    def get_daily_cost(self, date: datetime = None) -> float:
        """Get total cost for a specific day."""
        if date is None:
            date = datetime.now()

        day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        return sum(
            self.calculate_cost(u)
            for u in self.usage_history
            if day_start <= u.timestamp < day_end
        )

    def get_budget_status(self) -> Dict:
        """Get current budget status."""
        daily_cost = self.get_daily_cost()
        return {
            "daily_budget": self.daily_budget,
            "daily_spent": daily_cost,
            "daily_remaining": self.daily_budget - daily_cost,
            "percentage_used": (daily_cost / self.daily_budget) * 100,
            "alert": daily_cost > self.daily_budget * 0.8
        }

    def get_cost_breakdown(self, days: int = 7) -> Dict:
        """Get cost breakdown by model over time."""
        cutoff = datetime.now() - timedelta(days=days)
        recent = [u for u in self.usage_history if u.timestamp > cutoff]

        breakdown = {}
        for usage in recent:
            if usage.model not in breakdown:
                breakdown[usage.model] = {
                    "total_cost": 0,
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "request_count": 0
                }
            breakdown[usage.model]["total_cost"] += self.calculate_cost(usage)
            breakdown[usage.model]["input_tokens"] += usage.input_tokens
            breakdown[usage.model]["output_tokens"] += usage.output_tokens
            breakdown[usage.model]["request_count"] += 1

        return breakdown
```

### 6.4 Common Debugging Patterns

```markdown
## RAG Debugging Playbook

### Symptom: Wrong answers
1. Check retrieved documents
   - Are relevant docs being retrieved?
   - What are the similarity scores?
2. Check if answer is in retrieved docs
3. Examine prompt construction
4. Test with fewer/more retrieved docs

### Symptom: "I don't know" when answer exists
1. Check embeddings
   - Is query being embedded correctly?
   - Test with exact phrase from document
2. Check chunk boundaries
   - Is answer split across chunks?
3. Try query reformulation
4. Check similarity threshold

### Symptom: Slow responses
1. Profile each stage
   - Embedding time
   - Retrieval time
   - Generation time
2. Check index size and configuration
3. Consider caching strategies
4. Evaluate model choice

### Symptom: High costs
1. Review model selection
   - Using expensive model for simple tasks?
2. Check context sizes
   - Sending too much context?
3. Implement caching
4. Consider local embeddings
```

---

<a name="lab-04"></a>
## 7. Lab 04: Build & Evaluate RAG System (1h 45min)

### Lab Overview

**Goal:** Build a complete RAG system with evaluation for querying a codebase.

**The system will:**
1. Index Python/TypeScript source files
2. Support semantic code search
3. Answer questions about the code
4. Include evaluation metrics

### Lab Instructions

Navigate to `labs/lab04-rag-system/` and follow the README.

**Quick Start:**
```bash
cd labs/lab04-rag-system
cat README.md
# Follow steps to build the RAG system
```

### Expected Outcome

By the end of this lab, you should have:
1. A working code RAG system
2. Evaluation dataset and metrics
3. Observability/logging setup
4. Deployment to Railway

---

## Day 4 Summary

### What We Covered
1. **RAG Fundamentals**: Embeddings, vector stores, retrieval
2. **Chunking Strategies**: Fixed, semantic, code-aware
3. **RAG Pitfalls**: Common failures and solutions
4. **Evaluation**: Retrieval metrics, LLM-as-judge, datasets
5. **Observability**: Logging, tracing, cost monitoring

### Key Takeaways
- RAG grounds LLM responses in specific data
- Chunking strategy significantly impacts quality
- Hybrid search often outperforms pure vector search
- Evaluation is essential—don't ship without it
- Monitor costs and latency in production

### Resources You Should Have
- [ ] RAG architecture diagram
- [ ] Chunking strategy comparison
- [ ] Evaluation dataset (10+ examples)
- [ ] Logging/tracing setup

### Preparation for Day 5
- Think about production concerns (security, scaling)
- Review all labs—capstone builds on everything
- Consider which capstone option interests you

---

**Navigation**: [← Day 3](./DAY3-AGENTS.md) | [Day 5: Production & Capstone →](./DAY5-PRODUCTION-CAPSTONE.md)
