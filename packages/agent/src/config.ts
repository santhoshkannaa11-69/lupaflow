import type { AgentConfig, ProviderName, Tool } from "@lupaflow/types"
import { ConfigError } from "@lupaflow/core"

export function validateAgentConfig(config: AgentConfig): void {
  if (!config.name) throw new ConfigError("Agent name is required")
  if (!config.provider) throw new ConfigError("Provider is required for agent")

  if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
    throw new ConfigError("Temperature must be between 0 and 2")
  }

  if (config.maxRetries !== undefined && config.maxRetries < 0) {
    throw new ConfigError("maxRetries must be >= 0")
  }
}

export function buildSystemPrompt(config: AgentConfig): string {
  const parts: string[] = []

  parts.push(config.systemPrompt || `You are ${config.name}, an AI assistant.`)

  if (config.personality) {
    const p = config.personality
    parts.push("")
    parts.push("--- Personality ---")
    if (p.name) parts.push(`Name: ${p.name}`)
    if (p.tone) parts.push(`Tone: ${p.tone}`)
    if (p.style) parts.push(`Style: ${p.style}`)
    if (p.traits?.length) parts.push(`Traits: ${p.traits.join(", ")}`)
  }

  if (config.goals?.length) {
    parts.push("")
    parts.push("--- Goals ---")
    config.goals.forEach((g, i) => parts.push(`${i + 1}. ${g.description}`))
  }

  if (config.constraints?.length) {
    parts.push("")
    parts.push("--- Constraints ---")
    config.constraints.forEach((c) => parts.push(`- ${c.description}`))
  }

  if (config.tools?.length) {
    parts.push("")
    parts.push(`You have access to these tools: ${config.tools.map((t) => t.definition.name).join(", ")}`)
    parts.push("Use them when appropriate to fulfill the user's request.")
  }

  return parts.join("\n")
}
