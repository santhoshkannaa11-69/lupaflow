import type { LupaEvent } from "./events"

export interface Plugin {
  name: string
  version: string
  description?: string
  onLoad?: () => void | Promise<void>
  onUnload?: () => void | Promise<void>
  onEvent?: (event: LupaEvent) => void | Promise<void>
  hooks?: {
    beforeAgentRun?: (config: Record<string, unknown>) => Record<string, unknown>
    afterAgentRun?: (result: unknown) => unknown
    beforeToolCall?: (tool: string, args: Record<string, unknown>) => Record<string, unknown>
    afterToolCall?: (result: unknown) => unknown
    beforeProviderCall?: (provider: string, request: Record<string, unknown>) => Record<string, unknown>
    afterProviderCall?: (response: Record<string, unknown>) => Record<string, unknown>
  }
}
