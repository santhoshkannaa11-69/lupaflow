import { providerRegistry } from "./registry"
import { OpenRouterProvider } from "./openrouter"
import { GoogleProvider } from "./google"
import { GroqProvider } from "./groq"

providerRegistry.register("openrouter", OpenRouterProvider)
providerRegistry.register("google", GoogleProvider)
providerRegistry.register("groq", GroqProvider)

export { providerRegistry }
export type { LLMProvider } from "./interface"
export { OpenRouterProvider } from "./openrouter"
export { GoogleProvider } from "./google"
export { GroqProvider } from "./groq"
