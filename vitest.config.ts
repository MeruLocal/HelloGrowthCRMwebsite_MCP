import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // media_list_videos merges the live YouTube Atom feed at request time. Tests
    // must not depend on the network (or on what was uploaded this week), so the
    // live fetch is switched off for the whole suite; parseYouTubeFeed and the
    // merge are covered with fixtures instead.
    env: { MCP_DISABLE_LIVE_YOUTUBE: "true" },
    include: ["src/**/*.{test,spec}.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "lcov"],
      reportsDirectory: "coverage",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.{test,spec}.ts",
        "src/index.ts",
        "src/server.ts",
      ],
    },
  },
});
