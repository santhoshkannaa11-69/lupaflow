import { WorkflowEngine, Pipeline } from "@lupaflow/workflow"

const pipeline = new Pipeline()
  .addAgent("researcher", {
    agent: {
      name: "researcher",
      provider: "groq",
      systemPrompt: "You are a researcher. Find key information.",
    },
  })
  .addTransform("summarize", (input: unknown) => {
    const text = String(input)
    return text.length > 100 ? text.slice(0, 100) + "..." : text
  })
  .addAgent("writer", {
    agent: {
      name: "writer",
      provider: "groq",
      systemPrompt: "You are a writer. Turn research into a clear response.",
    },
  })

const workflow = WorkflowEngine.fromPipeline("research-workflow", pipeline, "Research and write about a topic")
const result = await workflow.run("Tell me about quantum computing")
console.log(result)
