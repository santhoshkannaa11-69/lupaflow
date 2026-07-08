import type { WorkflowConfig, WorkflowResult, WorkflowStepConfig } from "@lupaflow/types"
import { WorkflowStep } from "./step"
import { Pipeline } from "./pipeline"
import { generateId } from "@lupaflow/core"
import { globalEventBus } from "@lupaflow/core"
import { WorkflowError } from "@lupaflow/core"

export class WorkflowEngine {
  public config: WorkflowConfig
  public results: WorkflowResult[] = []

  constructor(config: WorkflowConfig) {
    this.config = { ...config, id: config.id || generateId() }
  }

  static fromPipeline(name: string, pipeline: Pipeline, description?: string): WorkflowEngine {
    return new WorkflowEngine({
      name,
      description,
      steps: pipeline.getSteps(),
    })
  }

  async run(initialInput?: unknown): Promise<WorkflowResult> {
    const start = Date.now()
    const stepResults = []

    await globalEventBus.emit("workflow:start", {
      steps: this.config.steps.length,
    } as any)

    let currentInput = initialInput

    for (let i = 0; i < this.config.steps.length; i++) {
      const stepConfig = this.config.steps[i]
      const step = new WorkflowStep(stepConfig)

      await globalEventBus.emit("workflow:step", {
        step: i + 1,
        stepName: stepConfig.name,
        status: "running",
      } as any)

      const stepResult = await step.execute(currentInput)
      stepResults.push(stepResult)

      await globalEventBus.emit("workflow:step", {
        step: i + 1,
        stepName: stepConfig.name,
        status: stepResult.status === "success" ? "completed" : "failed",
      } as any)

      if (stepResult.status === "failed") {
        if (this.config.maxRetries && i < this.config.steps.length - 1) {
          stepResult.status = "success"
        } else {
          const result: WorkflowResult = {
            id: this.config.id!,
            name: this.config.name,
            success: false,
            steps: stepResults,
            durationMs: Date.now() - start,
            error: stepResult.error,
          }

          await globalEventBus.emit("workflow:complete", {
            totalSteps: this.config.steps.length,
            failedSteps: stepResults.filter((s) => s.status === "failed").length,
            durationMs: result.durationMs,
          } as any)

          this.config.onError?.(new WorkflowError(stepResult.error!, stepConfig.id))
          this.results.push(result)
          return result
        }
      }

      currentInput = stepResult.output
    }

    const durationMs = Date.now() - start
    const result: WorkflowResult = {
      id: this.config.id!,
      name: this.config.name,
      success: true,
      steps: stepResults,
      durationMs,
    }

    await globalEventBus.emit("workflow:complete", {
      totalSteps: this.config.steps.length,
      failedSteps: 0,
      durationMs,
    } as any)

    this.config.onComplete?.(stepResults.map((s) => s.output))
    this.results.push(result)
    return result
  }
}
