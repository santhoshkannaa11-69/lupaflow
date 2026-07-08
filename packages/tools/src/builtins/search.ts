import { BaseTool } from "../interface"

export class SearchTool extends BaseTool {
  definition = {
    name: "search",
    description: "Search the web for information",
    parameters: {
      query: {
        type: "string" as const,
        description: "Search query",
      },
      maxResults: {
        type: "number" as const,
        description: "Maximum number of results (default: 5)",
      },
    },
    required: ["query"],
  }

  async execute(args: Record<string, unknown>): Promise<unknown> {
    const { query, maxResults } = args as { query: string; maxResults?: number }
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
      const response = await fetch(url)
      const html = await response.text()
      const results: Array<{ title: string; link: string; snippet: string }> = []

      const linkRegex = /<a[^>]+class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g
      const snippetRegex = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g

      const limit = maxResults || 5
      let count = 0
      let linkMatch
      while ((linkMatch = linkRegex.exec(html)) !== null && count < limit) {
        const snippetMatch = snippetRegex.exec(html)
        results.push({
          link: linkMatch[1],
          title: linkMatch[2].replace(/<[^>]*>/g, ""),
          snippet: snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, "") : "",
        })
        count++
      }

      return { query, results }
    } catch (err: any) {
      return { error: err.message, query }
    }
  }
}
