import type { Tool } from "./tool"

export type ProviderName = "openai" | "anthropic" | "google" | "openrouter" | "groq" | "mistral" | "xai" | "ollama"

export type ModelRole = "system" | "user" | "assistant" | "tool"

export interface Message {
  role: ModelRole
  content: string | null
  toolCallId?: string
  name?: string
  toolCalls?: Array<{
    id: string
    type: "function"
    function: { name: string; arguments: string }
  }>
}

export interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
}

export interface ToolResult {
  toolCallId: string
  name: string
  content: string
}

export interface ProviderConfig {
  apiKey?: string
  baseUrl?: string
  model?: string
  temperature?: number
  maxTokens?: number
  topP?: number
}

export interface CompletionRequest {
  messages: Message[]
  tools?: Tool[]
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  model?: string
}

export interface CompletionResponse {
  content: string | null
  toolCalls: ToolCall[]
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  latencyMs: number
  finishReason: string
}
