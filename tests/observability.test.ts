import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockOn, mockOnAny, mockEmit } = vi.hoisted(() => ({
  mockOn: vi.fn(),
  mockOnAny: vi.fn(),
  mockEmit: vi.fn(),
}))

const { generateIdMock } = vi.hoisted(() => {
  let counter = 0
  return { generateIdMock: vi.fn(() => `test-id-${++counter}`) }
})

vi.mock("@lupaflow/core", () => ({
  generateId: generateIdMock,
  globalEventBus: {
    on: mockOn,
    onAny: mockOnAny,
    emit: mockEmit,
    getHistory: vi.fn(() => []),
    clearHistory: vi.fn(),
    removeAllListeners: vi.fn(),
  },
}))

vi.mock("pino", () => ({
  default: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
  })),
}))

import { Tracer, globalTracer } from "@lupaflow/observability"
import { UsageTracker } from "@lupaflow/observability"

describe("Tracer", () => {
  let tracer: Tracer

  beforeEach(() => {
    tracer = new Tracer()
  })

  it("starts a span", () => {
    const id = tracer.start("test-span")
    expect(id).toMatch(/^test-id-\d+$/)
    const span = tracer.getTrace(id)
    expect(span).toBeDefined()
    expect(span!.name).toBe("test-span")
    expect(span!.status).toBe("open")
  })

  it("starts a span with metadata", () => {
    const id = tracer.start("test", { foo: "bar" })
    const span = tracer.getTrace(id)
    expect(span!.metadata).toEqual({ foo: "bar" })
  })

  it("ends a span", () => {
    const id = tracer.start("test")
    tracer.end(id)
    const span = tracer.getTrace(id)
    expect(span!.status).toBe("closed")
    expect(span!.endTime).toBeDefined()
  })

  it("ends a span with metadata", () => {
    const id = tracer.start("test")
    tracer.end(id, { result: "ok" })
    const span = tracer.getTrace(id)
    expect(span!.metadata).toHaveProperty("result", "ok")
  })

  it("marks a span as error", () => {
    const id = tracer.start("test")
    tracer.error(id, "something went wrong")
    const span = tracer.getTrace(id)
    expect(span!.status).toBe("error")
    expect(span!.metadata).toHaveProperty("error", "something went wrong")
  })

  it("end does nothing for unknown span", () => {
    expect(() => tracer.end("nope")).not.toThrow()
  })

  it("error does nothing for unknown span", () => {
    expect(() => tracer.error("nope", "err")).not.toThrow()
  })

  it("getTrace returns undefined for unknown span", () => {
    expect(tracer.getTrace("nope")).toBeUndefined()
  })

  it("getActiveSpans returns only open spans", () => {
    const id1 = tracer.start("open")
    const id2 = tracer.start("to-close")
    tracer.end(id2)
    const active = tracer.getActiveSpans()
    expect(active).toHaveLength(1)
    expect(active[0].id).toBe(id1)
  })

  it("getAllSpans returns all spans", () => {
    tracer.start("a")
    tracer.start("b")
    expect(tracer.getAllSpans()).toHaveLength(2)
  })

  it("clear removes all spans", () => {
    tracer.start("a")
    tracer.clear()
    expect(tracer.getAllSpans()).toEqual([])
    expect(tracer.getActiveSpans()).toEqual([])
  })

  it("creates parent-child spans", () => {
    const parentId = tracer.start("parent")
    const childId = tracer.start("child")
    const child = tracer.getTrace(childId)
    expect(child!.parentId).toBe(parentId)
  })
})

describe("globalTracer", () => {
  it("is a Tracer instance", () => {
    expect(globalTracer).toBeInstanceOf(Tracer)
  })

  it("can start and end spans", () => {
    const id = globalTracer.start("global-test")
    expect(id).toBeDefined()
    globalTracer.end(id)
    const span = globalTracer.getTrace(id)
    expect(span!.status).toBe("closed")
  })
})

describe("UsageTracker", () => {
  let tracker: UsageTracker

  beforeEach(() => {
    mockOn.mockClear()
    mockEmit.mockClear()
    tracker = new UsageTracker()
  })

  it("registers provider:complete listener on construction", () => {
    const calls = mockOn.mock.calls.filter((c: any[]) => c[0] === "provider:complete")
    expect(calls.length).toBeGreaterThanOrEqual(1)
  })

  it("initial state is zero", () => {
    expect(tracker.getTotalTokens()).toBe(0)
    expect(tracker.getTotalCost()).toBe(0)
    expect(tracker.getRecords()).toEqual([])
    const summary = tracker.getSummary()
    expect(summary.totalCalls).toBe(0)
    expect(summary.avgLatencyMs).toBe(0)
  })

  it("reset clears all state", () => {
    const handler = mockOn.mock.calls.find((c: any[]) => c[0] === "provider:complete")
    if (handler) handler[1]({ provider: "openai", model: "gpt-4o", tokens: 100, latencyMs: 500, timestamp: Date.now(), name: "provider:complete" })
    tracker.reset()
    expect(tracker.getTotalTokens()).toBe(0)
    expect(tracker.getTotalCost()).toBe(0)
    expect(tracker.getRecords()).toEqual([])
  })
})

describe("@lupaflow/observability exports", () => {
  it("exports Tracer", () => {
    expect(Tracer).toBeDefined()
  })
  it("exports globalTracer", () => {
    expect(globalTracer).toBeDefined()
  })
  it("exports UsageTracker", () => {
    expect(UsageTracker).toBeDefined()
  })
})
