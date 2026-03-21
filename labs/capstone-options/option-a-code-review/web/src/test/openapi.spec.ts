import SwaggerParser from '@apidevtools/swagger-parser'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const openApiPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../python/openapi.json'
)

describe('OpenAPI spec', () => {
  it('validates and defines /review and /health', async () => {
    const raw = readFileSync(openApiPath, 'utf8')
    const doc = JSON.parse(raw) as Record<string, unknown>
    await SwaggerParser.validate(doc as Parameters<typeof SwaggerParser.validate>[0])
    const d = doc as {
      paths: Record<string, unknown>
      openapi?: string
    }
    expect(d.openapi?.startsWith('3.')).toBe(true)
    expect(d.paths['/review']).toBeDefined()
    expect(d.paths['/health']).toBeDefined()
  })
})
