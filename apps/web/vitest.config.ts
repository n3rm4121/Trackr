import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "web",
    // The web tests cover the pure logic under `lib` — the CSV the board
    // exports, the dates it renders. Nothing here renders a component, so the
    // browser-shaped environment would only slow the suite down.
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
