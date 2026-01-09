# Exercise 02: Hallucination Detector

## Descripción

Construye un sistema para detectar y medir alucinaciones en outputs de LLMs. Las alucinaciones son uno de los problemas más críticos en producción, y esta herramienta te permitirá identificarlas, medirlas y mitigarlas.

## Objetivos de Aprendizaje

Al completar este ejercicio, podrás:

- ✅ Identificar diferentes tipos de alucinaciones
- ✅ Implementar técnicas de detección automática
- ✅ Usar LLMs como evaluadores (LLM-as-judge)
- ✅ Crear métricas de confidence/fidelity
- ✅ Diseñar prompts anti-alucinación

## Pre-requisitos

- Completar Day 1-2 del programa principal
- Entender conceptos de hallucination
- Familiaridad con prompt engineering
- API key de al menos un LLM provider

## Tipos de Alucinaciones a Detectar

### 1. Factual Hallucinations
- Información falsa presentada como verdadera
- Fechas, números, nombres incorrectos
- Eventos que no ocurrieron

### 2. Contextual Hallucinations
- Información no presente en el contexto
- Inferencias incorrectas
- Extrapolaciones sin base

### 3. Consistency Hallucinations
- Contradicciones internas
- Información inconsistente
- Cambios de hechos durante conversación

## Características Requeridas

### Core Features

1. **Hallucination Detection**
   ```typescript
   interface HallucinationDetection {
     isHallucinated: boolean;
     confidence: number; // 0-1
     type: 'factual' | 'contextual' | 'consistency';
     evidence: string[];
     suggestions: string[];
   }
   ```

2. **Multiple Detection Methods**
   - Self-consistency checking
   - External fact verification (optional)
   - Confidence score analysis
   - Citation checking

3. **Scoring System**
   - Hallucination severity score (0-10)
   - Confidence score
   - Reliability rating

4. **Mitigation Strategies**
   - Suggest prompt improvements
   - Recommend verification steps
   - Generate safer alternatives

### Advanced Features (Optional)

- 🔥 Integration con fact-checking APIs
- 🔥 Historical tracking de hallucination rates
- 🔥 A/B testing de prompts anti-hallucination
- 🔥 Real-time detection en streaming responses

## Stack Tecnológico Sugerido

### Backend

```python
# Python es ideal para este proyecto
- fastapi
- anthropic / openai
- pydantic
- numpy (para scoring)
- httpx (para fact-checking APIs opcional)
```

### Frontend (Opcional)

```typescript
- next.js / streamlit
- react-markdown
- recharts (para visualización)
```

## Guía de Implementación

### Paso 1: Setup del Proyecto

```bash
mkdir hallucination-detector
cd hallucination-detector
python -m venv venv
source venv/bin/activate
pip install fastapi anthropic pydantic uvicorn pytest
```

### Paso 2: Definir Modelos de Datos

**Archivo: `models.py`**

```python
from pydantic import BaseModel, Field
from typing import List, Literal
from enum import Enum

class HallucinationType(str, Enum):
    FACTUAL = "factual"
    CONTEXTUAL = "contextual"
    CONSISTENCY = "consistency"

class HallucinationResult(BaseModel):
    is_hallucinated: bool
    confidence: float = Field(ge=0, le=1)
    hallucination_type: HallucinationType | None
    evidence: List[str]
    severity: int = Field(ge=0, le=10)
    suggestions: List[str]

class DetectionRequest(BaseModel):
    text: str
    context: str | None = None
    previous_responses: List[str] = []
    detection_method: str = "self-consistency"
```

**Tareas**:
- [ ] Definir todos los modelos necesarios
- [ ] Agregar validaciones con Pydantic
- [ ] Documentar cada campo

### Paso 3: Implementar Self-Consistency Checking

**Archivo: `detectors/self_consistency.py`**

```python
import anthropic
from typing import List

class SelfConsistencyDetector:
    """
    Genera múltiples respuestas y compara consistencia
    """

    def __init__(self, client: anthropic.Client):
        self.client = client

    async def detect(
        self,
        prompt: str,
        num_samples: int = 5
    ) -> HallucinationResult:
        # 1. Generar N respuestas con temperatura > 0
        responses = await self._generate_multiple(prompt, num_samples)

        # 2. Comparar respuestas entre sí
        consistency_score = self._calculate_consistency(responses)

        # 3. Identificar inconsistencias
        inconsistencies = self._find_inconsistencies(responses)

        # 4. Generar resultado
        return HallucinationResult(
            is_hallucinated=consistency_score < 0.7,
            confidence=consistency_score,
            hallucination_type=HallucinationType.CONSISTENCY,
            evidence=inconsistencies,
            severity=self._calculate_severity(consistency_score),
            suggestions=self._generate_suggestions(inconsistencies)
        )

    async def _generate_multiple(
        self,
        prompt: str,
        num_samples: int
    ) -> List[str]:
        # Generar múltiples respuestas con temperatura
        # Implementar aquí
        pass

    def _calculate_consistency(self, responses: List[str]) -> float:
        # Calcular similitud semántica entre respuestas
        # Usar embeddings o comparación textual
        # Retornar score 0-1
        pass

    def _find_inconsistencies(self, responses: List[str]) -> List[str]:
        # Identificar partes que difieren entre respuestas
        # Estas son potenciales alucinaciones
        pass
```

**Tareas**:
- [ ] Implementar generación de múltiples respuestas
- [ ] Calcular similitud semántica (cosine similarity)
- [ ] Identificar inconsistencias específicas
- [ ] Generar sugerencias de mejora

### Paso 4: Implementar LLM-as-Judge

**Archivo: `detectors/llm_judge.py`**

```python
class LLMJudgeDetector:
    """
    Usa un LLM para evaluar si otro LLM está alucinando
    """

    JUDGE_PROMPT = """
You are an expert fact-checker. Analyze the following response and determine if it contains hallucinations.

Context (ground truth):
{context}

Response to evaluate:
{response}

Evaluate for:
1. Factual accuracy
2. Information not supported by context
3. Internal contradictions

Respond in JSON format:
{{
  "is_hallucinated": boolean,
  "confidence": 0-1,
  "hallucination_type": "factual|contextual|consistency|none",
  "evidence": ["specific examples"],
  "severity": 0-10,
  "suggestions": ["how to fix"]
}}
"""

    async def detect(
        self,
        response: str,
        context: str | None = None
    ) -> HallucinationResult:
        # 1. Construir prompt de evaluación
        prompt = self.JUDGE_PROMPT.format(
            context=context or "No context provided",
            response=response
        )

        # 2. Llamar a LLM judge
        judgment = await self._get_judgment(prompt)

        # 3. Parsear respuesta JSON
        result = self._parse_judgment(judgment)

        return result
```

**Tareas**:
- [ ] Diseñar prompt de judge efectivo
- [ ] Implementar parsing de JSON response
- [ ] Manejar errores de parsing
- [ ] Validar resultados

### Paso 5: Implementar Citation Checking

**Archivo: `detectors/citation_checker.py`**

```python
class CitationChecker:
    """
    Verifica que las claims estén soportadas por citas/context
    """

    async def detect(
        self,
        response: str,
        context: str
    ) -> HallucinationResult:
        # 1. Extraer claims del response
        claims = await self._extract_claims(response)

        # 2. Para cada claim, verificar si está en context
        unsupported = []
        for claim in claims:
            is_supported = await self._verify_claim(claim, context)
            if not is_supported:
                unsupported.append(claim)

        # 3. Calcular score basado en % de claims no soportadas
        hallucination_rate = len(unsupported) / len(claims)

        return HallucinationResult(
            is_hallucinated=hallucination_rate > 0.2,
            confidence=1.0 - hallucination_rate,
            hallucination_type=HallucinationType.CONTEXTUAL,
            evidence=unsupported,
            severity=int(hallucination_rate * 10),
            suggestions=self._generate_suggestions(unsupported)
        )

    async def _extract_claims(self, text: str) -> List[str]:
        # Usar LLM para extraer claims individuales
        pass

    async def _verify_claim(self, claim: str, context: str) -> bool:
        # Verificar si claim está soportado por context
        # Usar embeddings similarity o LLM
        pass
```

**Tareas**:
- [ ] Implementar extracción de claims
- [ ] Verificar soporte en contexto
- [ ] Calcular métricas de fidelidad
- [ ] Generar evidencia específica

### Paso 6: Crear API Endpoints

**Archivo: `main.py`**

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Hallucination Detector API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/detect", response_model=HallucinationResult)
async def detect_hallucination(request: DetectionRequest):
    """
    Detecta alucinaciones usando el método especificado
    """
    detector = get_detector(request.detection_method)
    result = await detector.detect(
        text=request.text,
        context=request.context,
        previous_responses=request.previous_responses
    )
    return result

@app.post("/batch-detect")
async def batch_detect(requests: List[DetectionRequest]):
    """
    Detecta alucinaciones en múltiples textos
    """
    results = []
    for req in requests:
        result = await detect_hallucination(req)
        results.append(result)
    return results

@app.get("/methods")
async def list_methods():
    """
    Lista métodos de detección disponibles
    """
    return {
        "methods": [
            "self-consistency",
            "llm-judge",
            "citation-checking"
        ]
    }
```

**Tareas**:
- [ ] Implementar endpoints principales
- [ ] Agregar validación de inputs
- [ ] Manejar errores apropiadamente
- [ ] Documentar API con OpenAPI

### Paso 7: Testing & Validation

**Archivo: `tests/test_detectors.py`**

```python
import pytest
from detectors import SelfConsistencyDetector, LLMJudgeDetector

# Test cases con hallucinations conocidas
HALLUCINATED_EXAMPLES = [
    {
        "text": "Python was invented in 1985 by Guido van Rossum",
        "context": "Python was created in 1991",
        "expected": True  # Fecha incorrecta
    },
    {
        "text": "The capital of France is Paris",
        "context": "France is a country in Europe",
        "expected": False  # Correcto pero info adicional
    },
]

@pytest.mark.asyncio
async def test_factual_hallucination():
    detector = LLMJudgeDetector(client)

    result = await detector.detect(
        response="Python was invented in 1985",
        context="Python was created in 1991"
    )

    assert result.is_hallucinated == True
    assert result.hallucination_type == HallucinationType.FACTUAL
    assert result.severity > 5

@pytest.mark.asyncio
async def test_self_consistency():
    detector = SelfConsistencyDetector(client)

    result = await detector.detect(
        prompt="What is 2+2?",
        num_samples=5
    )

    # Matemática simple debe ser consistente
    assert result.confidence > 0.9
```

**Tareas**:
- [ ] Crear test suite completo
- [ ] Casos de true positives
- [ ] Casos de true negatives
- [ ] Edge cases

## Desafíos Extra

### 1. Real-Time Detection
Implementar detección en streaming responses:
```python
async def detect_streaming(stream):
    buffer = ""
    async for chunk in stream:
        buffer += chunk
        if should_check(buffer):
            result = await quick_check(buffer)
            if result.is_hallucinated:
                yield StopSignal()
```

### 2. Confidence Calibration
Calibrar scores de confidence con ground truth dataset

### 3. Prompt Library
Crear biblioteca de prompts anti-hallucination probados

### 4. Dashboard
Construir dashboard para visualizar hallucination rates

## Recursos

### Papers
- [Survey of Hallucination in NLP](https://arxiv.org/abs/2202.03629)
- [Self-Consistency Improves CoT](https://arxiv.org/abs/2203.11171)

### Datasets para Testing
- [TruthfulQA](https://github.com/sylinrl/TruthfulQA)
- [HaluEval](https://github.com/RUCAIBox/HaluEval)

### Herramientas
- [Langfuse (Tracing)](https://langfuse.com/)
- [Guardrails AI](https://github.com/guardrails-ai/guardrails)

## Rúbrica de Evaluación

| Criterio | Peso | Descripción |
|----------|------|-------------|
| **Detection Accuracy** | 35% | Precision/Recall en test set |
| **Multiple Methods** | 25% | Implementar 2+ métodos |
| **API Quality** | 20% | Endpoints bien diseñados |
| **Testing** | 15% | Tests comprehensivos |
| **Documentación** | 5% | README + código comentado |

**Puntuación mínima**: 70%

## Entrega

1. Código en GitHub
2. README con:
   - Explicación de cada método de detección
   - Resultados de evaluación (precision/recall)
   - Ejemplos de uso
3. API desplegada (Railway/Fly.io)
4. Test results (pytest output)

## Solución de Referencia

- [Ver solución →](./solution/)

---

**¡Buena suerte detectando alucinaciones! 🔍**
