import type { Message, ToolCall, CompletionResponse, Tool, AgentConfig, MemoryEntry } from "@lupaflow/types"
import { providerRegistry } from "@lupaflow/providers"
import { toolRegistry } from "@lupaflow/tools"
import { ContextManager } from "./context"
import { MemoryStore } from "@lupaflow/memory"
import { withRetry } from "./retry"
import { buildSystemPrompt } from "./config"
import { generateId } from "@lupaflow/core"
import { globalEventBus } from "@lupaflow/core"
import { ToolError } from "@lupaflow/core"
import {
  runBeforeAgentRunHooks,
  runAfterAgentRunHooks,
  runBeforeToolCallHooks,
  runAfterToolCallHooks,
  runBeforeProviderCallHooks,
  runAfterProviderCallHooks,
} from "@lupaflow/plugins"

export interface AgentRunOptions {
  input: string
  sessionId?: string
  onThinking?: (message: string) => void
  onToolCall?: (tool: string, args: Record<string, unknown>) => void
  onToolResult?: (tool: string, result: unknown) => void
}

export interface AgentRunResult {
  id: string
  output: string
  messages: Message[]
  usage: {
    totalTokens: number
    promptTokens: number
    completionTokens: number
  }
  latencyMs: number
  toolCalls: number
  finishReason: string
}

export class AgentRunner {
  private config: AgentConfig
  private context: ContextManager
  private memory?: MemoryStore
  private toolCallCount = 0
  private totalPromptTokens = 0
  private totalCompletionTokens = 0

  constructor(config: AgentConfig, memory?: MemoryStore) {
    this.config = config
    this.context = new ContextManager({
      maxMessages: config.maxContextMessages || 50,
    })
    this.memory = memory
  }

  async run(options: AgentRunOptions): Promise<AgentRunResult> {
    const runId = generateId()
    const startTime = Date.now()
    this.toolCallCount = 0
    this.totalPromptTokens = 0
    this.totalCompletionTokens = 0

    const provider = providerRegistry.get(this.config.provider, {
      model: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      topP: this.config.topP,
    })

    const systemPrompt = buildSystemPrompt(this.config)

    runBeforeAgentRunHooks({
      input: options.input,
      ...this.config,
    } as any)

    this.context.add({ role: "system", content: systemPrompt })
    this.context.add({ role: "user", content: options.input })

    await globalEventBus.emit("agent:start", {
      agentId: this.config.id || this.config.name,
      runId,
      config: this.config as any,
    } as any)

    await globalEventBus.emit("agent:thinking", {
      agentId: this.config.id || this.config.name,
      runId,
      message: options.input,
    } as any)

    let finalContent = ""
    let finishReason = "stop"
    let iterationCount = 0
    const maxIterations = 20

    while (iterationCount < maxIterations) {
      iterationCount++

      const request = runBeforeProviderCallHooks(this.config.provider, {
        model: this.config.model,
        messages: this.context.getMessages(),
        tools: this.config.tools,
        systemPrompt: undefined,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        topP: this.config.topP,
      } as any)

      const response: CompletionResponse = await withRetry(
        () =>
          provider.complete({
            messages: request.messages as Message[] || this.context.getMessages(),
            tools: this.config.tools,
            systemPrompt: undefined,
            temperature: this.config.temperature,
            maxTokens: this.config.maxTokens,
            topP: this.config.topP,
            model: this.config.model,
          }),
        {
          maxRetries: this.config.maxRetries ?? 3,
          baseDelay: this.config.retryDelay ?? 1000,
        },
        this.config.name
      )

      runAfterProviderCallHooks(response as any)

      this.totalPromptTokens += response.usage.promptTokens
      this.totalCompletionTokens += response.usage.completionTokens

      if (response.toolCalls.length > 0) {
        this.context.add({
          role: "assistant",
          content: response.content || null,
          toolCalls: response.toolCalls.map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: { name: tc.name, arguments: JSON.stringify(tc.args) },
          })),
        })
      } else if (response.content) {
        this.context.add({ role: "assistant", content: response.content })
      }

      if (response.toolCalls.length === 0) {
        finalContent = response.content || ""
        finishReason = response.finishReason
        break
      }

      for (const tc of response.toolCalls) {
        this.toolCallCount++
        await globalEventBus.emit("tool:start", {
          agentId: this.config.id || this.config.name,
          runId,
          tool: tc.name,
          args: tc.args,
        } as any)

        options.onToolCall?.(tc.name, tc.args)

        try {
          const tool = this.config.tools?.find((t) => t.definition.name === tc.name)
          if (!tool) throw new ToolError(tc.name, `Tool "${tc.name}" not found on agent`)

          const hookArgs = runBeforeToolCallHooks(tc.name, tc.args as Record<string, unknown>)
          const result = await tool.execute(hookArgs)
          const hookResult = runAfterToolCallHooks(result)
          const resultStr = typeof hookResult === "string" ? hookResult : JSON.stringify(hookResult, null, 2)

          this.context.add({
            role: "tool",
            toolCallId: tc.id,
            name: tc.name,
            content: resultStr,
          })

          await globalEventBus.emit("tool:finish", {
            agentId: this.config.id || this.config.name,
            runId,
            tool: tc.name,
            result: hookResult,
            durationMs: Date.now() - startTime,
          } as any)

          options.onToolResult?.(tc.name, hookResult)
        } catch (err: any) {
          this.context.add({
            role: "tool",
            toolCallId: tc.id,
            name: tc.name,
            content: `Error: ${err.message}`,
          })

          await globalEventBus.emit("tool:error", {
            agentId: this.config.id || this.config.name,
            runId,
            tool: tc.name,
            error: err.message,
          } as any)
        }
      }
    }

    const totalLatency = Date.now() - startTime

    if (this.memory) {
      await this.memory.store({
        id: generateId(),
        type: "short-term",
        key: `agent:${this.config.name}:input:${generateId()}`,
        content: options.input,
        metadata: { runId, agentName: this.config.name },
        timestamp: Date.now(),
      } as MemoryEntry)

      if (finalContent) {
        await this.memory.store({
          id: generateId(),
          type: "short-term",
          key: `agent:${this.config.name}:output:${generateId()}`,
          content: finalContent,
          metadata: { runId, agentName: this.config.name },
          timestamp: Date.now(),
        } as MemoryEntry)
      }
    }

    await globalEventBus.emit("agent:response", {
      agentId: this.config.id || this.config.name,
      runId,
      content: finalContent,
      tokens: this.totalCompletionTokens,
      latencyMs: totalLatency,
    } as any)

    runAfterAgentRunHooks({
      id: runId,
      output: finalContent,
      messages: this.context.getMessages(),
      usage: {
        totalTokens: this.totalPromptTokens + this.totalCompletionTokens,
        promptTokens: this.totalPromptTokens,
        completionTokens: this.totalCompletionTokens,
      },
      latencyMs: totalLatency,
      toolCalls: this.toolCallCount,
      finishReason,
    })

    await globalEventBus.emit("agent:complete", {
      agentId: this.config.id || this.config.name,
      runId,
      totalTokens: this.totalPromptTokens + this.totalCompletionTokens,
      totalLatencyMs: totalLatency,
      toolCalls: this.toolCallCount,
    } as any)

    return {
      id: runId,
      output: finalContent,
      messages: this.context.getMessages(),
      usage: {
        totalTokens: this.totalPromptTokens + this.totalCompletionTokens,
        promptTokens: this.totalPromptTokens,
        completionTokens: this.totalCompletionTokens,
      },
      latencyMs: totalLatency,
      toolCalls: this.toolCallCount,
      finishReason,
    }
  }
}
