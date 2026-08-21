import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const exceljsBrowser = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "node_modules/exceljs/dist/exceljs.min.js",
);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: /^exceljs$/, replacement: exceljsBrowser }],
  },
  optimizeDeps: {
    include: ["exceljs"],
  },
});
