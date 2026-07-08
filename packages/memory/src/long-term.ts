import { readFile, writeFile, access } from "fs/promises"
import { join } from "path"
import type { MemoryEntry, MemoryQuery, MemorySearchResult } from "@lupaflow/types"
import type { MemoryBackend } from "./interface"
import { generateId } from "@lupaflow/core"

export class LongTermMemory implements MemoryBackend {
  readonly type = "long-term" as const
  private entries: MemoryEntry[] = []
  private filePath: string

  constructor(name = "default") {
    this.filePath = join(process.cwd(), ".lupaflow", `memory-${name}.json`)
  }

  async init(): Promise<void> {
    try {
      await access(this.filePath)
      const data = await readFile(this.filePath, "utf-8")
      this.entries = JSON.parse(data)
    } catch {
      this.entries = []
    }
  }

  async persist(): Promise<void> {
    const dir = join(process.cwd(), ".lupaflow")
    try {
      await access(dir)
    } catch {
      await writeFile(dir, "", { flag: "a" })
    }
    await writeFile(this.filePath, JSON.stringify(this.entries, null, 2))
  }

  async store(entry: MemoryEntry): Promise<void> {
    this.entries.push({
      ...entry,
      id: entry.id || generateId(),
      timestamp: entry.timestamp || Date.now(),
    })
    await this.persist()
  }

  async retrieve(query: MemoryQuery): Promise<MemoryEntry[]> {
    let results = this.entries
    if (query.key) results = results.filter((e) => e.key === query.key)
    if (query.type) results = results.filter((e) => e.type === query.type)
    if (query.scope) results = results.filter((e) => e.scope === query.scope)
    return results.slice(-(query.limit || 50))
  }

  async search(_query: string, limit = 10): Promise<MemorySearchResult[]> {
    const q = _query.toLowerCase()
    return this.entries
      .filter((e) => e.content.toLowerCase().includes(q))
      .slice(-limit)
      .map((entry) => ({ entry, score: 1 }))
  }

  async delete(key: string): Promise<void> {
    this.entries = this.entries.filter((e) => e.key !== key)
    await this.persist()
  }

  async clear(): Promise<void> {
    this.entries = []
    await this.persist()
  }
}
