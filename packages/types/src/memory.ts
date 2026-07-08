export type MemoryType = "short-term" | "long-term" | "semantic" | "session" | "user" | "project" | "vector"

export interface MemoryEntry {
  id: string
  type: MemoryType
  key: string
  content: string
  metadata?: Record<string, unknown>
  timestamp: number
  scope?: string
}

export interface MemoryQuery {
  type?: MemoryType
  key?: string
  scope?: string
  query?: string
  limit?: number
  threshold?: number
}

export interface MemorySearchResult {
  entry: MemoryEntry
  score: number
}
