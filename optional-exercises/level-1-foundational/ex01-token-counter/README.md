# Exercise 01: Token Counter & Cost Analyzer

## Descripción

Construye una herramienta interactiva para analizar tokens, estimar costos y comparar diferentes modelos LLM. Esta herramienta es esencial para cualquier desarrollador trabajando con APIs de LLM, ya que permite optimizar costos y entender el uso de recursos.

## Objetivos de Aprendizaje

Al completar este ejercicio, podrás:

- ✅ Entender cómo funcionan los tokenizers de diferentes providers
- ✅ Calcular costos precisos para llamadas a LLM APIs
- ✅ Comparar eficiencia de diferentes modelos
- ✅ Analizar distribución de tokens en prompts
- ✅ Optimizar prompts para reducir costos

## Pre-requisitos

- Completar Day 1-2 del programa principal
- Conocimientos básicos de React/Next.js o Streamlit
- API keys de OpenAI, Anthropic, Google (opcional)

## Características Requeridas

### Funcionalidad Core

1. **Token Counter**
   - Input: texto/prompt
   - Output: número de tokens por provider
   - Soporte para: GPT-4, Claude, Gemini

2. **Cost Calculator**
   - Calcular costo por prompt
   - Calcular costo por completion
   - Costo total estimado
   - Comparación entre modelos

3. **Batch Analysis**
   - Analizar múltiples prompts
   - Estadísticas agregadas
   - Export a CSV/JSON

4. **Visual Dashboard**
   - Gráfico de distribución de tokens
   - Comparación de costos entre modelos
   - Trend analysis (si se guarda historial)

### Funcionalidad Avanzada (Opcional)

- 🔥 Optimización de prompts sugerida
- 🔥 Alertas de costo (si excede threshold)
- 🔥 Historial de análisis
- 🔥 API endpoint para integración

## Stack Tecnológico Sugerido

### Opción A: Next.js + TypeScript (Recomendado)

```bash
# Dependencies
- next
- react
- tiktoken (OpenAI tokenizer)
- @anthropic-ai/tokenizer
- recharts (para gráficos)
- zustand (state management)
```

### Opción B: Python + Streamlit

```bash
# Dependencies
- streamlit
- tiktoken
- anthropic
- pandas
- plotly
```

### Opción C: Python + FastAPI + React

```bash
# Backend
- fastapi
- tiktoken
- anthropic

# Frontend
- vite + react
- recharts
```

## Guía de Implementación

### Paso 1: Setup del Proyecto

```bash
# Opción Next.js
npx create-next-app@latest token-analyzer --typescript
cd token-analyzer
npm install tiktoken @anthropic-ai/tokenizer recharts zustand
```

### Paso 2: Implementar Token Counting

**Archivo: `lib/tokenizers.ts`**

```typescript
import { encoding_for_model } from 'tiktoken';

export interface TokenCount {
  provider: string;
  model: string;
  tokens: number;
  cost: number;
}

export async function countTokens(
  text: string,
  model: string
): Promise<number> {
  // Implementar lógica de conteo por provider
  // OpenAI: usar tiktoken
  // Claude: usar @anthropic-ai/tokenizer
  // Gemini: aproximación
}
```

**Tareas**:
- [ ] Implementar conteo para GPT-4/GPT-3.5
- [ ] Implementar conteo para Claude (Sonnet, Opus, Haiku)
- [ ] Implementar conteo para Gemini (Pro, Flash)
- [ ] Crear función unificada `countAllTokens(text)`

### Paso 3: Implementar Cost Calculator

**Archivo: `lib/pricing.ts`**

```typescript
// Precios actualizados (Jan 2025)
export const MODEL_PRICING = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'claude-opus-4': { input: 0.015, output: 0.075 },
  'claude-sonnet-3.5': { input: 0.003, output: 0.015 },
  'claude-haiku-3': { input: 0.00025, output: 0.00125 },
  'gemini-pro': { input: 0.00025, output: 0.0005 },
};

export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): number {
  // Implementar cálculo de costo
  // Precio por 1M tokens
}
```

**Tareas**:
- [ ] Crear tabla de precios actualizada
- [ ] Implementar cálculo de costos
- [ ] Agregar soporte para batch discounts
- [ ] Crear comparador de costos entre modelos

### Paso 4: Crear UI Interactivo

**Componentes principales**:

1. `TextInput.tsx` - Input para texto/prompt
2. `TokenDisplay.tsx` - Mostrar resultados
3. `CostComparison.tsx` - Tabla comparativa
4. `TokenChart.tsx` - Visualización de distribución

**Tareas**:
- [ ] Crear input con syntax highlighting
- [ ] Mostrar tokens en tiempo real
- [ ] Tabla de comparación de modelos
- [ ] Gráfico de costos

### Paso 5: Agregar Análisis Batch

**Archivo: `components/BatchAnalyzer.tsx`**

```typescript
interface BatchAnalysis {
  totalTokens: number;
  averageTokens: number;
  totalCost: number;
  distribution: Record<string, number>;
}

export function BatchAnalyzer() {
  // Permitir upload de archivo CSV/JSON
  // Analizar múltiples prompts
  // Generar estadísticas
  // Export resultados
}
```

**Tareas**:
- [ ] Upload de archivos (CSV/JSON)
- [ ] Procesamiento batch
- [ ] Estadísticas agregadas
- [ ] Export de resultados

### Paso 6: Dashboard de Visualización

**Usar Recharts para crear**:

1. **Token Distribution Chart**
   - Pie chart de tokens por modelo

2. **Cost Comparison Bar Chart**
   - Comparar costos entre modelos

3. **Historical Trend** (Opcional)
   - Line chart de uso en el tiempo

**Tareas**:
- [ ] Implementar gráfico de distribución
- [ ] Implementar comparación de costos
- [ ] Agregar filtros interactivos
- [ ] Hacer responsive

## Testing

### Tests Unitarios

```typescript
// __tests__/tokenizers.test.ts
describe('Token Counting', () => {
  it('should count GPT-4 tokens correctly', () => {
    const text = "Hello, world!";
    const tokens = countTokens(text, 'gpt-4');
    expect(tokens).toBeGreaterThan(0);
  });

  it('should match across similar models', () => {
    const text = "Test prompt";
    const gpt4 = countTokens(text, 'gpt-4');
    const gpt35 = countTokens(text, 'gpt-3.5-turbo');
    expect(Math.abs(gpt4 - gpt35)).toBeLessThan(3);
  });
});
```

**Tareas**:
- [ ] Tests para cada tokenizer
- [ ] Tests para cálculo de costos
- [ ] Tests de comparación
- [ ] Tests de edge cases

### Tests de Integración

```typescript
// __tests__/e2e.test.ts
describe('Token Analyzer E2E', () => {
  it('should analyze text and show results', async () => {
    // Simular input de usuario
    // Verificar resultados
    // Verificar UI actualizado
  });
});
```

## Validación

Tu implementación debe:

✅ Contar tokens correctamente (±5% de oficial)
✅ Calcular costos precisos
✅ Comparar al menos 3 providers
✅ Tener UI responsivo y usable
✅ Incluir al menos 5 tests unitarios
✅ Funcionar con prompts de 1-10K tokens
✅ Exportar resultados a CSV/JSON

## Desafíos Extra

1. **Cache & Performance**
   - Cachear resultados de conteo
   - Optimizar para textos largos

2. **Real-time API Integration**
   - Conectar a APIs reales para validar
   - Mostrar precios actualizados

3. **Prompt Optimizer**
   - Sugerir formas de reducir tokens
   - Identificar redundancias

4. **Browser Extension**
   - Convertir en Chrome extension
   - Analizar prompts in-situ

## Recursos

### Documentación
- [Tiktoken (OpenAI)](https://github.com/openai/tiktoken)
- [Anthropic Tokenizer](https://docs.anthropic.com/claude/docs/models-overview#token-counting)
- [Google Gemini Tokens](https://ai.google.dev/gemini-api/docs/tokens)

### Ejemplos de Código
- [Next.js Token Counter Example](https://github.com/examples/token-counter)
- [Streamlit Cost Calculator](https://github.com/examples/cost-calc)

### Herramientas Similares (Inspiración)
- [OpenAI Tokenizer](https://platform.openai.com/tokenizer)
- [Anthropic Token Counter](https://docs.anthropic.com/claude/reference/token-counter)

## Rúbrica de Evaluación

| Criterio | Peso | Descripción |
|----------|------|-------------|
| **Funcionalidad Core** | 40% | Token counting + cost calculation |
| **Multi-Provider** | 20% | Soporte para 3+ providers |
| **UI/UX** | 15% | Interfaz clara y usable |
| **Testing** | 15% | Tests unitarios + validación |
| **Documentación** | 10% | README + código comentado |

**Puntuación mínima para aprobar**: 70%

## Entrega

1. Código en GitHub (público o privado)
2. README con:
   - Instrucciones de instalación
   - Screenshots/GIF de la herramienta
   - Explicación de decisiones técnicas
3. Demo desplegado (Vercel/Netlify) - Opcional
4. Tests pasando (screenshot o CI badge)

## Solución de Referencia

Una vez completes el ejercicio, puedes comparar con:
- [Ver solución →](./solution/)

**⚠️ Intenta resolver primero sin ver la solución**

---

## Siguientes Pasos

Completado este ejercicio, considera:
- [Ex 02: Hallucination Detector →](../ex02-hallucination-detector/)
- [Ex 04: Cost Calculator Dashboard →](../ex04-cost-calculator/)

---

**Questions?** Pregunta en Discord `#optional-exercises`

**¡Buena suerte! 🚀**
