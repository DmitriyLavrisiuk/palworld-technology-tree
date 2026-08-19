import path from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  /**
   * Сайт живёт в подкаталоге GitHub Pages. Всё, что адресуется от корня,
   * обязано идти через import.meta.env.BASE_URL — см. docs/DEPLOYMENT.md.
   */
  base: "/palworld-technology-tree/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})
