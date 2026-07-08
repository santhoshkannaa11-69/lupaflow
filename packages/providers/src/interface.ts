import type { CompletionRequest, CompletionResponse, ProviderConfig } from "@lupaflow/types"

export interface LLMProvider {
  readonly name: string
  readonly defaultModel: string
  config: ProviderConfig

  complete(request: CompletionRequest): Promise<CompletionResponse>
  getModels?(): Promise<string[]>
  validateConfig(): boolean
}
