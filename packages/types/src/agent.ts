import type { ProviderName } from "./provider"
import type { Tool } from "./tool"

export interface Personality {
  name?: string
  traits?: string[]
  tone?: string
  style?: string
}

export interface Goal {
  description: string
  priority?: number
  completed?: boolean
}

export interface Constraint {
  description: string
  type?: "hard" | "soft"
}

export interface AgentConfig {
  id?: string
  name: string
  provider: ProviderName
  model?: string
  systemPrompt?: string
  personality?: Personality
  goals?: Goal[]
  constraints?: Constraint[]
  temperature?: number
  maxTokens?: number
  topP?: number
  maxRetries?: number
  retryDelay?: number
  maxContextMessages?: number
  tools?: Tool[]
  memory?: {
    shortTerm?: boolean
    longTerm?: boolean
    semantic?: boolean
    session?: boolean
    user?: boolean
    project?: boolean
  }
}
