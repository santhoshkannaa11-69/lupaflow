import type { Message } from "@lupaflow/types"
import { estimateTokens } from "@lupaflow/core"

export interface ContextConfig {
  maxMessages?: number
  maxTokens?: number
  preserveSystem?: boolean
}

export class ContextManager {
  private messages: Message[] = []
  private config: ContextConfig

  constructor(config: ContextConfig = {}) {
    this.config = {
      maxMessages: config.maxMessages || 50,
      maxTokens: config.maxTokens || 4000,
      preserveSystem: config.preserveSystem ?? true,
    }
  }

  add(message: Message): void {
    this.messages.push(message)
    this.trim()
  }

  getMessages(): Message[] {
    return [...this.messages]
  }

  getTotalTokens(): number {
    return this.messages.reduce((sum, m) => sum + estimateTokens(m.content || ""), 0)
  }

  trim(): void {
    if (this.messages.length <= this.config.maxMessages! && this.getTotalTokens() <= this.config.maxTokens!) {
      return
    }

    while (
      this.messages.length > 2 &&
      (this.messages.length > this.config.maxMessages! || this.getTotalTokens() > this.config.maxTokens!)
    ) {
      const startIdx = this.config.preserveSystem && this.messages[0]?.role === "system" ? 1 : 0
      if (startIdx < this.messages.length) {
        this.messages.splice(startIdx, 1)
      } else {
        break
      }
    }
  }

  clear(): void {
    const systemMsg = this.config.preserveSystem
      ? this.messages.find((m) => m.role === "system")
      : undefined
    this.messages = systemMsg ? [systemMsg] : []
  }

  toJSON(): Message[] {
    return this.getMessages()
  }
}
