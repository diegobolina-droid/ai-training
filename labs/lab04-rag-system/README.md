# Lab 04: RAG System with Evaluation

## Objective
Build a complete RAG system for querying a codebase, including proper evaluation.

**Time Allotted**: 1 hour 45 minutes

## Learning Goals
- Implement a RAG pipeline from scratch
- Use appropriate chunking for code
- Build an evaluation framework
- Understand retrieval metrics

---

## What You'll Build

A codebase Q&A system that:
1. Indexes code files with embeddings
2. Retrieves relevant code for questions
3. Generates answers grounded in code
4. Evaluates retrieval and generation quality

```
┌─────────────────────────────────────────────────────────────┐
│                    Codebase RAG System                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  INDEXING                                                   │
│  ────────                                                   │
│  Code Files → Chunk → Embed → Store (ChromaDB)              │
│                                                             │
│  QUERYING                                                   │
│  ────────                                                   │
│  Question → Embed → Search → Retrieve → Generate Answer     │
│                                                             │
│  EVALUATION                                                 │
│  ──────────                                                 │
│  Test Questions → RAG → Compare to Ground Truth → Metrics   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Instructions

### Step 1: Set Up ChromaDB (10 min)

```python
# rag/vector_store.py
import chromadb
from chromadb.utils import embedding_functions
from typing import List, Dict, Any
import os

class CodebaseVectorStore:
    def __init__(
        self,
        collection_name: str = "codebase",
        persist_directory: str = "./chroma_db"
    ):
        # Initialize ChromaDB with persistence
        self.client = chromadb.PersistentClient(path=persist_directory)

        # Use OpenAI embeddings (you can swap for others)
        self.embedding_fn = embedding_functions.OpenAIEmbeddingFunction(
            api_key=os.getenv("OPENAI_API_KEY"),
            model_name="text-embedding-3-small"
        )

        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"}
        )

    def add_documents(
        self,
        documents: List[str],
        metadatas: List[Dict[str, Any]],
        ids: List[str]
    ):
        """Add documents to the vector store."""
        self.collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )

    def query(
        self,
        query: str,
        n_results: int = 5,
        where: Dict = None
    ) -> List[Dict]:
        """Query the vector store."""
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results,
            where=where
        )

        formatted = []
        for i in range(len(results['documents'][0])):
            formatted.append({
                'content': results['documents'][0][i],
                'metadata': results['metadatas'][0][i],
                'distance': results['distances'][0][i],
                'id': results['ids'][0][i]
            })

        return formatted

    def get_stats(self) -> Dict:
        """Get collection statistics."""
        return {
            "count": self.collection.count(),
            "name": self.collection.name
        }
```

### Step 2: Implement Code Chunking (20 min)

```python
# rag/chunker.py
import re
from typing import List, Dict, Tuple
from dataclasses import dataclass

@dataclass
class CodeChunk:
    content: str
    metadata: Dict
    chunk_id: str

class CodeChunker:
    """Chunk code files intelligently."""

    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 100
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_file(
        self,
        content: str,
        filename: str,
        language: str = None
    ) -> List[CodeChunk]:
        """Chunk a code file."""
        if language is None:
            language = self._detect_language(filename)

        if language == "python":
            return self._chunk_python(content, filename)
        else:
            return self._chunk_generic(content, filename, language)

    def _chunk_python(self, content: str, filename: str) -> List[CodeChunk]:
        """Chunk Python code by logical units."""
        chunks = []

        # Split by function/class definitions
        pattern = r'((?:^@\w+.*\n)*^(?:def|class|async def)\s+\w+[^:]*:.*?)(?=\n(?:@|\s*def|\s*class|\s*async def)|\Z)'
        matches = list(re.finditer(pattern, content, re.MULTILINE | re.DOTALL))

        if matches:
            # Add imports and module-level code first
            first_match_start = matches[0].start()
            if first_match_start > 0:
                header = content[:first_match_start].strip()
                if header:
                    chunks.append(CodeChunk(
                        content=header,
                        metadata={
                            "filename": filename,
                            "language": "python",
                            "type": "header",
                            "line_start": 1
                        },
                        chunk_id=f"{filename}:header"
                    ))

            # Add each function/class
            for i, match in enumerate(matches):
                chunk_content = match.group(1).strip()
                line_start = content[:match.start()].count('\n') + 1

                # Extract name
                name_match = re.search(r'(?:def|class|async def)\s+(\w+)', chunk_content)
                name = name_match.group(1) if name_match else f"block_{i}"

                chunks.append(CodeChunk(
                    content=chunk_content,
                    metadata={
                        "filename": filename,
                        "language": "python",
                        "type": "class" if "class " in chunk_content else "function",
                        "name": name,
                        "line_start": line_start
                    },
                    chunk_id=f"{filename}:{name}"
                ))
        else:
            # Fall back to generic chunking
            return self._chunk_generic(content, filename, "python")

        return chunks

    def _chunk_generic(
        self,
        content: str,
        filename: str,
        language: str
    ) -> List[CodeChunk]:
        """Generic chunking by size with overlap."""
        chunks = []
        lines = content.split('\n')

        current_chunk = []
        current_size = 0
        chunk_start = 1

        for i, line in enumerate(lines):
            line_size = len(line) + 1  # +1 for newline

            if current_size + line_size > self.chunk_size and current_chunk:
                # Save current chunk
                chunk_content = '\n'.join(current_chunk)
                chunks.append(CodeChunk(
                    content=chunk_content,
                    metadata={
                        "filename": filename,
                        "language": language,
                        "type": "block",
                        "line_start": chunk_start,
                        "line_end": chunk_start + len(current_chunk) - 1
                    },
                    chunk_id=f"{filename}:lines_{chunk_start}"
                ))

                # Keep overlap
                overlap_lines = int(self.chunk_overlap / 50)  # Approximate lines
                current_chunk = current_chunk[-overlap_lines:] if overlap_lines > 0 else []
                current_size = sum(len(l) + 1 for l in current_chunk)
                chunk_start = i + 1 - len(current_chunk)

            current_chunk.append(line)
            current_size += line_size

        # Don't forget last chunk
        if current_chunk:
            chunk_content = '\n'.join(current_chunk)
            chunks.append(CodeChunk(
                content=chunk_content,
                metadata={
                    "filename": filename,
                    "language": language,
                    "type": "block",
                    "line_start": chunk_start
                },
                chunk_id=f"{filename}:lines_{chunk_start}"
            ))

        return chunks

    def _detect_language(self, filename: str) -> str:
        """Detect language from filename."""
        ext_map = {
            '.py': 'python',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.java': 'java',
            '.go': 'go',
            '.rs': 'rust',
            '.rb': 'ruby',
        }
        for ext, lang in ext_map.items():
            if filename.endswith(ext):
                return lang
        return 'unknown'
```

### Step 3: Build the RAG Pipeline (20 min)

```python
# rag/pipeline.py
from typing import List, Dict, Any
from vector_store import CodebaseVectorStore
from chunker import CodeChunker
import os

RAG_SYSTEM_PROMPT = """You are a helpful assistant that answers questions about code.
Use the provided code context to answer questions accurately.
If the context doesn't contain enough information, say so.
Always reference specific files and line numbers when possible."""

RAG_USER_PROMPT = """Based on the following code context, answer the question.

Context:
{context}

Question: {question}

Provide a clear, accurate answer based on the code context above."""

class CodebaseRAG:
    def __init__(
        self,
        llm_client,
        collection_name: str = "codebase"
    ):
        self.llm = llm_client
        self.vector_store = CodebaseVectorStore(collection_name)
        self.chunker = CodeChunker()

    def index_directory(self, directory: str, extensions: List[str] = None):
        """Index all code files in a directory."""
        if extensions is None:
            extensions = ['.py', '.js', '.ts', '.java', '.go']

        documents = []
        metadatas = []
        ids = []

        for root, dirs, files in os.walk(directory):
            # Skip common non-code directories
            dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', '__pycache__', '.venv']]

            for file in files:
                if any(file.endswith(ext) for ext in extensions):
                    filepath = os.path.join(root, file)
                    relative_path = os.path.relpath(filepath, directory)

                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            content = f.read()

                        chunks = self.chunker.chunk_file(content, relative_path)

                        for chunk in chunks:
                            documents.append(chunk.content)
                            metadatas.append(chunk.metadata)
                            ids.append(chunk.chunk_id)

                    except Exception as e:
                        print(f"Error processing {filepath}: {e}")

        if documents:
            self.vector_store.add_documents(documents, metadatas, ids)
            print(f"Indexed {len(documents)} chunks from {directory}")

        return len(documents)

    def query(
        self,
        question: str,
        n_results: int = 5,
        filter_language: str = None
    ) -> Dict[str, Any]:
        """Query the codebase and generate an answer."""
        # Build filter
        where = {"language": filter_language} if filter_language else None

        # Retrieve relevant chunks
        results = self.vector_store.query(question, n_results, where)

        # Build context
        context = self._build_context(results)

        # Generate answer
        prompt = RAG_USER_PROMPT.format(context=context, question=question)

        response = self.llm.chat([
            {"role": "system", "content": RAG_SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ])

        return {
            "answer": response,
            "sources": [
                {
                    "file": r['metadata']['filename'],
                    "type": r['metadata'].get('type'),
                    "name": r['metadata'].get('name'),
                    "line": r['metadata'].get('line_start'),
                    "relevance": 1 - r['distance']  # Convert distance to similarity
                }
                for r in results
            ],
            "context_used": context
        }

    def _build_context(self, results: List[Dict]) -> str:
        """Build context string from retrieved results."""
        context_parts = []

        for r in results:
            metadata = r['metadata']
            header = f"File: {metadata['filename']}"
            if metadata.get('name'):
                header += f" | {metadata.get('type', 'block')}: {metadata['name']}"
            if metadata.get('line_start'):
                header += f" | Line: {metadata['line_start']}"

            context_parts.append(f"--- {header} ---\n{r['content']}")

        return "\n\n".join(context_parts)
```

### Step 4: Implement Evaluation (25 min)

```python
# rag/evaluation.py
from typing import List, Dict, Set
from dataclasses import dataclass
import json

@dataclass
class EvalExample:
    question: str
    expected_answer: str
    relevant_files: List[str]

def precision_at_k(retrieved: List[str], relevant: Set[str], k: int) -> float:
    """Precision@K: fraction of retrieved docs that are relevant."""
    retrieved_k = retrieved[:k]
    relevant_retrieved = len(set(retrieved_k) & relevant)
    return relevant_retrieved / k if k > 0 else 0.0

def recall_at_k(retrieved: List[str], relevant: Set[str], k: int) -> float:
    """Recall@K: fraction of relevant docs that were retrieved."""
    retrieved_k = retrieved[:k]
    relevant_retrieved = len(set(retrieved_k) & relevant)
    return relevant_retrieved / len(relevant) if relevant else 0.0

def mrr(retrieved: List[str], relevant: Set[str]) -> float:
    """Mean Reciprocal Rank: how high is the first relevant result."""
    for i, doc in enumerate(retrieved):
        if doc in relevant:
            return 1.0 / (i + 1)
    return 0.0

class RAGEvaluator:
    def __init__(self, rag_system, llm_judge=None):
        self.rag = rag_system
        self.judge = llm_judge

    def evaluate_retrieval(
        self,
        examples: List[EvalExample],
        k: int = 5
    ) -> Dict:
        """Evaluate retrieval quality."""
        metrics = {
            'precision': [],
            'recall': [],
            'mrr': []
        }

        for example in examples:
            # Query RAG
            result = self.rag.query(example.question, n_results=k)

            # Get retrieved file names
            retrieved = [s['file'] for s in result['sources']]
            relevant = set(example.relevant_files)

            metrics['precision'].append(precision_at_k(retrieved, relevant, k))
            metrics['recall'].append(recall_at_k(retrieved, relevant, k))
            metrics['mrr'].append(mrr(retrieved, relevant))

        return {
            f'precision@{k}': sum(metrics['precision']) / len(metrics['precision']),
            f'recall@{k}': sum(metrics['recall']) / len(metrics['recall']),
            'mrr': sum(metrics['mrr']) / len(metrics['mrr']),
            'n_examples': len(examples)
        }

    def evaluate_generation(
        self,
        examples: List[EvalExample]
    ) -> Dict:
        """Evaluate generation quality using LLM-as-judge."""
        if not self.judge:
            return {"error": "No LLM judge configured"}

        scores = {
            'relevance': [],
            'accuracy': [],
            'completeness': []
        }

        for example in examples:
            result = self.rag.query(example.question)
            generated = result['answer']

            # Judge relevance
            relevance = self._judge_relevance(
                example.question,
                generated
            )
            scores['relevance'].append(relevance)

            # Judge accuracy
            accuracy = self._judge_accuracy(
                example.question,
                example.expected_answer,
                generated
            )
            scores['accuracy'].append(accuracy)

        return {
            'relevance': sum(scores['relevance']) / len(scores['relevance']),
            'accuracy': sum(scores['accuracy']) / len(scores['accuracy']),
            'n_examples': len(examples)
        }

    def _judge_relevance(self, question: str, answer: str) -> float:
        """Judge if answer is relevant to question."""
        prompt = f"""Rate how relevant this answer is to the question.

Question: {question}
Answer: {answer}

Rate from 1-5 (5 being most relevant).
Return only the number."""

        response = self.judge.chat([{"role": "user", "content": prompt}])
        try:
            return float(response.strip()) / 5.0
        except:
            return 0.5

    def _judge_accuracy(
        self,
        question: str,
        expected: str,
        generated: str
    ) -> float:
        """Judge if answer matches expected answer."""
        prompt = f"""Compare these two answers to the same question.

Question: {question}
Expected Answer: {expected}
Generated Answer: {generated}

How well does the generated answer match the expected answer?
Rate from 1-5 (5 being perfect match).
Return only the number."""

        response = self.judge.chat([{"role": "user", "content": prompt}])
        try:
            return float(response.strip()) / 5.0
        except:
            return 0.5

def create_eval_dataset(examples: List[Dict]) -> List[EvalExample]:
    """Create evaluation dataset from list of dicts."""
    return [
        EvalExample(
            question=ex['question'],
            expected_answer=ex['expected_answer'],
            relevant_files=ex['relevant_files']
        )
        for ex in examples
    ]
```

### Step 5: Build the API (10 min)

```python
# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from rag.pipeline import CodebaseRAG
from rag.evaluation import RAGEvaluator, create_eval_dataset
from llm_client import get_llm_client

app = FastAPI(title="Codebase RAG System")

# Initialize RAG
llm = get_llm_client("anthropic")
rag = CodebaseRAG(llm)

class QueryRequest(BaseModel):
    question: str
    n_results: int = 5
    filter_language: Optional[str] = None

class IndexRequest(BaseModel):
    directory: str
    extensions: Optional[List[str]] = None

class EvalRequest(BaseModel):
    examples: List[Dict]

@app.post("/index")
async def index_codebase(request: IndexRequest):
    """Index a codebase directory."""
    count = rag.index_directory(request.directory, request.extensions)
    return {"indexed_chunks": count}

@app.post("/query")
async def query_codebase(request: QueryRequest):
    """Query the codebase."""
    result = rag.query(
        request.question,
        request.n_results,
        request.filter_language
    )
    return result

@app.post("/evaluate")
async def evaluate_rag(request: EvalRequest):
    """Evaluate RAG performance."""
    examples = create_eval_dataset(request.examples)
    evaluator = RAGEvaluator(rag, llm)

    retrieval_metrics = evaluator.evaluate_retrieval(examples)
    generation_metrics = evaluator.evaluate_generation(examples)

    return {
        "retrieval": retrieval_metrics,
        "generation": generation_metrics
    }

@app.get("/stats")
async def get_stats():
    """Get index statistics."""
    return rag.vector_store.get_stats()

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

### Step 6: Test and Deploy (15 min)

```bash
# Index a sample codebase
curl -X POST http://localhost:8000/index \
  -H "Content-Type: application/json" \
  -d '{"directory": "./sample_code"}'

# Query
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "How does authentication work?"}'

# Evaluate
curl -X POST http://localhost:8000/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "examples": [
      {
        "question": "What does the login function do?",
        "expected_answer": "Validates credentials and creates session",
        "relevant_files": ["auth/login.py"]
      }
    ]
  }'

# Deploy
railway up
```

---

## Deliverables

- [ ] Working RAG system with code indexing
- [ ] Smart code-aware chunking
- [ ] Evaluation framework with retrieval metrics
- [ ] LLM-as-judge generation evaluation
- [ ] Deployed to Railway
- [ ] Evaluation dataset (10+ examples)

---

## Extension Challenges

1. **Hybrid Search**: Add BM25 keyword search alongside vector search
2. **Reranking**: Add a reranking step to improve retrieval
3. **Caching**: Cache embeddings and query results
4. **Multiple Codebases**: Support querying across multiple indexed repos

---

**Next**: [Lab 05 - Multi-Agent Orchestration](../lab05-multi-agent/)
