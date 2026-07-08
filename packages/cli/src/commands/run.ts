import chalk from "chalk"
import { readAgentConfig, printLogo } from "../utils"
import { SecretsManager } from "@lupaflow/secrets"
import { Agent } from "@lupaflow/agent"

export async function runCommand(agentPath?: string): Promise<void> {
  printLogo()
  SecretsManager.init()

  const path = agentPath || "agents/main.ts"

  try {
    const config: any = await readAgentConfig(path)
    const agent = new Agent(config)

    const prompt = process.argv.slice(3).join(" ") || "Hello!"
    console.log(chalk.dim(`\n  Running "${config.name || "agent"}"...\n`))

    const result = await agent.run(prompt)

    console.log(chalk.green("\n  Response:"))
    console.log(`  ${result.output}`)
    console.log(chalk.dim(`\n  Tokens: ${result.usage.totalTokens} | Latency: ${result.latencyMs}ms | Tool calls: ${result.toolCalls}\n`))
  } catch (err: any) {
    console.error(chalk.red(`\n  Error: ${err.message}\n`))
    process.exit(1)
  }
}
