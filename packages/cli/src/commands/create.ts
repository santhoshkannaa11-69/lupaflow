import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function createCommand(name: string): Promise<void> {
  const dir = join(process.cwd(), name)

  await mkdir(dir, { recursive: true })
  await mkdir(join(dir, "agents"), { recursive: true })
  await mkdir(join(dir, "tools"), { recursive: true })
  await mkdir(join(dir, "workflows"), { recursive: true })

  const packageJson = {
    name,
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "lupaflow dev",
      run: "lupaflow run",
      test: "lupaflow test",
    },
    dependencies: {
      lupaflow: "^0.1.0",
    },
  }

  await writeFile(join(dir, "package.json"), JSON.stringify(packageJson, null, 2))

  const envContent = `# LupaFlow Secrets
# Get your keys and add them here
# OPENROUTER_API_KEY=
# GOOGLE_API_KEY=
# GROQ_API_KEY=
`
  await writeFile(join(dir, ".env"), envContent)

  const agentTemplate = `import { Agent } from "lupaflow"

const agent = new Agent({
  name: "${name}-agent",
  provider: "openrouter",
  systemPrompt: "You are a helpful assistant.",
})

const result = await agent.run("Hello!")
console.log(result)
`

  await writeFile(join(dir, "agents", "main.ts"), agentTemplate)

  console.log(`\n  ✅ Created project: ${name}\n`)
  console.log(`  ${"cd " + name}`)
  console.log(`  ${"lupaflow dev"}\n`)
}
