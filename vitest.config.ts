import path from "node:path"
import { defineConfig } from "vitest/config"

/**
 * Тесты живут рядом с тем, что проверяют. Отдельный конфиг, а не поле test
 * в vite.config.ts: сборке сайта тестовый рантайм не нужен.
 */
export default defineConfig({
  /**
   * Намеренно не "/": путь, захардкоженный от корня, обязан валить тест
   * iconUrl. С base "/" такая проверка была бы тавтологией.
   */
  base: "/test-base/",
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["scripts/**/*.test.ts", "src/**/*.test.ts"],
  },
})
