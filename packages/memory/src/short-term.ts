import type { MemoryEntry, MemoryQuery, MemorySearchResult } from "@lupaflow/types"
import type { MemoryBackend } from "./interface"
import { generateId } from "@lupaflow/core"

export class ShortTermMemory implements MemoryBackend {
  readonly type = "short-term" as const
  private entries: MemoryEntry[] = []
  private maxEntries: number

  constructor(maxEntries = 50) {
    this.maxEntries = maxEntries
  }

  async store(entry: MemoryEntry): Promise<void> {
    this.entries.push({
      ...entry,
      id: entry.id || generateId(),
      timestamp: entry.timestamp || Date.now(),
    })
    if (this.entries.length > this.maxEntries) {
      this.entries.shift()
    }
  }

  async retrieve(query: MemoryQuery): Promise<MemoryEntry[]> {
    let results = this.entries
    if (query.key) {
      results = results.filter((e) => e.key === query.key)
    }
    if (query.scope) {
      results = results.filter((e) => e.scope === query.scope)
    }
    return results.slice(-(query.limit || 20))
  }

  async search(_query: string, limit = 5): Promise<MemorySearchResult[]> {
    const q = _query.toLowerCase()
    const results = this.entries
      .filter((e) => e.content.toLowerCase().includes(q))
      .slice(-limit)
    return results.map((entry) => ({
      entry,
      score: 1,
    }))
  }

  async delete(key: string): Promise<void> {
    this.entries = this.entries.filter((e) => e.key !== key)
  }

  async clear(): Promise<void> {
    this.entries = []
  }
}
