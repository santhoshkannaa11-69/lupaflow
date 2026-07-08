import chalk from "chalk"
import { SecretsManager } from "@lupaflow/secrets"
import readline from "readline"

export async function devCommand(agentPath?: string): Promise<void> {
  SecretsManager.init()

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  console.log(chalk.cyan("\n  LupaFlow Dev — Interactive Mode\n"))
  console.log(chalk.dim("  Type your messages. Type 'exit' to quit.\n"))

  const prompt = () => {
    rl.question(chalk.yellow("  You: "), async (input) => {
      if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
        console.log(chalk.dim("\n  Goodbye!\n"))
        rl.close()
        return
      }

      console.log(chalk.dim(`  Running agent...\n`))

      const path = agentPath || "agents/main.ts"
      try {
        const { readAgentConfig } = await import("../utils")
        const { Agent } = await import("@lupaflow/agent")
        const config: any = await readAgentConfig(path)
        const agent = new Agent(config)
        const result = await agent.run(input)
        console.log(chalk.green(`  Agent: ${result.output}\n`))
      } catch (err: any) {
        console.error(chalk.red(`  Error: ${err.message}\n`))
      }

      prompt()
    })
  }

  prompt()
}
