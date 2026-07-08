import { pluginManager } from "./loader"

export function runBeforeAgentRunHooks(config: Record<string, unknown>): Record<string, unknown> {
  let result = { ...config }
  for (const plugin of pluginManager.list()) {
    if (plugin.hooks?.beforeAgentRun) {
      result = plugin.hooks.beforeAgentRun(result)
    }
  }
  return result
}

export function runAfterAgentRunHooks(result: unknown): unknown {
  let output = result
  for (const plugin of pluginManager.list()) {
    if (plugin.hooks?.afterAgentRun) {
      output = plugin.hooks.afterAgentRun(output)
    }
  }
  return output
}

export function runBeforeToolCallHooks(tool: string, args: Record<string, unknown>): Record<string, unknown> {
  let result = { ...args }
  for (const plugin of pluginManager.list()) {
    if (plugin.hooks?.beforeToolCall) {
      result = plugin.hooks.beforeToolCall(tool, result)
    }
  }
  return result
}

export function runAfterToolCallHooks(result: unknown): unknown {
  let output = result
  for (const plugin of pluginManager.list()) {
    if (plugin.hooks?.afterToolCall) {
      output = plugin.hooks.afterToolCall(output)
    }
  }
  return output
}

export function runBeforeProviderCallHooks(provider: string, request: Record<string, unknown>): Record<string, unknown> {
  let result = { ...request }
  for (const plugin of pluginManager.list()) {
    if (plugin.hooks?.beforeProviderCall) {
      result = plugin.hooks.beforeProviderCall(provider, result)
    }
  }
  return result
}

export function runAfterProviderCallHooks(response: Record<string, unknown>): Record<string, unknown> {
  let result = { ...response }
  for (const plugin of pluginManager.list()) {
    if (plugin.hooks?.afterProviderCall) {
      result = plugin.hooks.afterProviderCall(result)
    }
  }
  return result
}
