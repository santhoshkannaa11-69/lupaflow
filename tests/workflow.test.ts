import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@lupaflow/secrets", () => ({
  getOpenRouterKey: () => "sk-or-mock",
  getGoogleKey: () => "ai-mock",
  getGroqKey: () => "gsk-mock",
}))

import { Pipeline, WorkflowStep, WorkflowEngine } from "@lupaflow/workflow"

describe("Pipeline", () => {
  let pipeline: Pipeline

  beforeEach(() => {
    pipeline = new Pipeline()
  })

  it("starts with no steps", () => {
    expect(pipeline.getSteps()).toEqual([])
  })

  it("adds agent steps", () => {
    pipeline.addAgent("researcher", { agent: { name: "researcher", provider: "groq" } })
    const steps = pipeline.getSteps()
    expect(steps).toHaveLength(1)
    expect(steps[0].name).toBe("researcher")
    expect(steps[0].type).toBe("agent")
  })

  it("adds tool steps", () => {
    const mockTool = { definition: { name: "calc", description: "", parameters: {}, required: [] }, execute: async () => ({}), toJSON: function () { return this.definition } }
    pipeline.addTool("calculator", { tool: mockTool })
    const steps = pipeline.getSteps()
    expect(steps).toHaveLength(1)
    expect(steps[0].type).toBe("tool")
  })

  it("adds transform steps", () => {
    const fn = (x: unknown) => String(x).toUpperCase()
    pipeline.addTransform("uppercase", fn)
    const steps = pipeline.getSteps()
    expect(steps).toHaveLength(1)
    expect(steps[0].type).toBe("transform")
    expect(steps[0].transform).toBe(fn)
  })

  it("adds condition steps", () => {
    const fn = (x: unknown) => String(x).length > 5
    pipeline.addCondition("check-length", fn)
    const steps = pipeline.getSteps()
    expect(steps).toHaveLength(1)
    expect(steps[0].type).toBe("condition")
  })

  it("chains multiple steps", () => {
    pipeline
      .addAgent("a", { agent: { name: "a", provider: "groq" } })
      .addTransform("t", (x: unknown) => x)
      .addAgent("b", { agent: { name: "b", provider: "groq" } })

    expect(pipeline.getSteps()).toHaveLength(3)
  })
})

describe("WorkflowStep", () => {
  it("executes a transform step", async () => {
    const step = new WorkflowStep({
      id: "step-1",
      name: "upper",
      type: "transform",
      transform: (x: unknown) => String(x).toUpperCase(),
    })
    const result = await step.execute("hello")
    expect(result.status).toBe("success")
    expect(result.output).toBe("HELLO")
  })

  it("executes a condition step", async () => {
    const step = new WorkflowStep({
      id: "step-1",
      name: "check",
      type: "condition",
      condition: (x: unknown) => Number(x) > 10,
    })
    const result = await step.execute(15)
    expect(result.status).toBe("success")
    expect(result.output).toBe(true)
  })

  it("handles transform errors gracefully", async () => {
    const step = new WorkflowStep({
      id: "step-1",
      name: "failing",
      type: "transform",
      transform: () => { throw new Error("oops") },
    })
    const result = await step.execute("test")
    expect(result.status).toBe("failed")
    expect(result.error).toBe("oops")
  })

  it("calls onComplete callback on success", async () => {
    const onComplete = vi.fn()
    const step = new WorkflowStep({
      id: "step-1",
      name: "test",
      type: "transform",
      transform: (x: unknown) => String(x),
      onComplete,
    })
    await step.execute("hi")
    expect(onComplete).toHaveBeenCalledWith("hi")
  })

  it("calls onError callback on failure", async () => {
    const onError = vi.fn()
    const step = new WorkflowStep({
      id: "step-1",
      name: "test",
      type: "transform",
      transform: () => { throw new Error("fail") },
      onError,
    })
    await step.execute("hi")
    expect(onError).toHaveBeenCalled()
  })
})

describe("WorkflowEngine", () => {
  it("creates from pipeline", () => {
    const pipeline = new Pipeline()
    pipeline.addTransform("upper", (x: unknown) => String(x).toUpperCase())
    const engine = WorkflowEngine.fromPipeline("test", pipeline, "test workflow")
    expect(engine.config.name).toBe("test")
    expect(engine.config.description).toBe("test workflow")
    expect(engine.config.steps).toHaveLength(1)
  })

  it("runs a multi-step workflow", async () => {
    const pipeline = new Pipeline()
    pipeline.addTransform("upper", (x: unknown) => String(x).toUpperCase())
    pipeline.addTransform("exclaim", (x: unknown) => String(x) + "!!")

    const engine = WorkflowEngine.fromPipeline("shout", pipeline)
    const result = await engine.run("hello")
    expect(result.success).toBe(true)
    expect(result.steps).toHaveLength(2)
    expect(result.steps[0].output).toBe("HELLO")
    expect(result.steps[1].output).toBe("HELLO!!")
  })

  it("fails fast when a step fails and no maxRetries", async () => {
    const pipeline = new Pipeline()
    pipeline.addTransform("ok", (x: unknown) => x)
    pipeline.addTransform("fail", () => { throw new Error("boom") })
    pipeline.addTransform("never", (x: unknown) => x)

    const engine = WorkflowEngine.fromPipeline("test", pipeline)
    const result = await engine.run("start")
    expect(result.success).toBe(false)
    expect(result.steps).toHaveLength(2)
    expect(result.steps[1].status).toBe("failed")
  })
})
