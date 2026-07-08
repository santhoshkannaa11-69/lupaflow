import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockOnAny, mockEmit } = vi.hoisted(() => ({
  mockOnAny: vi.fn(),
  mockEmit: vi.fn(),
}))

vi.mock("@lupaflow/core", () => ({
  generateId: vi.fn(() => "test-id"),
  globalEventBus: {
    on: vi.fn(),
    onAny: mockOnAny,
    emit: mockEmit,
    getHistory: vi.fn(() => []),
    clearHistory: vi.fn(),
    removeAllListeners: vi.fn(),
  },
}))

vi.mock("fs/promises", () => ({
  readdir: vi.fn().mockResolvedValue([]),
}))

import { pluginManager } from "@lupaflow/plugins"
import type { LupaPlugin } from "@lupaflow/plugins"

describe("pluginManager", () => {
  let testPlugin: LupaPlugin

  beforeEach(async () => {
    await pluginManager.unloadAll()
    testPlugin = {
      name: "test-plugin",
      version: "1.0.0",
      description: "A test plugin",
    }
  })

  it("loads a plugin", async () => {
    await pluginManager.load(testPlugin)
    expect(pluginManager.isLoaded("test-plugin")).toBe(true)
  })

  it("retrieves a loaded plugin by name", async () => {
    await pluginManager.load(testPlugin)
    const p = pluginManager.get("test-plugin")
    expect(p).toBeDefined()
    expect(p!.name).toBe("test-plugin")
  })

  it("lists all loaded plugins", async () => {
    await pluginManager.load(testPlugin)
    const list = pluginManager.list()
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe("test-plugin")
  })

  it("throws when loading a duplicate plugin", async () => {
    await pluginManager.load(testPlugin)
    await expect(pluginManager.load(testPlugin)).rejects.toThrow("already loaded")
  })

  it("unloads a plugin", async () => {
    await pluginManager.load(testPlugin)
    await pluginManager.unload("test-plugin")
    expect(pluginManager.isLoaded("test-plugin")).toBe(false)
  })

  it("throws when unloading an unknown plugin", async () => {
    await expect(pluginManager.unload("unknown")).rejects.toThrow("not found")
  })

  it("calls onLoad when loading", async () => {
    const onLoad = vi.fn()
    await pluginManager.load({ ...testPlugin, onLoad })
    expect(onLoad).toHaveBeenCalledOnce()
  })

  it("calls onUnload when unloading", async () => {
    const onUnload = vi.fn()
    await pluginManager.load({ ...testPlugin, onUnload })
    await pluginManager.unload("test-plugin")
    expect(onUnload).toHaveBeenCalledOnce()
  })

  it("registers onEvent handler on globalEventBus", async () => {
    await pluginManager.load({ ...testPlugin, onEvent: vi.fn() })
    expect(mockOnAny).toHaveBeenCalled()
  })

  it("unloadAll removes all plugins", async () => {
    await pluginManager.load(testPlugin)
    await pluginManager.load({
      name: "another",
      version: "1.0.0",
    })
    await pluginManager.unloadAll()
    expect(pluginManager.list()).toEqual([])
  })
})

describe("@lupaflow/plugins exports", () => {
  it("exports pluginManager", () => {
    expect(pluginManager).toBeDefined()
  })
})
