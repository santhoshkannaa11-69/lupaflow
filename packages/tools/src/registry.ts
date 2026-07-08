import type { Tool } from "@lupaflow/types"
import { ToolError } from "@lupaflow/core"

class ToolRegistry {
  private tools: Map<string, Tool> = new Map()

  register(tool: Tool): void {
    this.tools.set(tool.definition.name, tool)
  }

  get(name: string): Tool {
    const tool = this.tools.get(name)
    if (!tool) {
      throw new ToolError(name, `Tool not found: "${name}"`)
    }
    return tool
  }

  has(name: string): boolean {
    return this.tools.has(name)
  }

  list(): Tool[] {
    return Array.from(this.tools.values())
  }

  remove(name: string): void {
    this.tools.delete(name)
  }

  clear(): void {
    this.tools.clear()
  }
}

export const toolRegistry = new ToolRegistry()
