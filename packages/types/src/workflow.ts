import type { AgentConfig } from "./agent"
import type { Tool } from "./tool"

export type WorkflowStepType = "agent" | "tool" | "transform" | "condition" | "loop"

export interface WorkflowStepConfig {
  id: string
  name: string
  type: WorkflowStepType
  agent?: AgentConfig
  tool?: Tool
  input?: Record<string, unknown>
  transform?: (input: unknown) => unknown
  condition?: (input: unknown) => boolean
  maxIterations?: number
  onComplete?: (result: unknown) => void
  onError?: (error: Error) => void
}

export interface WorkflowConfig {
  id?: string
  name: string
  description?: string
  steps: WorkflowStepConfig[]
  maxRetries?: number
  onComplete?: (results: unknown[]) => void
  onError?: (error: Error) => void
}

export interface WorkflowResult {
  id: string
  name: string
  success: boolean
  steps: WorkflowStepResult[]
  durationMs: number
  error?: string
}

export interface WorkflowStepResult {
  id: string
  name: string
  type: WorkflowStepType
  status: "success" | "failed" | "skipped"
  input?: unknown
  output?: unknown
  durationMs: number
  error?: string
}
