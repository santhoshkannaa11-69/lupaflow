import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@lupaflow/core", () => ({
  generateId: vi.fn(() => "mock-id"),
  globalEventBus: {
    on: vi.fn(),
    onAny: vi.fn(),
    emit: vi.fn(),
    getHistory: vi.fn(() => []),
    clearHistory: vi.fn(),
    removeAllListeners: vi.fn(),
  },
}))

vi.mock("@lupaflow/agent", () => ({
  Agent: class MockAgent {
    async run(task: string) {
      return { output: `Processed: ${task}` }
    }
  },
}))

import { Team } from "@lupaflow/multi-agent"
import { AgentCommunicator } from "@lupaflow/multi-agent"
import { Orchestrator } from "@lupaflow/multi-agent"

const dummyConfig: any = {
  name: "bot",
  provider: "groq",
  model: "llama-3.3-70b-versatile",
  systemPrompt: "You are a helpful assistant",
}

describe("Team", () => {
  it("creates a team with members", () => {
    const team = new Team({
      name: "test-team",
      members: [
        { id: "1", name: "Alice", role: "researcher", agentConfig: dummyConfig },
        { id: "2", name: "Bob", role: "writer", agentConfig: dummyConfig },
      ],
    })
    expect(team.config.name).toBe("test-team")
    expect(team.config.members).toHaveLength(2)
  })

  it("auto-assigns IDs to members missing them", () => {
    const team = new Team({
      name: "t",
      members: [
        { id: "1", name: "A", role: "r", agentConfig: dummyConfig },
        { name: "B", role: "w", agentConfig: dummyConfig } as any,
      ],
    })
    expect(team.config.members[0].id).toBe("1")
    expect(team.config.members[1].id).toBe("mock-id")
  })

  it("getMember finds by id", () => {
    const team = new Team({
      name: "t",
      members: [
        { id: "1", name: "Alice", role: "r", agentConfig: dummyConfig },
      ],
    })
    const m = team.getMember("1")
    expect(m).toBeDefined()
    expect(m!.name).toBe("Alice")
  })

  it("getMember finds by name", () => {
    const team = new Team({
      name: "t",
      members: [
        { id: "1", name: "Alice", role: "r", agentConfig: dummyConfig },
      ],
    })
    const m = team.getMember("Alice")
    expect(m).toBeDefined()
    expect(m!.id).toBe("1")
  })

  it("getMember returns undefined for unknown", () => {
    const team = new Team({
      name: "t",
      members: [],
    })
    expect(team.getMember("nobody")).toBeUndefined()
  })

  it("getLeader returns designated leader", () => {
    const team = new Team({
      name: "t",
      leader: "2",
      members: [
        { id: "1", name: "A", role: "r", agentConfig: dummyConfig },
        { id: "2", name: "B", role: "l", agentConfig: dummyConfig },
      ],
    })
    const leader = team.getLeader()
    expect(leader!.name).toBe("B")
  })

  it("getLeader returns first member if no leader set", () => {
    const team = new Team({
      name: "t",
      members: [
        { id: "1", name: "Alice", role: "r", agentConfig: dummyConfig },
      ],
    })
    expect(team.getLeader()!.name).toBe("Alice")
  })

  it("getLeader returns undefined for empty team", () => {
    const team = new Team({ name: "t", members: [] })
    expect(team.getLeader()).toBeUndefined()
  })

  it("getByRole filters members by role", () => {
    const team = new Team({
      name: "t",
      members: [
        { id: "1", name: "A", role: "researcher", agentConfig: dummyConfig },
        { id: "2", name: "B", role: "researcher", agentConfig: dummyConfig },
        { id: "3", name: "C", role: "writer", agentConfig: dummyConfig },
      ],
    })
    const researchers = team.getByRole("researcher")
    expect(researchers).toHaveLength(2)
    expect(researchers.map((m) => m.name)).toEqual(["A", "B"])
  })
})

describe("AgentCommunicator", () => {
  let comm: AgentCommunicator

  beforeEach(() => {
    comm = new AgentCommunicator()
  })

  it("sends a message", () => {
    const msg = comm.send("alice", "bob", "hello")
    expect(msg.from).toBe("alice")
    expect(msg.to).toBe("bob")
    expect(msg.content).toBe("hello")
    expect(msg.type).toBe("request")
  })

  it("send returns a message with an id and timestamp", () => {
    const msg = comm.send("a", "b", "c")
    expect(msg.id).toBeDefined()
    expect(msg.timestamp).toBeDefined()
  })

  it("broadcast sends to all", () => {
    const handler = vi.fn()
    comm.on("alice", handler)
    comm.broadcast("system", "announcement")
    expect(handler).toHaveBeenCalled()
    expect(handler.mock.calls[0][0].type).toBe("broadcast")
  })

  it("respond creates a response message", () => {
    const original = comm.send("alice", "bob", "question")
    const response = comm.respond("bob", original.id, "answer")
    expect(response.type).toBe("response")
    expect(response.to).toBe("alice")
    expect(response.content).toBe("answer")
  })

  it("respond notifies the original sender", () => {
    const handler = vi.fn()
    comm.on("alice", handler)
    const original = comm.send("alice", "bob", "question")
    comm.respond("bob", original.id, "answer")
    expect(handler).toHaveBeenCalled()
  })

  it("registers listeners with on()", () => {
    const handler = vi.fn()
    const unsub = comm.on("bob", handler)
    comm.send("alice", "bob", "hi")
    expect(handler).toHaveBeenCalled()
    unsub()
    comm.send("alice", "bob", "hi again")
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it("getHistory returns all messages", () => {
    comm.send("a", "b", "1")
    comm.send("b", "a", "2")
    expect(comm.getHistory()).toHaveLength(2)
  })

  it("clear empties message store", () => {
    comm.send("a", "b", "1")
    comm.clear()
    expect(comm.getHistory()).toEqual([])
  })
})

describe("Orchestrator", () => {
  it("creates an orchestrator with a team", () => {
    const team = new Team({
      name: "test",
      members: [
        { id: "1", name: "Leader", role: "lead", agentConfig: dummyConfig },
      ],
    })
    const orch = new Orchestrator(team)
    expect(orch.getTeam()).toBe(team)
    expect(orch.getCommunicator()).toBeDefined()
  })

  it("run executes and returns OrchestrationResult", async () => {
    const team = new Team({
      name: "test",
      members: [
        { id: "1", name: "Leader", role: "lead", agentConfig: dummyConfig },
      ],
    })
    const orch = new Orchestrator(team)
    const result = await orch.run("do something")
    expect(result.id).toBe("mock-id")
    expect(result.output).toContain("Processed:")
    expect(result.memberOutputs.size).toBe(1)
    expect(result.messages).toBeDefined()
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })

  it("run works with multiple team members", async () => {
    const team = new Team({
      name: "test",
      members: [
        { id: "1", name: "Leader", role: "lead", agentConfig: dummyConfig },
        { id: "2", name: "Helper", role: "worker", agentConfig: dummyConfig },
      ],
    })
    const orch = new Orchestrator(team)
    const result = await orch.run("team task")
    expect(result.memberOutputs.size).toBe(2)
    expect(result.messages.length).toBeGreaterThan(1)
  })

  it("throws if team has no leader and no members", async () => {
    const team = new Team({ name: "empty", members: [] })
    const orch = new Orchestrator(team)
    await expect(orch.run("task")).rejects.toThrow("No leader")
  })
})

describe("@lupaflow/multi-agent exports", () => {
  it("exports Orchestrator", () => {
    expect(Orchestrator).toBeDefined()
  })
  it("exports Team", () => {
    expect(Team).toBeDefined()
  })
  it("exports AgentCommunicator", () => {
    expect(AgentCommunicator).toBeDefined()
  })
})
