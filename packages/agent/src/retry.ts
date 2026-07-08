import { delay } from "@lupaflow/core"
import { RetryError } from "@lupaflow/core"
import { globalEventBus } from "@lupaflow/core"

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context?: string
): Promise<T> {
  const cfg: RetryConfig = {
    maxRetries: config.maxRetries ?? 3,
    baseDelay: config.baseDelay ?? 1000,
    maxDelay: config.maxDelay ?? 30000,
    backoffFactor: config.backoffFactor ?? 2,
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      lastError = err
      if (attempt < cfg.maxRetries) {
        const waitTime = Math.min(cfg.baseDelay * Math.pow(cfg.backoffFactor, attempt), cfg.maxDelay)
        await globalEventBus.emit("agent:error", {
          error: err.message,
          retryAttempt: attempt + 1,
        } as any)
        await delay(waitTime)
      }
    }
  }

  throw new RetryError(
    `${context ? `[${context}] ` : ""}Failed after ${cfg.maxRetries + 1} attempts`,
    cfg.maxRetries + 1,
    lastError!
  )
}
