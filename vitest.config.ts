import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  resolve: {
    alias: {
      "@lupaflow/types": path.resolve(__dirname, "packages/types/src"),
      "@lupaflow/core": path.resolve(__dirname, "packages/core/src"),
      "@lupaflow/secrets": path.resolve(__dirname, "packages/secrets/src"),
      "@lupaflow/providers": path.resolve(__dirname, "packages/providers/src"),
      "@lupaflow/tools": path.resolve(__dirname, "packages/tools/src"),
      "@lupaflow/memory": path.resolve(__dirname, "packages/memory/src"),
      "@lupaflow/agent": path.resolve(__dirname, "packages/agent/src"),
      "@lupaflow/workflow": path.resolve(__dirname, "packages/workflow/src"),
      "@lupaflow/multi-agent": path.resolve(__dirname, "packages/multi-agent/src"),
      "@lupaflow/observability": path.resolve(__dirname, "packages/observability/src"),
      "@lupaflow/plugins": path.resolve(__dirname, "packages/plugins/src"),
      "@lupaflow/cli": path.resolve(__dirname, "packages/cli/src"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
})
