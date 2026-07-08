export type EventName =
  | "agent:start"
  | "agent:thinking"
  | "agent:response"
  | "agent:error"
  | "agent:complete"
  | "tool:start"
  | "tool:finish"
  | "tool:error"
  | "memory:update"
  | "memory:retrieve"
  | "workflow:start"
  | "workflow:step"
  | "workflow:complete"
  | "workflow:error"
  | "provider:start"
  | "provider:complete"
  | "provider:error"
  | "llm:token"

export interface BaseEvent {
  id: string
  name: EventName
  timestamp: number
  agentId?: string
  runId?: string
}

export interface AgentStartEvent extends BaseEvent {
  name: "agent:start"
  config: Record<string, unknown>
}

export interface AgentThinkingEvent extends BaseEvent {
  name: "agent:thinking"
  message: string
}

export interface AgentResponseEvent extends BaseEvent {
  name: "agent:response"
  content: string
  tokens?: number
  latencyMs?: number
}

export interface AgentErrorEvent extends BaseEvent {
  name: "agent:error"
  error: string
  retryAttempt?: number
}

export interface AgentCompleteEvent extends BaseEvent {
  name: "agent:complete"
  totalTokens: number
  totalLatencyMs: number
  toolCalls: number
}

export interface ToolStartEvent extends BaseEvent {
  name: "tool:start"
  tool: string
  args: Record<string, unknown>
}

export interface ToolFinishEvent extends BaseEvent {
  name: "tool:finish"
  tool: string
  result: unknown
  durationMs: number
}

export interface ToolErrorEvent extends BaseEvent {
  name: "tool:error"
  tool: string
  error: string
}

export interface MemoryUpdateEvent extends BaseEvent {
  name: "memory:update"
  type: string
  key: string
}

export interface MemoryRetrieveEvent extends BaseEvent {
  name: "memory:retrieve"
  type: string
  key: string
  results: number
}

export interface WorkflowStartEvent extends BaseEvent {
  name: "workflow:start"
  steps: number
}

export interface WorkflowStepEvent extends BaseEvent {
  name: "workflow:step"
  step: number
  stepName: string
  status: "running" | "completed" | "failed"
}

export interface WorkflowCompleteEvent extends BaseEvent {
  name: "workflow:complete"
  totalSteps: number
  failedSteps: number
  durationMs: number
}

export interface ProviderStartEvent extends BaseEvent {
  name: "provider:start"
  provider: string
  model: string
}

export interface ProviderCompleteEvent extends BaseEvent {
  name: "provider:complete"
  provider: string
  model: string
  tokens: number
  latencyMs: number
  cost?: number
}

export interface ProviderErrorEvent extends BaseEvent {
  name: "provider:error"
  provider: string
  model: string
  error: string
}

export interface LLMTokenEvent extends BaseEvent {
  name: "llm:token"
  tokens: number
  cost?: number
}

export type LupaEvent =
  | AgentStartEvent
  | AgentThinkingEvent
  | AgentResponseEvent
  | AgentErrorEvent
  | AgentCompleteEvent
  | ToolStartEvent
  | ToolFinishEvent
  | ToolErrorEvent
  | MemoryUpdateEvent
  | MemoryRetrieveEvent
  | WorkflowStartEvent
  | WorkflowStepEvent
  | WorkflowCompleteEvent
  | ProviderStartEvent
  | ProviderCompleteEvent
  | ProviderErrorEvent
  | LLMTokenEvent
