import { Agent } from "@lupaflow/agent"

const agent = new Agent({
  name: "assistant",
  provider: "groq",
  model: "llama-3.3-70b-versatile",
  systemPrompt: "You are a helpful assistant. Be concise.",
  temperature: 0.7,
})

const result = await agent.run("What is the capital of France?")
console.log(result.output)
