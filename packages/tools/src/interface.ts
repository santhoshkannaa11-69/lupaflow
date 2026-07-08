import type { Tool, ToolDefinition } from "@lupaflow/types"

export abstract class BaseTool implements Tool {
  abstract definition: ToolDefinition

  abstract execute(args: Record<string, unknown>): Promise<unknown>

  toJSON(): ToolDefinition {
    return this.definition
  }
}
