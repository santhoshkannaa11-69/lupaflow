import { ulid } from "ulid"
import type { EventName, LupaEvent } from "@lupaflow/types"

type EventHandler = (event: LupaEvent) => void | Promise<void>

export class EventBus {
  private handlers: Map<EventName, Set<EventHandler>> = new Map()
  private wildcardHandlers: Set<EventHandler> = new Set()
  private history: LupaEvent[] = []
  private maxHistory: number = 1000

  on(name: EventName, handler: EventHandler): () => void {
    if (!this.handlers.has(name)) {
      this.handlers.set(name, new Set())
    }
    this.handlers.get(name)!.add(handler)
    return () => this.handlers.get(name)?.delete(handler)
  }

  onAny(handler: EventHandler): () => void {
    this.wildcardHandlers.add(handler)
    return () => this.wildcardHandlers.delete(handler)
  }

  async emit(name: EventName, data: Partial<LupaEvent>): Promise<void> {
    const event: LupaEvent = {
      id: ulid(),
      name,
      timestamp: Date.now(),
      ...data,
    } as LupaEvent

    this.history.push(event)
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }

    const handlers = this.handlers.get(name)
    if (handlers) {
      for (const handler of handlers) {
        await handler(event)
      }
    }

    for (const handler of this.wildcardHandlers) {
      await handler(event)
    }
  }

  getHistory(): LupaEvent[] {
    return [...this.history]
  }

  clearHistory(): void {
    this.history = []
  }

  removeAllListeners(): void {
    this.handlers.clear()
    this.wildcardHandlers.clear()
  }
}

export const globalEventBus = new EventBus()
