import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  generateId,
  delay,
  truncate,
  estimateTokens,
  deepMerge,
  chunkArray,
  EventBus,
  globalEventBus,
  ConfigError,
  RetryError,
  ProviderError,
  ToolError,
  MemoryError,
  WorkflowError,
} from "@lupaflow/core"

describe("core/utils", () => {
  describe("generateId", () => {
    it("returns a string", () => {
      expect(typeof generateId()).toBe("string")
    })

    it("returns unique values", () => {
      const a = generateId()
      const b = generateId()
      expect(a).not.toBe(b)
    })
  })

  describe("delay", () => {
    it("waits for the specified time", async () => {
      const start = Date.now()
      await delay(50)
      expect(Date.now() - start).toBeGreaterThanOrEqual(45)
    })
  })

  describe("truncate", () => {
    it("returns the string as-is when shorter than max", () => {
      expect(truncate("hello", 10)).toBe("hello")
    })

    it("truncates with ellipsis when longer than max", () => {
      expect(truncate("hello world", 8)).toBe("hello...")
    })

    it("uses the given maxLength", () => {
      const long = "a".repeat(150)
      const result = truncate(long, 100)
      expect(result).toBe("a".repeat(97) + "...")
      expect(result.length).toBe(100)
    })
  })

  describe("estimateTokens", () => {
    it("returns 0 for empty string", () => {
      expect(estimateTokens("")).toBe(0)
    })

    it("returns ~1 token per 4 characters", () => {
      expect(estimateTokens("abcd")).toBe(1)
      expect(estimateTokens("abcdefgh")).toBe(2)
    })

    it("handles null", () => {
      expect(estimateTokens(null)).toBe(0)
    })

    it("handles undefined", () => {
      expect(estimateTokens(undefined)).toBe(0)
    })
  })

  describe("deepMerge", () => {
    it("merges two flat objects", () => {
      const result = deepMerge({ a: 1 }, { b: 2 })
      expect(result).toEqual({ a: 1, b: 2 })
    })

    it("deeply merges nested objects", () => {
      const result = deepMerge({ a: { x: 1 } }, { a: { y: 2 } })
      expect(result).toEqual({ a: { x: 1, y: 2 } })
    })

    it("the second object overwrites the first on conflicts", () => {
      const result = deepMerge({ a: 1 }, { a: 2 })
      expect(result).toEqual({ a: 2 })
    })

    it("does not mutate the originals", () => {
      const a = { x: 1 }
      const b = { y: 2 }
      deepMerge(a, b)
      expect(a).toEqual({ x: 1 })
      expect(b).toEqual({ y: 2 })
    })
  })

  describe("chunkArray", () => {
    it("splits an array into chunks of the given size", () => {
      expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    })

    it("returns the whole array if chunk size >= length", () => {
      expect(chunkArray([1, 2], 5)).toEqual([[1, 2]])
    })

    it("returns an empty array for empty input", () => {
      expect(chunkArray([], 3)).toEqual([])
    })
  })
})

describe("core/errors", () => {
  it("ConfigError has correct name and message", () => {
    const err = new ConfigError("test error")
    expect(err.name).toBe("ConfigError")
    expect(err.message).toBe("test error")
  })

  it("ConfigError accepts details", () => {
    const err = new ConfigError("bad config", { field: "name" })
    expect(err.details).toEqual({ field: "name" })
  })

  it("ProviderError has provider field", () => {
    const err = new ProviderError("groq", "API error", { model: "test" })
    expect(err.name).toBe("ProviderError")
    expect(err.message).toContain("[groq]")
    expect(err.message).toContain("API error")
    expect(err.provider).toBe("groq")
    expect(err.details).toEqual({ model: "test" })
  })

  it("ToolError has tool field", () => {
    const err = new ToolError("calculator", "syntax error")
    expect(err.message).toContain("[calculator]")
    expect(err.message).toContain("syntax error")
    expect(err.tool).toBe("calculator")
  })

  it("MemoryError has correct name", () => {
    const err = new MemoryError("storage full")
    expect(err.name).toBe("MemoryError")
  })

  it("WorkflowError has stepId", () => {
    const err = new WorkflowError("step failed", "step-1")
    expect(err.name).toBe("WorkflowError")
    expect(err.stepId).toBe("step-1")
    expect(err.message).toBe("step failed")
  })

  it("RetryError has attempts", () => {
    const cause = new Error("original")
    const err = new RetryError("failed after retries", 3, cause)
    expect(err.name).toBe("RetryError")
    expect(err.attempts).toBe(3)
    expect(err.details?.lastError).toBe("original")
  })
})

describe("core/EventBus", () => {
  let bus: EventBus

  beforeEach(() => {
    bus = new EventBus()
  })

  it("emits and listens for events", async () => {
    const handler = vi.fn()
    bus.on("test:event", handler)
    await bus.emit("test:event", { data: 1 })
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ data: 1, name: "test:event" })
    )
  })

  it("supports multiple listeners", async () => {
    const h1 = vi.fn()
    const h2 = vi.fn()
    bus.on("test:event", h1)
    bus.on("test:event", h2)
    await bus.emit("test:event", {})
    expect(h1).toHaveBeenCalledOnce()
    expect(h2).toHaveBeenCalledOnce()
  })

  it("removes listeners via returned cleanup function", async () => {
    const handler = vi.fn()
    const cleanup = bus.on("test:event", handler)
    cleanup()
    await bus.emit("test:event", {})
    expect(handler).not.toHaveBeenCalled()
  })

  it("supports once() using the cleanup pattern", async () => {
    const handler = vi.fn()
    const cleanup = bus.on("test:event", () => {
      handler()
      cleanup()
    })
    await bus.emit("test:event", {})
    await bus.emit("test:event", {})
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it("globalEventBus is a singleton", () => {
    expect(globalEventBus).toBeInstanceOf(EventBus)
  })
})
