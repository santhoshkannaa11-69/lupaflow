export interface ToolParameter {
  type: "string" | "number" | "boolean" | "array" | "object"
  description: string
  required?: boolean
  enum?: string[]
  items?: ToolParameter
  properties?: Record<string, ToolParameter>
}

export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, ToolParameter>
  required?: string[]
}

export interface Tool {
  definition: ToolDefinition
  execute: (args: Record<string, unknown>) => Promise<unknown>
}
