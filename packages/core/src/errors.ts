export class LupaError extends Error {
  public code: string
  public details?: Record<string, unknown>

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message)
    this.name = "LupaError"
    this.code = code
    this.details = details
  }
}

export class ProviderError extends LupaError {
  public provider: string

  constructor(provider: string, message: string, details?: Record<string, unknown>) {
    super(`[${provider}] ${message}`, "PROVIDER_ERROR", details)
    this.name = "ProviderError"
    this.provider = provider
  }
}

export class ToolError extends LupaError {
  public tool: string

  constructor(tool: string, message: string, details?: Record<string, unknown>) {
    super(`[${tool}] ${message}`, "TOOL_ERROR", details)
    this.name = "ToolError"
    this.tool = tool
  }
}

export class MemoryError extends LupaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "MEMORY_ERROR", details)
    this.name = "MemoryError"
  }
}

export class ConfigError extends LupaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "CONFIG_ERROR", details)
    this.name = "ConfigError"
  }
}

export class WorkflowError extends LupaError {
  public stepId?: string

  constructor(message: string, stepId?: string, details?: Record<string, unknown>) {
    super(message, "WORKFLOW_ERROR", { stepId, ...details })
    this.name = "WorkflowError"
    this.stepId = stepId
  }
}

export class RetryError extends LupaError {
  public attempts: number
  public lastError: Error

  constructor(message: string, attempts: number, lastError: Error) {
    super(message, "RETRY_ERROR", { attempts, lastError: lastError.message })
    this.name = "RetryError"
    this.attempts = attempts
    this.lastError = lastError
  }
}
