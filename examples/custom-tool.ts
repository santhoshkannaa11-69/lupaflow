import { Agent } from "@lupaflow/agent"
import { BaseTool } from "@lupaflow/tools"
import { CalculatorTool } from "@lupaflow/tools"

class WeatherTool extends BaseTool {
  definition = {
    name: "weather",
    description: "Get the current weather for a city",
    parameters: {
      city: { type: "string" as const, description: "City name", required: true },
    },
    required: ["city"],
  }

  async execute(args: Record<string, unknown>): Promise<unknown> {
    const { city } = args as { city: string }
    // In reality, you'd call a weather API here
    return { city, temperature: 22, condition: "sunny" }
  }
}

const agent = new Agent({
  name: "tool-agent",
  provider: "groq",
  tools: [new WeatherTool(), new CalculatorTool()],
})

const result = await agent.run("What's the weather in Tokyo and what's 25 * 4?")
console.log(result.output)
