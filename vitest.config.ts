import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["./apps/api/vitest.config.ts", "./packages/shared/vitest.config.ts"],
  },
});
