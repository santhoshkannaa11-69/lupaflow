import { readFile, writeFile, readdir, mkdir } from "fs/promises"
import { existsSync } from "fs"
import { dirname } from "path"
import { execSync } from "child_process"
import { BaseTool } from "../interface"

export class FilesystemTool extends BaseTool {
  definition = {
    name: "filesystem",
    description: "Read, write, list, and manage files and directories",
    parameters: {
      action: {
        type: "string" as const,
        description: "Action: read, write, list, delete, mkdir, exists",
      },
      path: {
        type: "string" as const,
        description: "File or directory path",
      },
      content: {
        type: "string" as const,
        description: "Content to write (for write action)",
      },
    },
    required: ["action", "path"],
  }

  async execute(args: Record<string, unknown>): Promise<unknown> {
    const { action, path, content } = args as { action: string; path: string; content?: string }

    switch (action) {
      case "read": {
        if (!existsSync(path)) return { error: `File not found: ${path}` }
        const data = await readFile(path, "utf-8")
        return { content: data }
      }
      case "write": {
        const parentDir = dirname(path)
        if (parentDir) await mkdir(parentDir, { recursive: true })
        await writeFile(path, content || "", "utf-8")
        return { success: true }
      }
      case "list": {
        const entries = await readdir(path)
        return { entries }
      }
      case "delete": {
        execSync(`rm -rf "${path}"`, { stdio: "ignore" })
        return { success: true }
      }
      case "mkdir": {
        await mkdir(path, { recursive: true })
        return { success: true }
      }
      case "exists": {
        return { exists: existsSync(path) }
      }
      default:
        return { error: `Unknown action: ${action}` }
    }
  }
}
