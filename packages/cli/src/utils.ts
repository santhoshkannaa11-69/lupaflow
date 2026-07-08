import chalk from "chalk"
import { readFile } from "fs/promises"
import { join } from "path"

export function printLogo(): void {
  console.log(`
${chalk.cyan("╔══════════════════════════════════════╗")}
${chalk.cyan("║")}        ${chalk.bold.cyan("LUPAFLOW")} v0.1.0           ${chalk.cyan("║")}
${chalk.cyan("║")}    ${chalk.dim("AI Agent Framework")}            ${chalk.cyan("║")}
${chalk.cyan("╚══════════════════════════════════════╝")}
`)
}

export async function readAgentConfig(path: string): Promise<Record<string, unknown>> {
  const content = await readFile(path, "utf-8")
  if (path.endsWith(".json")) {
    return JSON.parse(content)
  }
  const mod = await import(path)
  return mod.default || mod
}

export function detectProjectRoot(): string {
  return process.cwd()
}
