import { BaseTool } from "../interface"

export class HTTPTool extends BaseTool {
  definition = {
    name: "http",
    description: "Make HTTP requests (GET, POST, PUT, DELETE)",
    parameters: {
      method: {
        type: "string" as const,
        description: "HTTP method: GET, POST, PUT, DELETE",
      },
      url: {
        type: "string" as const,
        description: "Request URL",
      },
      headers: {
        type: "object" as const,
        description: "Request headers as key-value object",
      },
      body: {
        type: "string" as const,
        description: "Request body (stringified JSON for POST/PUT)",
      },
    },
    required: ["method", "url"],
  }

  async execute(args: Record<string, unknown>): Promise<unknown> {
    const { method, url, headers, body } = args as {
      method: string
      url: string
      headers?: Record<string, string>
      body?: string
    }

    const response = await fetch(url, {
      method: method.toUpperCase(),
      headers: { "Content-Type": "application/json", ...headers },
      body: body || undefined,
    })

    const text = await response.text()
    let data: unknown = text
    try {
      data = JSON.parse(text)
    } catch {}

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data,
    }
  }
}
