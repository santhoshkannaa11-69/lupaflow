import { Agent } from "@lupaflow/agent"
import { AgentCommunicator, type AgentMessage } from "./communication"
import { Team, type TeamMember } from "./team"
import { generateId } from "@lupaflow/core"
import { globalEventBus } from "@lupaflow/core"

export interface OrchestrationResult {
  id: string
  output: string
  memberOutputs: Map<string, string>
  messages: AgentMessage[]
  durationMs: number
}

export class Orchestrator {
  private team: Team
  private communicator: AgentCommunicator
  private agents: Map<string, Agent> = new Map()
  private agentsReady: Map<string, Promise<void>> = new Map()

  constructor(team: Team) {
    this.team = team
    this.communicator = new AgentCommunicator()
    for (const member of team.config.members) {
      const agent = new Agent(member.agentConfig)
      this.agents.set(member.id, agent)
    }
  }

  private async runMember(member: TeamMember, task: string): Promise<string> {
    const agent = this.agents.get(member.id)!
    const result = await agent.run(task)
    return result.output
  }

  async run(task: string): Promise<OrchestrationResult> {
    const start = Date.now()
    const id = generateId()
    const memberOutputs = new Map<string, string>()

    const leader = this.team.getLeader()
    if (!leader) throw new Error("No leader found in team")

    const leaderResult = await this.runMember(leader, `As the ${leader.role}, oversee this task: ${task}`)
    memberOutputs.set(leader.id, leaderResult)

    const otherMembers = this.team.config.members.filter((m) => m.id !== leader.id)
    for (const member of otherMembers) {
      const msg = this.communicator.send(
        leader.id,
        member.id,
        `Task: ${task}\nLeader's plan: ${leaderResult}\nYour role: ${member.role}\nExecute your part.`
      )

      const memberResult = await this.runMember(member, msg.content)
      memberOutputs.set(member.id, memberResult)

      this.communicator.respond(leader.id, msg.id, memberResult)
    }

    const allOutputs = Array.from(memberOutputs.values()).join("\n\n")
    let finalOutput: string

    if (otherMembers.length > 0) {
      const finalResult = await this.runMember(
        leader,
        `Original task: ${task}\n\nHere are all the outputs from your team:\n${allOutputs}\n\nSynthesize a final cohesive response.`
      )
      finalOutput = finalResult
    } else {
      finalOutput = leaderResult
    }

    return {
      id,
      output: finalOutput,
      memberOutputs,
      messages: this.communicator.getHistory(),
      durationMs: Date.now() - start,
    }
  }

  getCommunicator(): AgentCommunicator {
    return this.communicator
  }

  getTeam(): Team {
    return this.team
  }
}
