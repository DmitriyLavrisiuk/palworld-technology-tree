import path from "node:path"
import { defineConfig } from "vitest/config"

/**
 * Тесты живут рядом с тем, что проверяют. Отдельный конфиг, а не поле test
 * в vite.config.ts: сборке сайта тестовый рантайм не нужен.
 */
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["scripts/**/*.test.ts", "src/**/*.test.ts"],
  },
})
