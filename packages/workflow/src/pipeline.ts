import type { WorkflowStepConfig } from "@lupaflow/types"

export class Pipeline {
  public steps: WorkflowStepConfig[] = []

  addAgent(name: string, config: Partial<WorkflowStepConfig>): this {
    this.steps.push({
      id: `step-${this.steps.length + 1}`,
      name,
      type: "agent",
      ...config,
    })
    return this
  }

  addTool(name: string, config: Partial<WorkflowStepConfig>): this {
    this.steps.push({
      id: `step-${this.steps.length + 1}`,
      name,
      type: "tool",
      ...config,
    })
    return this
  }

  addTransform(name: string, transform: (input: unknown) => unknown): this {
    this.steps.push({
      id: `step-${this.steps.length + 1}`,
      name,
      type: "transform",
      transform,
    })
    return this
  }

  addCondition(name: string, condition: (input: unknown) => boolean): this {
    this.steps.push({
      id: `step-${this.steps.length + 1}`,
      name,
      type: "condition",
      condition,
    })
    return this
  }

  getSteps(): WorkflowStepConfig[] {
    return [...this.steps]
  }
}
