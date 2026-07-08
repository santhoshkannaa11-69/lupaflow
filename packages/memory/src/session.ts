import type { MemoryEntry, MemoryQuery, MemorySearchResult } from "@lupaflow/types"
import type { MemoryBackend } from "./interface"
import { generateId } from "@lupaflow/core"

const SESSION_KEY = "__session__"

export class SessionMemory implements MemoryBackend {
  readonly type = "session" as const
  private entries: MemoryEntry[] = []

  async store(entry: MemoryEntry): Promise<void> {
    this.entries.push({
      ...entry,
      id: entry.id || generateId(),
      scope: SESSION_KEY,
      timestamp: entry.timestamp || Date.now(),
    })
  }

  async retrieve(query: MemoryQuery): Promise<MemoryEntry[]> {
    let results = this.entries.filter((e) => e.scope === SESSION_KEY)
    if (query.key) results = results.filter((e) => e.key === query.key)
    return results.slice(-(query.limit || 50))
  }

  async search(_query: string, limit = 10): Promise<MemorySearchResult[]> {
    const q = _query.toLowerCase()
    return this.entries
      .filter((e) => e.scope === SESSION_KEY && e.content.toLowerCase().includes(q))
      .slice(-limit)
      .map((entry) => ({ entry, score: 1 }))
  }

  async delete(key: string): Promise<void> {
    this.entries = this.entries.filter((e) => e.key !== key && e.scope === SESSION_KEY)
  }

  async clear(): Promise<void> {
    this.entries = this.entries.filter((e) => e.scope !== SESSION_KEY)
  }
}
