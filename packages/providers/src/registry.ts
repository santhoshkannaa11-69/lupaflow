import type { LLMProvider } from "./interface"
import type { ProviderName, ProviderConfig } from "@lupaflow/types"
import { ConfigError } from "@lupaflow/core"

class ProviderRegistry {
  private providers: Map<ProviderName, new (config: ProviderConfig) => LLMProvider> = new Map()
  private instances: Map<ProviderName, LLMProvider> = new Map()

  register(name: ProviderName, ctor: new (config: ProviderConfig) => LLMProvider): void {
    this.providers.set(name, ctor)
  }

  get(name: ProviderName, config?: ProviderConfig): LLMProvider {
    const key = config ? `${name}:${JSON.stringify(config)}` : name
    if (!config && this.instances.has(name)) {
      return this.instances.get(name)!
    }

    const ctor = this.providers.get(name)
    if (!ctor) {
      throw new ConfigError(`Unknown provider: "${name}"`, {
        available: Array.from(this.providers.keys()),
      })
    }

    const instance = new ctor(config || {})
    if (!config) {
      this.instances.set(name, instance)
    }
    return instance
  }

  has(name: string): name is ProviderName {
    return this.providers.has(name as ProviderName)
  }

  list(): ProviderName[] {
    return Array.from(this.providers.keys())
  }
}

export const providerRegistry = new ProviderRegistry()
