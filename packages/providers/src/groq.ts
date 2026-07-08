import OpenAI from "openai"
import type { LLMProvider } from "./interface"
import type { CompletionRequest, CompletionResponse, ProviderConfig } from "@lupaflow/types"
import { ProviderError } from "@lupaflow/core"
import { getGroqKey } from "@lupaflow/secrets"
import { globalEventBus } from "@lupaflow/core"

export class GroqProvider implements LLMProvider {
  readonly name = "groq"
  readonly defaultModel = "llama-3.1-70b-versatile"
  config: ProviderConfig

  private client: OpenAI

  constructor(config: ProviderConfig = {}) {
    this.config = config
    this.client = new OpenAI({
      apiKey: config.apiKey || getGroqKey(),
      baseURL: config.baseUrl || "https://api.groq.com/openai/v1",
    })
  }

  validateConfig(): boolean {
    try {
      getGroqKey()
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
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []
      if (request.systemPrompt) {
        messages.push({ role: "system", content: request.systemPrompt })
      }
      for (const m of request.messages) {
        messages.push({ role: m.role as any, content: m.content })
      }

      const tools = request.tools?.map((t) => ({
        type: "function" as const,
        function: {
          name: t.definition.name,
          description: t.definition.description,
          parameters: {
            type: "object",
            properties: t.definition.parameters,
            required: t.definition.required,
          },
        },
      }))

      const response = await this.client.chat.completions.create({
        model,
        messages,
        tools,
        temperature: request.temperature ?? this.config.temperature,
        max_tokens: request.maxTokens ?? this.config.maxTokens,
        top_p: request.topP ?? this.config.topP,
      })

      const choice = response.choices[0]
      const latencyMs = Date.now() - start

      const result: CompletionResponse = {
        content: choice.message.content,
        toolCalls: (choice.message.tool_calls || []).map((tc) => ({
          id: tc.id,
          name: tc.function.name,
          args: JSON.parse(tc.function.arguments),
        })),
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        model: response.model,
        latencyMs,
        finishReason: choice.finish_reason || "stop",
      }

      await globalEventBus.emit("provider:complete", {
        provider: this.name,
        model,
        tokens: result.usage.totalTokens,
        latencyMs,
      } as any)

      return result
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
    try {
      const response = await fetch("https://api.groq.com/openai/v1/models", {
        headers: {
          Authorization: `Bearer ${getGroqKey()}`,
        },
      })
      const data: any = await response.json()
      return data.data?.map((m: any) => m.id) || []
    } catch {
      return [this.defaultModel]
    }
  }
}
