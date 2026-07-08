import type { MemoryEntry, MemoryQuery, MemorySearchResult } from "@lupaflow/types"
import type { MemoryBackend } from "./interface"
import { generateId } from "@lupaflow/core"
import { readFile, writeFile, access } from "fs/promises"
import { join } from "path"

const PROJECT_MEMORY_FILE = ".lupaflow/project-memory.json"

export class ProjectMemory implements MemoryBackend {
  readonly type = "project" as const
  private entries: MemoryEntry[] = []
  private loaded = false

  async ensureLoaded(): Promise<void> {
    if (this.loaded) return
    try {
      await access(PROJECT_MEMORY_FILE)
      const data = await readFile(PROJECT_MEMORY_FILE, "utf-8")
      this.entries = JSON.parse(data)
    } catch {
      this.entries = []
    }
    this.loaded = true
  }

  async persist(): Promise<void> {
    await writeFile(PROJECT_MEMORY_FILE, JSON.stringify(this.entries, null, 2))
  }

  async store(entry: MemoryEntry): Promise<void> {
    await this.ensureLoaded()
    this.entries.push({
      ...entry,
      id: entry.id || generateId(),
      scope: "project",
      timestamp: entry.timestamp || Date.now(),
    })
    await this.persist()
  }

  async retrieve(query: MemoryQuery): Promise<MemoryEntry[]> {
    await this.ensureLoaded()
    let results = this.entries.filter((e) => e.scope === "project")
    if (query.key) results = results.filter((e) => e.key === query.key)
    return results.slice(-(query.limit || 50))
  }

  async search(_query: string, limit = 10): Promise<MemorySearchResult[]> {
    await this.ensureLoaded()
    const q = _query.toLowerCase()
    return this.entries
      .filter((e) => e.scope === "project" && e.content.toLowerCase().includes(q))
      .slice(-limit)
      .map((entry) => ({ entry, score: 1 }))
  }

  async delete(key: string): Promise<void> {
    await this.ensureLoaded()
    this.entries = this.entries.filter((e) => !(e.key === key && e.scope === "project"))
    await this.persist()
  }

  async clear(): Promise<void> {
    await this.ensureLoaded()
    this.entries = this.entries.filter((e) => e.scope !== "project")
    await this.persist()
  }
}
