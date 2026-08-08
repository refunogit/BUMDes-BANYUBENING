import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { UserConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Background service worker build (self-contained IIFE).
 */
const config: UserConfig = {
  build: {
    outDir: "dist",
    emptyOutDir: false,
    minify: false,
    rollupOptions: {
      input: resolve(__dirname, "src/background/service-worker.ts"),
      output: {
        format: "iife",
        inlineDynamicImports: true,
        entryFileNames: "background/service-worker.js",
      },
    },
  },
};

export default config;
