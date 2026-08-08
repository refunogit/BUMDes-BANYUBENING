import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { UserConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Content script build. Chrome content scripts cannot be ES modules, so this
 * entry is bundled as a self-contained IIFE (shared utils are inlined).
 */
const config: UserConfig = {
  build: {
    outDir: "dist",
    emptyOutDir: false,
    minify: false,
    rollupOptions: {
      input: resolve(__dirname, "src/content/content.ts"),
      output: {
        format: "iife",
        inlineDynamicImports: true,
        entryFileNames: "content/content.js",
      },
    },
  },
};

export default config;
