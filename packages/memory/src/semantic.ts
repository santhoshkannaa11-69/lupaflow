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

function simpleEmbed(text: string): number[] {
  const dim = 128
  const vec = new Array(dim).fill(0)
  for (let i = 0; i < text.length; i++) {
    const idx = (text.charCodeAt(i) * 7 + i * 13) % dim
    vec[idx] += 1 + (text.charCodeAt(i) % 5) * 0.1
  }
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0))
  return mag > 0 ? vec.map((v) => v / mag) : vec
}

interface SemanticEntry extends MemoryEntry {
  embedding: number[]
}

export class SemanticMemory implements MemoryBackend {
  readonly type = "semantic" as const
  private entries: SemanticEntry[] = []

  async store(entry: MemoryEntry): Promise<void> {
    this.entries.push({
      ...entry,
      id: entry.id || generateId(),
      timestamp: entry.timestamp || Date.now(),
      embedding: simpleEmbed(entry.content),
    })
  }

  async retrieve(query: MemoryQuery): Promise<MemoryEntry[]> {
    let results = this.entries
    if (query.key) results = results.filter((e) => e.key === query.key)
    if (query.scope) results = results.filter((e) => e.scope === query.scope)
    return results.slice(-(query.limit || 20))
  }

  async search(_query: string, limit = 10): Promise<MemorySearchResult[]> {
    const queryEmbedding = simpleEmbed(_query)
    const scored = this.entries
      .map((entry) => ({
        entry,
        score: cosineSimilarity(queryEmbedding, entry.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
    return scored
  }

  async delete(key: string): Promise<void> {
    this.entries = this.entries.filter((e) => e.key !== key)
  }

  async clear(): Promise<void> {
    this.entries = []
  }
}
