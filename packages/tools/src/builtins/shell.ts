import { execSync } from "child_process"
import { BaseTool } from "../interface"

export class ShellTool extends BaseTool {
  definition = {
    name: "shell",
    description: "Execute shell commands (use with caution)",
    parameters: {
      command: {
        type: "string" as const,
        description: "Shell command to execute",
      },
      cwd: {
        type: "string" as const,
        description: "Working directory",
      },
    },
    required: ["command"],
  }

  async execute(args: Record<string, unknown>): Promise<unknown> {
    const { command, cwd } = args as { command: string; cwd?: string }
    try {
      const output = execSync(command, {
        cwd: cwd || process.cwd(),
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
        shell: process.platform === "win32" ? "cmd.exe" : "/bin/bash",
      })
      return { stdout: output, stderr: "", exitCode: 0 }
    } catch (err: any) {
      return {
        stdout: err.stdout?.toString() || "",
        stderr: err.stderr?.toString() || err.message,
        exitCode: err.status || 1,
      }
    }
  }
}
