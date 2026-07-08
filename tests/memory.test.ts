import { describe, it, expect, beforeEach, vi } from "vitest"
import { ShortTermMemory, SessionMemory, UserMemory, MemoryStore } from "@lupaflow/memory"

vi.mock("fs/promises", () => ({
  readFile: vi.fn().mockResolvedValue("[]"),
  writeFile: vi.fn().mockResolvedValue(undefined),
  access: vi.fn().mockRejectedValue(new Error("not found")),
  mkdir: vi.fn().mockResolvedValue(undefined),
  readdir: vi.fn().mockResolvedValue([]),
}))

describe("ShortTermMemory", () => {
  let mem: ShortTermMemory

  beforeEach(() => {
    mem = new ShortTermMemory()
  })

  it("stores and retrieves entries", async () => {
    await mem.store({ id: "1", type: "short-term", key: "test", content: "hello", timestamp: Date.now() })
    const results = await mem.retrieve({ key: "test" })
    expect(results).toHaveLength(1)
    expect(results[0].content).toBe("hello")
  })

  it("returns empty array for missing key", async () => {
    const results = await mem.retrieve({ key: "missing" })
    expect(results).toEqual([])
  })

  it("deletes entries", async () => {
    await mem.store({ id: "1", type: "short-term", key: "test", content: "hello", timestamp: Date.now() })
    await mem.delete("test")
    const results = await mem.retrieve({ key: "test" })
    expect(results).toEqual([])
  })

  it("clears all entries", async () => {
    await mem.store({ id: "1", type: "short-term", key: "a", content: "1", timestamp: Date.now() })
    await mem.store({ id: "2", type: "short-term", key: "b", content: "2", timestamp: Date.now() })
    await mem.clear()
    expect(await mem.retrieve({})).toEqual([])
  })

  it("supports search", async () => {
    await mem.store({ id: "1", type: "short-term", key: "k1", content: "hello world", timestamp: Date.now() })
    await mem.store({ id: "2", type: "short-term", key: "k2", content: "goodbye world", timestamp: Date.now() })
    const results = await mem.search("hello")
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results.some((r) => r.entry.content.includes("hello"))).toBe(true)
  })
})

describe("SessionMemory", () => {
  let mem: SessionMemory

  beforeEach(() => {
    mem = new SessionMemory()
  })

  it("stores and retrieves entries", async () => {
    await mem.store({ id: "1", type: "session", key: "msg", content: "hi", timestamp: Date.now() })
    const results = await mem.retrieve({ key: "msg" })
    expect(results).toHaveLength(1)
    expect(results[0].content).toBe("hi")
  })

  it("clears entries", async () => {
    await mem.store({ id: "1", type: "session", key: "msg", content: "hi", timestamp: Date.now() })
    await mem.clear()
    expect(await mem.retrieve({})).toEqual([])
  })
})

describe("UserMemory", () => {
  let mem: UserMemory

  beforeEach(() => {
    mem = new UserMemory("test-user")
  })

  it("stores entries with user prefix", async () => {
    await mem.store({ id: "1", type: "user", key: "pref", content: "dark mode", timestamp: Date.now() })
    const results = await mem.retrieve({ key: "pref" })
    expect(results).toHaveLength(1)
    expect(results[0].content).toBe("dark mode")
  })
})

describe("MemoryStore", () => {
  it("creates default backends", () => {
    const store = new MemoryStore()
    expect(store.get("short-term")).toBeDefined()
    expect(store.get("session")).toBeDefined()
  })

  it("does not create disabled backends", () => {
    const store = new MemoryStore({ shortTerm: false, session: false })
    expect(() => store.get("short-term")).toThrow()
    expect(() => store.get("session")).toThrow()
  })

  it("creates optional backends when enabled", () => {
    const store = new MemoryStore({ longTerm: true, semantic: true, project: true })
    expect(store.get("long-term")).toBeDefined()
    expect(store.get("semantic")).toBeDefined()
    expect(store.get("project")).toBeDefined()
  })

  it("creates user backend with user id", () => {
    const store = new MemoryStore({ user: "alice" })
    expect(store.get("user")).toBeDefined()
  })

  it("registers custom backends", () => {
    const store = new MemoryStore({ shortTerm: false, session: false })
    const backend = new ShortTermMemory()
    store.register("short-term", backend)
    expect(store.get("short-term")).toBe(backend)
  })

  it("throws for unregistered backend", () => {
    const store = new MemoryStore({ shortTerm: false, session: false })
    expect(() => store.get("short-term")).toThrow()
  })

  it("stores across all backends", async () => {
    const store = new MemoryStore({ longTerm: true })
    await store.store({ id: "1", type: "long-term", key: "k", content: "v", timestamp: Date.now() })
    const results = await store.retrieve({ type: "long-term", key: "k" })
    expect(results).toHaveLength(1)
    expect(results[0].content).toBe("v")
  })

  it("deletes across all backends", async () => {
    const store = new MemoryStore()
    await store.store({ id: "1", type: "short-term", key: "k", content: "v", timestamp: Date.now() })
    await store.delete("k")
    const results = await store.retrieve({ key: "k" })
    expect(results).toEqual([])
  })

  it("clears all backends", async () => {
    const store = new MemoryStore()
    await store.store({ id: "1", type: "short-term", key: "k", content: "v", timestamp: Date.now() })
    await store.clear()
    expect(await store.retrieve({ key: "k" })).toEqual([])
  })
})
