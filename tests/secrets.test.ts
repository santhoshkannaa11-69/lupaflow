import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("conf", () => {
  const store = new Map<string, any>()
  store.set("apiKeys", {})
  return {
    default: class MockConf {
      get(key: string) { return store.get(key) }
      set(key: string, value: any) { store.set(key, value) }
      has(key: string) { return store.has(key) }
      delete(key: string) { return store.delete(key) }
    },
  }
})

import { SecretsManager, getGroqKey, getOpenRouterKey, getGoogleKey } from "@lupaflow/secrets"

describe("SecretsManager", () => {
  beforeEach(() => {
    delete process.env.GROQ_API_KEY
    delete process.env.OPENROUTER_API_KEY
    delete process.env.GOOGLE_API_KEY
    SecretsManager.clear()
    SecretsManager.init()
  })

  it("getGroqKey returns env var when set", () => {
    process.env.GROQ_API_KEY = "gsk-env-test"
    expect(getGroqKey()).toBe("gsk-env-test")
  })

  it("getOpenRouterKey returns env var when set", () => {
    process.env.OPENROUTER_API_KEY = "sk-or-env-test"
    expect(getOpenRouterKey()).toBe("sk-or-env-test")
  })

  it("getGoogleKey returns env var when set", () => {
    process.env.GOOGLE_API_KEY = "ai-env-test"
    expect(getGoogleKey()).toBe("ai-env-test")
  })

  it("SecretsManager.set stores a value", () => {
    SecretsManager.set("my-custom-key", "my-value")
    expect(SecretsManager.get("my-custom-key")).toBe("my-value")
  })

  it("SecretsManager.delete removes a value", () => {
    SecretsManager.set("my-test-key", "val")
    SecretsManager.delete("my-test-key")
    expect(SecretsManager.get("my-test-key")).toBeUndefined()
  })

  it("getGroqKey throws when not set", () => {
    expect(() => getGroqKey()).toThrow()
  })

  it("getOpenRouterKey throws when not set", () => {
    expect(() => getOpenRouterKey()).toThrow()
  })

  it("getGoogleKey throws when not set", () => {
    expect(() => getGoogleKey()).toThrow()
  })
})
