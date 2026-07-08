import { GoogleGenerativeAI } from "@google/generative-ai"
import type { LLMProvider } from "./interface"
import type { CompletionRequest, CompletionResponse, ProviderConfig } from "@lupaflow/types"
import { ProviderError } from "@lupaflow/core"
import { getGoogleKey } from "@lupaflow/secrets"
import { globalEventBus } from "@lupaflow/core"

export class GoogleProvider implements LLMProvider {
  readonly name = "google"
  readonly defaultModel = "gemini-1.5-flash"
  config: ProviderConfig

  private client: GoogleGenerativeAI

  constructor(config: ProviderConfig = {}) {
    this.config = config
    this.client = new GoogleGenerativeAI(config.apiKey || getGoogleKey())
  }

  validateConfig(): boolean {
    try {
      getGoogleKey()
      return true
    } catch {
      return false
    }
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const start = Date.now()
    const model = request.model || this.config.model || this.defaultModel

    await globalEventBus.emit("provider:start", {
      provider: this.name,
      model,
    } as any)

    try {
      const genModel = this.client.getGenerativeModel({ model })

      const systemInstruction = request.systemPrompt
      const contents: any[] = []

      for (const msg of request.messages) {
        if (msg.role === "system") continue
        const role = msg.role === "assistant" ? "model" : "user"
        contents.push({
          role,
          parts: [{ text: msg.content }],
        })
      }

      const requestOptions: any = {
        contents,
        generationConfig: {
          temperature: request.temperature ?? this.config.temperature,
          maxOutputTokens: request.maxTokens ?? this.config.maxTokens,
          topP: request.topP ?? this.config.topP,
        },
      }

      if (systemInstruction) {
        requestOptions.systemInstruction = {
          role: "user",
          parts: [{ text: systemInstruction }],
        }
      }

      const result = await genModel.generateContent(requestOptions)

      const latencyMs = Date.now() - start
      const response = result.response
      const text = response.text()

      const usage: any = response.usageMetadata || {}
      const totalTokens = (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0)

      const completionResponse: CompletionResponse = {
        content: text,
        toolCalls: [],
        usage: {
          promptTokens: usage.promptTokenCount || 0,
          completionTokens: usage.candidatesTokenCount || 0,
          totalTokens,
        },
        model,
        latencyMs,
        finishReason: "stop",
      }

      await globalEventBus.emit("provider:complete", {
        provider: this.name,
        model,
        tokens: totalTokens,
        latencyMs,
      } as any)

      return completionResponse
    } catch (err: any) {
      const latencyMs = Date.now() - start
      await globalEventBus.emit("provider:error", {
        provider: this.name,
        model,
        error: err.message,
      } as any)
      throw new ProviderError(this.name, err.message, { model, latencyMs })
    }
  }

  async getModels(): Promise<string[]> {
    return ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"]
  }
}
