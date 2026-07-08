import dotenv from "dotenv"
import Conf from "conf"
import { ConfigError } from "@lupaflow/core"

dotenv.config()

const store = new Conf({
  projectName: "lupaflow",
  schema: {
    apiKeys: {
      type: "object",
      default: {},
    },
  },
})

export class SecretsManager {
  private static keys: Map<string, string> = new Map()

  static init(): void {
    const saved = store.get("apiKeys") as Record<string, string>
    for (const [key, value] of Object.entries(saved)) {
      SecretsManager.keys.set(key, value)
    }
  }

  static get(key: string): string | undefined {
    const envKey = key.toUpperCase()
    const envValue = process.env[envKey] || process.env[`LUPAFLOW_${envKey}`]
    if (envValue) return envValue
    return SecretsManager.keys.get(key)
  }

  static require(key: string): string {
    const value = SecretsManager.get(key)
    if (!value) {
      throw new ConfigError(`Missing required secret: ${key}`, {
        hint: `Set ${key.toUpperCase()} in your .env file or run: lupaflow secrets set ${key} <value>`,
      })
    }
    return value
  }

  static set(key: string, value: string): void {
    SecretsManager.keys.set(key, value)
    const saved = store.get("apiKeys") as Record<string, string>
    saved[key] = value
    store.set("apiKeys", saved)
  }

  static delete(key: string): void {
    SecretsManager.keys.delete(key)
    const saved = store.get("apiKeys") as Record<string, string>
    delete saved[key]
    store.set("apiKeys", saved)
  }

  static list(): string[] {
    return Array.from(SecretsManager.keys.keys())
  }

  static clear(): void {
    SecretsManager.keys.clear()
    store.set("apiKeys", {})
  }
}
