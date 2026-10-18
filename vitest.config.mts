import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.ts"],
    // `server-only` throws outside Next.js; tests import server modules directly.
    alias: { "server-only": new URL("./tests/stubs/server-only.ts", import.meta.url).pathname },
  },
});
