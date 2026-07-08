import type { WorkflowStepConfig, WorkflowStepResult } from "@lupaflow/types"
import { Agent } from "@lupaflow/agent"
import { generateId } from "@lupaflow/core"

export class WorkflowStep {
  public config: WorkflowStepConfig
  public result?: WorkflowStepResult

  constructor(config: WorkflowStepConfig) {
    this.config = { ...config, id: config.id || generateId() }
  }

  async execute(input?: unknown): Promise<WorkflowStepResult> {
    const start = Date.now()

    try {
      let output: unknown

      switch (this.config.type) {
        case "agent": {
          if (!this.config.agent) throw new Error("Agent config required for agent step")
          const agent = new Agent(this.config.agent)
          const agentInput = this.config.input || input
          const result = await agent.run(typeof agentInput === "string" ? agentInput : JSON.stringify(agentInput))
          output = result.output
          break
        }
        case "tool": {
          if (!this.config.tool) throw new Error("Tool required for tool step")
          const toolInput = this.config.input || input
          output = await this.config.tool.execute(toolInput as Record<string, unknown>)
          break
        }
        case "transform": {
          if (!this.config.transform) throw new Error("Transform function required for transform step")
          output = this.config.transform(input)
          break
        }
        case "condition": {
          if (!this.config.condition) throw new Error("Condition function required for condition step")
          output = this.config.condition(input)
          break
        }
        default: {
          output = input
        }
      }

      const durationMs = Date.now() - start
      this.result = {
        id: this.config.id,
        name: this.config.name,
        type: this.config.type,
        status: "success",
        input,
        output,
        durationMs,
      }

      this.config.onComplete?.(output)
      return this.result!
    } catch (err: any) {
      const durationMs = Date.now() - start
      this.result = {
        id: this.config.id,
        name: this.config.name,
        type: this.config.type,
        status: "failed",
        input,
        durationMs,
        error: err.message,
      }
      this.config.onError?.(err)
      return this.result!
    }
  }
}
