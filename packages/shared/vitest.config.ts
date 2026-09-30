import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "shared",
    environment: "node",
    include: ["src/**/*.test.ts"],
    // The build tsconfig excludes test files, so the type-level assertions in
    // these suites (z.infer vs z.input round-trips, shape compatibility with
    // the API) would otherwise never be checked by any command. Pointing
    // typecheck at the same files makes `vitest run` verify them.
    typecheck: {
      enabled: true,
      include: ["src/**/*.test.ts"],
      tsconfig: "./tsconfig.test.json",
    },
  },
});
