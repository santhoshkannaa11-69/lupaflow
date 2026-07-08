import { BaseTool } from "../interface"

export class CalculatorTool extends BaseTool {
  definition = {
    name: "calculator",
    description: "Evaluate mathematical expressions safely",
    parameters: {
      expression: {
        type: "string" as const,
        description: "Mathematical expression to evaluate (e.g., '2 + 2 * 3')",
      },
    },
    required: ["expression"],
  }

  async execute(args: Record<string, unknown>): Promise<unknown> {
    const { expression } = args as { expression: string }
    const sanitized = expression.replace(/[^0-9+\-*/.()^% ]/g, "")
    try {
      const result = Function(`"use strict"; return (${sanitized})`)()
      return { result, expression }
    } catch (err: any) {
      return { error: err.message, expression }
    }
  }
}
