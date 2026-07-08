import { SecretsManager } from "./manager"

export function getOpenRouterKey(): string {
  return SecretsManager.require("OPENROUTER_API_KEY")
}

export function getGoogleKey(): string {
  return SecretsManager.require("GOOGLE_API_KEY")
}

export function getGroqKey(): string {
  return SecretsManager.require("GROQ_API_KEY")
}
