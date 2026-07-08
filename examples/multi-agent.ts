import { Orchestrator, Team } from "@lupaflow/multi-agent"

const team = new Team({
  name: "content-team",
  leader: "ceo",
  members: [
    {
      id: "ceo",
      name: "CEO",
      role: "CEO / Strategist",
      agentConfig: {
        name: "CEO",
        provider: "groq",
        systemPrompt: "You are a CEO. You plan and oversee projects.",
      },
    },
    {
      id: "researcher",
      name: "Researcher",
      role: "Researcher",
      agentConfig: {
        name: "Researcher",
        provider: "groq",
        systemPrompt: "You are a researcher. Find detailed information.",
      },
    },
    {
      id: "writer",
      name: "Writer",
      role: "Writer",
      agentConfig: {
        name: "Writer",
        provider: "groq",
        systemPrompt: "You are a writer who creates compelling content.",
      },
    },
  ],
})

const orchestrator = new Orchestrator(team)
const result = await orchestrator.run("Create a short blog post about AI agents")
console.log(result.output)
