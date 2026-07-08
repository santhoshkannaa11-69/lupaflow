#!/usr/bin/env node

import { Command } from "commander"
import { createCommand } from "./commands/create"
import { devCommand } from "./commands/dev"
import { runCommand } from "./commands/run"
import { testCommand } from "./commands/test"
import { deployCommand } from "./commands/deploy"
import { printLogo } from "./utils"
import { SecretsManager } from "@lupaflow/secrets"

const program = new Command()

program
  .name("lupaflow")
  .description("AI Agent Framework — build, run, and orchestrate intelligent agents")
  .version("0.1.0")

program
  .command("create")
  .description("Create a new LupaFlow project")
  .argument("<name>", "Project name")
  .action(createCommand)

program
  .command("dev")
  .description("Run agent in interactive dev mode")
  .argument("[agent]", "Agent config file path")
  .action(devCommand)

program
  .command("run")
  .description("Run an agent with a prompt")
  .argument("[agent]", "Agent config file path")
  .option("-p, --prompt <prompt>", "Input prompt")
  .action(runCommand)

program
  .command("test")
  .description("Run agent tests")
  .action(testCommand)

program
  .command("deploy")
  .description("Deploy agent to cloud (coming soon)")
  .action(deployCommand)

SecretsManager.init()
printLogo()
program.parse(process.argv)
