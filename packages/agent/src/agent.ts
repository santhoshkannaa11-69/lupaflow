import type { AgentConfig, Tool, ProviderName, Personality, Goal, Constraint } from "@lupaflow/types"
import { MemoryStore } from "@lupaflow/memory"
import { AgentRunner, AgentRunOptions, AgentRunResult } from "./runner"
import { validateAgentConfig } from "./config"
import { generateId } from "@lupaflow/core"
import { toolRegistry } from "@lupaflow/tools"

export class Agent {
  public config: AgentConfig
  private memoryStore?: MemoryStore

  constructor(config: AgentConfig) {
    validateAgentConfig(config)
    this.config = {
      ...config,
      id: config.id || generateId(),
    }
  }

  tool(t: Tool): this {
    this.config.tools = this.config.tools || []
    this.config.tools.push(t)
    return this
  }

  useTool(name: string): this {
    try {
      const tool = toolRegistry.get(name)
      this.config.tools = this.config.tools || []
      this.config.tools.push(tool)
    } catch {
      throw new Error(`Tool "${name}" not found in registry`)
    }
    return this
  }

  memory(memory: MemoryStore): this {
    this.memoryStore = memory
    return this
  }

  personality(p: Personality): this {
    this.config.personality = p
    return this
  }

  goal(g: Goal): this {
    this.config.goals = this.config.goals || []
    this.config.goals.push(g)
    return this
  }

  constraint(c: Constraint): this {
    this.config.constraints = this.config.constraints || []
    this.config.constraints.push(c)
    return this
  }

  temperature(t: number): this {
    this.config.temperature = t
    return this
  }

  model(m: string): this {
    this.config.model = m
    return this
  }

  async run(input: string, options?: Partial<AgentRunOptions>): Promise<AgentRunResult> {
    const runner = new AgentRunner(this.config, this.memoryStore)
    return runner.run({
      input,
      ...options,
    })
  }
}
