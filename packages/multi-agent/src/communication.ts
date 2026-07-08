import { generateId } from "@lupaflow/core"

export interface AgentMessage {
  id: string
  from: string
  to: string
  content: string
  type: "request" | "response" | "broadcast"
  timestamp: number
  metadata?: Record<string, unknown>
}

export class AgentCommunicator {
  private messages: AgentMessage[] = []
  private listeners: Map<string, Set<(msg: AgentMessage) => void>> = new Map()

  send(from: string, to: string, content: string, metadata?: Record<string, unknown>): AgentMessage {
    const msg: AgentMessage = {
      id: generateId(),
      from,
      to,
      content,
      type: "request",
      timestamp: Date.now(),
      metadata,
    }
    this.messages.push(msg)
    const listeners = this.listeners.get(to)
    if (listeners) {
      for (const listener of listeners) {
        listener(msg)
      }
    }
    return msg
  }

  broadcast(from: string, content: string): void {
    const msg: AgentMessage = {
      id: generateId(),
      from,
      to: "*",
      content,
      type: "broadcast",
      timestamp: Date.now(),
    }
    this.messages.push(msg)
    for (const listeners of this.listeners.values()) {
      for (const listener of listeners) {
        listener(msg)
      }
    }
  }

  respond(to: string, originalId: string, content: string): AgentMessage {
    const original = this.messages.find((m) => m.id === originalId)
    const msg: AgentMessage = {
      id: generateId(),
      from: to,
      to: original?.from || to,
      content,
      type: "response",
      timestamp: Date.now(),
    }
    this.messages.push(msg)
    const listeners = this.listeners.get(msg.to)
    if (listeners) {
      for (const listener of listeners) {
        listener(msg)
      }
    }
    return msg
  }

  on(agentId: string, handler: (msg: AgentMessage) => void): () => void {
    if (!this.listeners.has(agentId)) {
      this.listeners.set(agentId, new Set())
    }
    this.listeners.get(agentId)!.add(handler)
    return () => this.listeners.get(agentId)?.delete(handler)
  }

  getHistory(): AgentMessage[] {
    return [...this.messages]
  }

  clear(): void {
    this.messages = []
  }
}
