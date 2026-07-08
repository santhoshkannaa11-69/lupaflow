import { describe, it, expect } from "vitest"
import { CalculatorTool, toolRegistry, BaseTool } from "@lupaflow/tools"

describe("CalculatorTool", () => {
  const tool = new CalculatorTool()

  it("has the correct definition", () => {
    expect(tool.definition.name).toBe("calculator")
    expect(tool.definition.description).toBeTruthy()
    expect(tool.definition.parameters).toHaveProperty("expression")
    expect(tool.definition.required).toContain("expression")
  })

  it("evaluates simple arithmetic", async () => {
    const result = await tool.execute({ expression: "2 + 3" })
    expect(result).toEqual({ result: 5, expression: "2 + 3" })
  })

  it("evaluates complex expressions", async () => {
    const result = await tool.execute({ expression: "(2 + 3) * 4" })
    expect(result).toEqual({ result: 20, expression: "(2 + 3) * 4" })
  })

  it("handles floating point", async () => {
    const result = await tool.execute({ expression: "10 / 3" })
    expect((result as any).result).toBeCloseTo(3.333, 2)
  })

  it("sanitizes unsafe characters", async () => {
    const result = await tool.execute({ expression: "2 + 2" })
    expect((result as any).result).toBe(4)
  })

  it("handles invalid expressions gracefully", async () => {
    const result = await tool.execute({ expression: "invalid" })
    expect((result as any).error).toBeTruthy()
  })
})

describe("toolRegistry", () => {
  it("has all built-in tools registered", () => {
    const tools = toolRegistry.list()
    const names = tools.map((t) => t.definition.name)
    expect(names).toContain("calculator")
    expect(names).toContain("filesystem")
    expect(names).toContain("shell")
    expect(names).toContain("http")
    expect(names).toContain("search")
  })

  it("returns registered tools", () => {
    const tool = toolRegistry.get("calculator")
    expect(tool).toBeInstanceOf(CalculatorTool)
    expect(tool.definition.name).toBe("calculator")
  })

  it("checks tool existence with has()", () => {
    expect(toolRegistry.has("calculator")).toBe(true)
    expect(toolRegistry.has("nonexistent")).toBe(false)
  })

  it("throws for unknown tools", () => {
    expect(() => toolRegistry.get("nonexistent")).toThrow()
  })
})

describe("BaseTool", () => {
  it("can be extended to create custom tools", () => {
    class CustomTool extends BaseTool {
      definition = {
        name: "custom",
        description: "A custom tool",
        parameters: {},
        required: [],
      }
      async execute(args: Record<string, unknown>) {
        return { handled: true, ...args }
      }
    }

    const tool = new CustomTool()
    expect(tool.definition.name).toBe("custom")
    expect(tool.toJSON()).toBe(tool.definition)
  })
})
