import type { MemoryEntry, MemoryQuery, MemorySearchResult, MemoryType } from "@lupaflow/types"

export interface MemoryBackend {
  readonly type: MemoryType

  store(entry: MemoryEntry): Promise<void>
  retrieve(query: MemoryQuery): Promise<MemoryEntry[]>
  search(query: string, limit?: number): Promise<MemorySearchResult[]>
  delete(key: string): Promise<void>
  clear(): Promise<void>
}
