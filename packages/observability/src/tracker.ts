import { globalEventBus } from "@lupaflow/core"
import type { LupaEvent, ProviderCompleteEvent, LLMTokenEvent } from "@lupaflow/types"

interface UsageRecord {
  provider: string
  model: string
  tokens: number
  cost: number
  latencyMs: number
  timestamp: number
}

const TOKEN_COST_PER_1K: Record<string, { input: number; output: number }> = {
  "openai/gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "openai/gpt-4o": { input: 0.0025, output: 0.01 },
  "llama-3.1-70b-versatile": { input: 0.00059, output: 0.00079 },
  "llama-3.1-8b-instant": { input: 0.00005, output: 0.00008 },
  "gemini-1.5-flash": { input: 0.000075, output: 0.0003 },
  "gemini-1.5-pro": { input: 0.00125, output: 0.005 },
}

function estimateCost(provider: string, model: string, tokens: number, isOutput = false): number {
  const key = model
  const rates = TOKEN_COST_PER_1K[key]
  if (!rates) return 0
  const rate = isOutput ? rates.output : rates.input
  return (tokens / 1000) * rate
}

export class UsageTracker {
  private records: UsageRecord[] = []
  private totalTokens = 0
  private totalCost = 0

  constructor() {
    globalEventBus.on("provider:complete", (event: LupaEvent) => {
      const e = event as ProviderCompleteEvent
      const isOutput = e.name === "provider:complete"
      const cost = estimateCost(e.provider, e.model, e.tokens, isOutput)

      this.records.push({
        provider: e.provider,
        model: e.model,
        tokens: e.tokens,
        cost,
        latencyMs: e.latencyMs,
        timestamp: e.timestamp,
      })

      this.totalTokens += e.tokens
      this.totalCost += cost

      globalEventBus.emit("llm:token", {
        tokens: e.tokens,
        cost,
      } as LLMTokenEvent)
    })
  }

  getTotalTokens(): number {
    return this.totalTokens
  }

  getTotalCost(): number {
    return this.totalCost
  }

  getRecords(): UsageRecord[] {
    return [...this.records]
  }

  getSummary(): { totalTokens: number; totalCost: number; totalCalls: number; avgLatencyMs: number } {
    const calls = this.records.length
    const avgLatency = calls > 0 ? this.records.reduce((s, r) => s + r.latencyMs, 0) / calls : 0
    return {
      totalTokens: this.totalTokens,
      totalCost: this.totalCost,
      totalCalls: calls,
      avgLatencyMs: Math.round(avgLatency),
    }
  }

  reset(): void {
    this.records = []
    this.totalTokens = 0
    this.totalCost = 0
  }
}
