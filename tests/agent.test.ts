import { describe, it, expect } from "vitest"
import { validateAgentConfig, buildSystemPrompt, ContextManager } from "@lupaflow/agent"
import { ConfigError } from "@lupaflow/core"

describe("validateAgentConfig", () => {
  it("passes for a valid config", () => {
    expect(() =>
      validateAgentConfig({ name: "test", provider: "groq" })
    ).not.toThrow()
  })

  it("throws if name is missing", () => {
    expect(() => validateAgentConfig({} as any)).toThrow(ConfigError)
    expect(() => validateAgentConfig({} as any)).toThrow("Agent name is required")
  })

  it("throws if provider is missing", () => {
    expect(() => validateAgentConfig({ name: "test" } as any)).toThrow(ConfigError)
    expect(() => validateAgentConfig({ name: "test" } as any)).toThrow("Provider is required")
  })

  it("throws if temperature is out of range", () => {
    expect(() => validateAgentConfig({ name: "test", provider: "groq", temperature: -1 })).toThrow()
    expect(() => validateAgentConfig({ name: "test", provider: "groq", temperature: 3 })).toThrow()
  })

  it("allows temperature at boundaries", () => {
    expect(() => validateAgentConfig({ name: "test", provider: "groq", temperature: 0 })).not.toThrow()
    expect(() => validateAgentConfig({ name: "test", provider: "groq", temperature: 2 })).not.toThrow()
  })

  it("throws if maxRetries < 0", () => {
    expect(() => validateAgentConfig({ name: "test", provider: "groq", maxRetries: -1 })).toThrow()
  })
})

describe("buildSystemPrompt", () => {
  it("creates a default prompt when no systemPrompt given", () => {
    const prompt = buildSystemPrompt({ name: "Bob", provider: "groq" })
    expect(prompt).toContain("You are Bob")
  })

  it("uses the provided systemPrompt", () => {
    const prompt = buildSystemPrompt({
      name: "Bob",
      provider: "groq",
      systemPrompt: "You are helpful.",
    })
    expect(prompt).toBe("You are helpful.")
  })

  it("includes personality when provided", () => {
    const prompt = buildSystemPrompt({
      name: "Bob",
      provider: "groq",
      personality: { tone: "friendly", traits: ["smart", "funny"] },
    })
    expect(prompt).toContain("Tone: friendly")
    expect(prompt).toContain("Traits: smart, funny")
  })

  it("includes goals when provided", () => {
    const prompt = buildSystemPrompt({
      name: "Bob",
      provider: "groq",
      goals: [{ description: "Help users" }, { description: "Be concise" }],
    })
    expect(prompt).toContain("Help users")
    expect(prompt).toContain("Be concise")
  })

  it("includes constraints when provided", () => {
    const prompt = buildSystemPrompt({
      name: "Bob",
      provider: "groq",
      constraints: [{ description: "Do not use emojis" }],
    })
    expect(prompt).toContain("Do not use emojis")
  })

  it("includes tools section when tools are defined", () => {
    const prompt = buildSystemPrompt({
      name: "Bob",
      provider: "groq",
      tools: [{ definition: { name: "calc", description: "", parameters: {}, required: [] }, execute: async () => ({}), toJSON: function () { return this.definition } }],
    })
    expect(prompt).toContain("calc")
    expect(prompt).toContain("You have access to these tools")
  })
})

describe("ContextManager", () => {
  it("starts with no messages", () => {
    const ctx = new ContextManager()
    expect(ctx.getMessages()).toEqual([])
  })

  it("adds messages", () => {
    const ctx = new ContextManager()
    ctx.add({ role: "user", content: "hello" })
    expect(ctx.getMessages()).toHaveLength(1)
    expect(ctx.getMessages()[0].content).toBe("hello")
  })

  it("trims to maxMessages", () => {
    const ctx = new ContextManager({ maxMessages: 3 })
    ctx.add({ role: "user", content: "1" })
    ctx.add({ role: "assistant", content: "2" })
    ctx.add({ role: "user", content: "3" })
    ctx.add({ role: "assistant", content: "4" })
    expect(ctx.getMessages().length).toBeLessThanOrEqual(3)
  })

  it("preserves system message when trimming", () => {
    const ctx = new ContextManager({ maxMessages: 3 })
    ctx.add({ role: "system", content: "sys" })
    ctx.add({ role: "user", content: "1" })
    ctx.add({ role: "assistant", content: "2" })
    ctx.add({ role: "user", content: "3" })
    ctx.add({ role: "assistant", content: "4" })
    const msgs = ctx.getMessages()
    expect(msgs[0].role).toBe("system")
    expect(msgs[0].content).toBe("sys")
  })

  it("clears all messages except system when preserveSystem is true", () => {
    const ctx = new ContextManager()
    ctx.add({ role: "system", content: "sys" })
    ctx.add({ role: "user", content: "hello" })
    ctx.clear()
    const msgs = ctx.getMessages()
    expect(msgs).toHaveLength(1)
    expect(msgs[0].role).toBe("system")
  })

  it("clears all messages when preserveSystem is false", () => {
    const ctx = new ContextManager({ preserveSystem: false })
    ctx.add({ role: "system", content: "sys" })
    ctx.add({ role: "user", content: "hello" })
    ctx.clear()
    expect(ctx.getMessages()).toEqual([])
  })

  it("calculates total tokens", () => {
    const ctx = new ContextManager()
    ctx.add({ role: "user", content: "abcd" })
    ctx.add({ role: "user", content: "efgh" })
    expect(ctx.getTotalTokens()).toBe(2)
  })

  it("converts to JSON", () => {
    const ctx = new ContextManager()
    ctx.add({ role: "user", content: "hello" })
    expect(ctx.toJSON()).toEqual([{ role: "user", content: "hello" }])
  })
})
