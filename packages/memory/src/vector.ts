import type { MemoryEntry, MemoryQuery, MemorySearchResult } from "@lupaflow/types"
import type { MemoryBackend } from "./interface"
import { generateId } from "@lupaflow/core"

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB)
  return denom === 0 ? 0 : dot / denom
}

function generateEmbedding(text: string): number[] {
  const dim = 384
  const vec = new Array(dim).fill(0)
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    for (let j = 0; j < 5; j++) {
      const idx = (code * (j + 1) + i * 17 + j * 31) % dim
      vec[idx] += 1.0 / (j + 1)
    }
  }
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0))
  return mag > 0 ? vec.map((v) => v / mag) : vec
}

interface VectorEntry extends MemoryEntry {
  embedding: number[]
}

export class VectorMemory implements MemoryBackend {
  readonly type = "vector" as const
  private entries: VectorEntry[] = []

  async store(entry: MemoryEntry): Promise<void> {
    this.entries.push({
      ...entry,
      id: entry.id || generateId(),
      timestamp: entry.timestamp || Date.now(),
      embedding: generateEmbedding(entry.content),
    })
  }

  async retrieve(query: MemoryQuery): Promise<MemoryEntry[]> {
    let results: MemoryEntry[] = this.entries
    if (query.key) results = results.filter((e) => e.key === query.key)
    if (query.scope) results = results.filter((e) => e.scope === query.scope)
    return results.slice(-(query.limit || 20))
  }

  async search(_query: string, limit = 10, threshold = 0.3): Promise<MemorySearchResult[]> {
    const queryEmbedding = generateEmbedding(_query)
    return this.entries
      .map((entry) => ({
        entry,
        score: cosineSimilarity(queryEmbedding, entry.embedding),
      }))
      .filter((r) => r.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  async delete(key: string): Promise<void> {
    this.entries = this.entries.filter((e) => e.key !== key)
  }

  async clear(): Promise<void> {
    this.entries = []
  }
}
