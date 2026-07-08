import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@lupaflow/secrets", () => ({
  getOpenRouterKey: () => "sk-or-mock",
  getGoogleKey: () => "ai-mock",
  getGroqKey: () => "gsk-mock",
}))

import { providerRegistry } from "@lupaflow/providers"

describe("providerRegistry", () => {
  it("has all three providers registered", () => {
    const list = providerRegistry.list()
    expect(list).toContain("openrouter")
    expect(list).toContain("google")
    expect(list).toContain("groq")
  })

  it("checks provider existence", () => {
    expect(providerRegistry.has("groq")).toBe(true)
    expect(providerRegistry.has("nonexistent")).toBe(false)
  })

  it("returns a provider instance", () => {
    const provider = providerRegistry.get("groq")
    expect(provider.name).toBe("groq")
    expect(provider.defaultModel).toBe("llama-3.3-70b-versatile")
  })

  it("returns the same cached instance on repeated calls", () => {
    const a = providerRegistry.get("groq")
    const b = providerRegistry.get("groq")
    expect(a).toBe(b)
  })

  it("creates separate instances with different configs", () => {
    const a = providerRegistry.get("groq")
    const b = providerRegistry.get("groq", { model: "other-model" })
    expect(a).not.toBe(b)
  })

  it("each provider has validateConfig", () => {
    const p = providerRegistry.get("groq")
    expect(typeof p.validateConfig).toBe("function")
  })

  it("throws for unknown provider", () => {
    expect(() => providerRegistry.get("unknown" as any)).toThrow()
  })
})
