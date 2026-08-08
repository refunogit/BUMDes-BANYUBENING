import { dirname, resolve } from "node:path";
import { copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Plugin, UserConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Popup script build + static asset copying.
 *
 * Because Manifest V3 content scripts cannot be ES modules, the extension is
 * split across three Vite configs, each emitting a self-contained IIFE:
 *   1. vite.content.config.ts   -> content/content.js
 *   2. vite.background.config.ts -> background/service-worker.js
 *   3. vite.config.ts (this)     -> popup/popup.js + copy static assets
 *
 * Static files (manifest.json, overlay.css, popup.html/css, _locales) are
 * copied verbatim into `dist/` so their relative paths in manifest.json work.
 */
function copyStaticAssets(): Plugin {
  const copies: Array<[string, string]> = [
    ["manifest.json", "dist/manifest.json"],
    ["src/content/overlay.css", "dist/content/overlay.css"],
    ["src/popup/popup.html", "dist/popup/popup.html"],
    ["src/popup/popup.css", "dist/popup/popup.css"],
    ["_locales/en/messages.json", "dist/_locales/en/messages.json"],
  ];
  return {
    name: "copy-static-assets",
    closeBundle() {
      for (const [from, to] of copies) {
        const dest = resolve(__dirname, to);
        mkdirSync(dirname(dest), { recursive: true });
        copyFileSync(resolve(__dirname, from), dest);
      }
    },
  };
}

const config: UserConfig = {
  plugins: [copyStaticAssets()],
  build: {
    outDir: "dist",
    minify: false,
    rollupOptions: {
      input: resolve(__dirname, "src/popup/popup.ts"),
      output: {
        format: "iife",
        inlineDynamicImports: true,
        entryFileNames: "popup/popup.js",
      },
    },
  },
};

export default config;
