import { readdir } from "fs/promises"
import { join } from "path"
import type { LupaPlugin } from "./interface"
import { globalEventBus } from "@lupaflow/core"

class PluginManager {
  private plugins: Map<string, LupaPlugin> = new Map()
  private loaded = false

  async load(plugin: LupaPlugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already loaded`)
    }
    this.plugins.set(plugin.name, plugin)

    if (plugin.onEvent) {
      globalEventBus.onAny((event) => plugin.onEvent!(event))
    }

    if (plugin.onLoad) {
      await plugin.onLoad()
    }
  }

  async unload(name: string): Promise<void> {
    const plugin = this.plugins.get(name)
    if (!plugin) throw new Error(`Plugin "${name}" not found`)
    if (plugin.onUnload) await plugin.onUnload()
    this.plugins.delete(name)
  }

  async loadFromDirectory(dir: string): Promise<void> {
    try {
      const files = await readdir(dir)
      for (const file of files) {
        if (file.endsWith(".js") || file.endsWith(".mjs")) {
          try {
            const mod = await import(join(dir, file))
            if (mod.default && mod.default.name) {
              await this.load(mod.default)
            }
          } catch {}
        }
      }
    } catch {}
  }

  get(name: string): LupaPlugin | undefined {
    return this.plugins.get(name)
  }

  list(): LupaPlugin[] {
    return Array.from(this.plugins.values())
  }

  isLoaded(name: string): boolean {
    return this.plugins.has(name)
  }

  async unloadAll(): Promise<void> {
    for (const [name] of this.plugins) {
      await this.unload(name)
    }
  }
}

export const pluginManager = new PluginManager()
