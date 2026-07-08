import type { MemoryBackend } from "./interface"
import type { MemoryEntry, MemoryQuery, MemorySearchResult, MemoryType } from "@lupaflow/types"
import { ShortTermMemory } from "./short-term"
import { LongTermMemory } from "./long-term"
import { SemanticMemory } from "./semantic"
import { SessionMemory } from "./session"
import { UserMemory } from "./user"
import { ProjectMemory } from "./project"
import { MemoryError } from "@lupaflow/core"
import { globalEventBus } from "@lupaflow/core"

export class MemoryStore {
  private backends: Map<MemoryType, MemoryBackend> = new Map()

  constructor(config?: { shortTerm?: boolean; longTerm?: boolean; semantic?: boolean; session?: boolean; user?: string; project?: boolean }) {
    if (config?.shortTerm !== false) this.backends.set("short-term", new ShortTermMemory())
    if (config?.longTerm) this.backends.set("long-term", new LongTermMemory())
    if (config?.semantic) this.backends.set("semantic", new SemanticMemory())
    if (config?.session !== false) this.backends.set("session", new SessionMemory())
    if (config?.user) this.backends.set("user", new UserMemory(config.user))
    if (config?.project) this.backends.set("project", new ProjectMemory())
  }

  register(type: MemoryType, backend: MemoryBackend): void {
    this.backends.set(type, backend)
  }

  get(type: MemoryType): MemoryBackend {
    const backend = this.backends.get(type)
    if (!backend) throw new MemoryError(`No memory backend registered: ${type}`)
    return backend
  }

  async store(entry: MemoryEntry): Promise<void> {
    if (entry.type === "short-term" || entry.type === "session") {
      const backend = this.backends.get(entry.type)
      if (backend) {
        await backend.store(entry)
        await globalEventBus.emit("memory:update", {
          type: entry.type,
          key: entry.key,
        } as any)
      }
      return
    }

    for (const backend of this.backends.values()) {
      await backend.store({ ...entry })
    }
    await globalEventBus.emit("memory:update", { type: entry.type, key: entry.key } as any)
  }

  async retrieve(query: MemoryQuery): Promise<MemoryEntry[]> {
    if (query.type) {
      const backend = this.get(query.type)
      const results = await backend.retrieve(query)
      await globalEventBus.emit("memory:retrieve", {
        type: query.type,
        key: query.key || "all",
        results: results.length,
      } as any)
      return results
    }

    const all: MemoryEntry[] = []
    for (const backend of this.backends.values()) {
      all.push(...(await backend.retrieve(query)))
    }
    return all
  }

  async search(query: string, limit = 10): Promise<MemorySearchResult[]> {
    const all: MemorySearchResult[] = []
    for (const backend of this.backends.values()) {
      all.push(...(await backend.search(query, limit)))
    }
    return all.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  async delete(key: string): Promise<void> {
    for (const backend of this.backends.values()) {
      await backend.delete(key)
    }
  }

  async clear(): Promise<void> {
    for (const backend of this.backends.values()) {
      await backend.clear()
    }
  }
}
