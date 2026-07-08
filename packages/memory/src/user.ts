import type { MemoryEntry, MemoryQuery, MemorySearchResult } from "@lupaflow/types"
import type { MemoryBackend } from "./interface"
import { generateId } from "@lupaflow/core"

export class UserMemory implements MemoryBackend {
  readonly type = "user" as const
  private entries: MemoryEntry[] = []
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  async store(entry: MemoryEntry): Promise<void> {
    this.entries.push({
      ...entry,
      id: entry.id || generateId(),
      scope: `user:${this.userId}`,
      timestamp: entry.timestamp || Date.now(),
    })
  }

  async retrieve(query: MemoryQuery): Promise<MemoryEntry[]> {
    let results = this.entries.filter((e) => e.scope === `user:${this.userId}`)
    if (query.key) results = results.filter((e) => e.key === query.key)
    return results.slice(-(query.limit || 50))
  }

  async search(_query: string, limit = 10): Promise<MemorySearchResult[]> {
    const q = _query.toLowerCase()
    return this.entries
      .filter((e) => e.scope === `user:${this.userId}` && e.content.toLowerCase().includes(q))
      .slice(-limit)
      .map((entry) => ({ entry, score: 1 }))
  }

  async delete(key: string): Promise<void> {
    this.entries = this.entries.filter(
      (e) => !(e.key === key && e.scope === `user:${this.userId}`)
    )
  }

  async clear(): Promise<void> {
    this.entries = this.entries.filter((e) => e.scope !== `user:${this.userId}`)
  }
}
