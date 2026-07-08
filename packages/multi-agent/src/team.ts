import type { AgentConfig } from "@lupaflow/types"
import { generateId } from "@lupaflow/core"

export interface TeamMember {
  id: string
  name: string
  role: string
  agentConfig: AgentConfig
}

export interface TeamConfig {
  name: string
  members: TeamMember[]
  leader?: string
  description?: string
}

export class Team {
  public config: TeamConfig

  constructor(config: TeamConfig) {
    this.config = {
      ...config,
      members: config.members.map((m) => ({ ...m, id: m.id || generateId() })),
    }
  }

  getMember(idOrName: string): TeamMember | undefined {
    return this.config.members.find((m) => m.id === idOrName || m.name === idOrName)
  }

  getLeader(): TeamMember | undefined {
    if (!this.config.leader) return this.config.members[0]
    return this.getMember(this.config.leader)
  }

  getByRole(role: string): TeamMember[] {
    return this.config.members.filter((m) => m.role === role)
  }
}
