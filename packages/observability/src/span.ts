import { generateId } from "@lupaflow/core"
import { globalEventBus } from "@lupaflow/core"

interface Span {
  id: string
  name: string
  parentId?: string
  startTime: number
  endTime?: number
  status: "open" | "closed" | "error"
  metadata?: Record<string, unknown>
}

export class Tracer {
  private spans: Map<string, Span> = new Map()
  private stack: string[] = []

  start(name: string, metadata?: Record<string, unknown>): string {
    const id = generateId()
    const parentId = this.stack[this.stack.length - 1]
    const span: Span = {
      id,
      name,
      parentId,
      startTime: Date.now(),
      status: "open",
      metadata,
    }
    this.spans.set(id, span)
    this.stack.push(id)
    return id
  }

  end(id: string, metadata?: Record<string, unknown>): void {
    const span = this.spans.get(id)
    if (!span) return
    span.endTime = Date.now()
    span.status = "closed"
    span.metadata = { ...span.metadata, ...metadata }
    this.stack = this.stack.filter((s) => s !== id)
  }

  error(id: string, error: string): void {
    const span = this.spans.get(id)
    if (!span) return
    span.endTime = Date.now()
    span.status = "error"
    span.metadata = { ...span.metadata, error }
    this.stack = this.stack.filter((s) => s !== id)
  }

  getTrace(id: string): Span | undefined {
    return this.spans.get(id)
  }

  getActiveSpans(): Span[] {
    return Array.from(this.spans.values()).filter((s) => s.status === "open")
  }

  getAllSpans(): Span[] {
    return Array.from(this.spans.values())
  }

  clear(): void {
    this.spans.clear()
    this.stack = []
  }
}

export const globalTracer = new Tracer()
