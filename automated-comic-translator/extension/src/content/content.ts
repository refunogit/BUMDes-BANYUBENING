/**
 * Content Script — DOM manipulator.
 *
 * Scans the page for comic-sized <img> elements, injects a small floating
 * "Translate" button over each one, and on click:
 *   1. grabs the image (blob/data URL via the service worker to avoid tainting),
 *   2. shows a spinner,
 *   3. POSTs to the backend through the service worker,
 *   4. replaces the <img src> with the returned translated data URL.
 */

import type { CaptureArea } from "../utils/api";
import { fetchImageAsDataUrl, translateImage } from "../utils/api";

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
interface Settings {
  enabled: boolean;
  targetLang: string;
  sourceLang: string;
}

const defaults: Settings = {
  enabled: true,
  targetLang: "id",
  sourceLang: "auto",
};

let settings: Settings = { ...defaults };

chrome.storage.local.get(["enabled", "targetLang", "sourceLang"], (cfg) => {
  settings.enabled = cfg.enabled !== false;
  settings.targetLang = (cfg.targetLang as string) || "id";
  settings.sourceLang = (cfg.sourceLang as string) || "auto";
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.enabled) settings.enabled = changes.enabled.newValue !== false;
  if (changes.targetLang) settings.targetLang = changes.targetLang.newValue || "id";
  if (changes.sourceLang) settings.sourceLang = changes.sourceLang.newValue || "auto";
});

// ---------------------------------------------------------------------------
// Per-image overlay
// ---------------------------------------------------------------------------
const MIN_COMIC_DIMENSION = 240; // ignore thumbnails / avatars / icons

class ComicOverlay {
  private readonly img: HTMLImageElement;
  private readonly root: HTMLDivElement;
  private readonly btn: HTMLButtonElement;
  private readonly spinner: HTMLDivElement;
  private readonly status: HTMLDivElement;
  private busy = false;
  private readonly onScroll = () => this.position();
  private readonly onResize = () => this.position();

  constructor(img: HTMLImageElement) {
    this.img = img;

    this.root = document.createElement("div");
    this.root.className = "act-overlay";

    this.btn = document.createElement("button");
    this.btn.type = "button";
    this.btn.className = "act-btn";
    this.btn.textContent = "Translate";
    this.btn.addEventListener("click", () => void this.translate());

    this.spinner = document.createElement("div");
    this.spinner.className = "act-spinner";

    this.status = document.createElement("div");
    this.status.className = "act-status";

    this.root.appendChild(this.btn);
    this.root.appendChild(this.spinner);
    this.root.appendChild(this.status);
    document.body.appendChild(this.root);

    window.addEventListener("scroll", this.onScroll, { passive: true });
    window.addEventListener("resize", this.onResize, { passive: true });
    this.position();
  }

  position(): void {
    const rect = this.img.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;
    this.root.style.top = `${rect.top + scrollY + 8}px`;
    this.root.style.left = `${rect.left + scrollX + 8}px`;
  }

  destroy(): void {
    window.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("resize", this.onResize);
    this.root.remove();
  }

  setLoading(on: boolean, message = ""): void {
    this.busy = on;
    this.btn.classList.toggle("act-btn--hidden", on);
    this.spinner.classList.toggle("act-spinner--hidden", !on);
    this.status.textContent = message;
    this.status.classList.toggle("act-status--hidden", !on);
  }

  private async translate(): Promise<void> {
    if (this.busy || !settings.enabled) return;
    this.setLoading(true, "Grabbing image…");

    try {
      const grabbed = await this.grabImageDataUrl();
      if (!grabbed.ok) throw new Error(grabbed.error);

      this.setLoading(true, "Translating…");

      // 2. Send to the backend via the service worker.
      const result = await translateImage({
        image: grabbed.dataUrl,
        targetLang: settings.targetLang,
        sourceLang: settings.sourceLang,
      });
      if (!result.ok) throw new Error(result.error);

      // 3. Replace the src in place.
      this.img.src = result.data.image;
      this.setLoading(false);
    } catch (err) {
      this.setLoading(false);
      this.status.textContent = `Error: ${String(err)}`;
      this.status.classList.remove("act-status--hidden");
      this.status.classList.add("act-status--error");
      setTimeout(() => {
        this.status.classList.add("act-status--hidden");
        this.status.classList.remove("act-status--error");
      }, 5000);
    }
  }

  private async grabImageDataUrl() {
    const src = this.img.currentSrc || this.img.src;
    if (!src) {
      return { ok: false as const, error: "Image source is empty" };
    }

    const direct = await imageElementToDataUrl(this.img);
    if (direct) {
      return { ok: true as const, dataUrl: direct };
    }

    return this.withOverlayHidden(async () =>
      fetchImageAsDataUrl(src, {
        pageUrl: window.location.href,
        captureArea: this.getCaptureArea(),
      }),
    );
  }

  private getCaptureArea(): CaptureArea | undefined {
    const rect = this.img.getBoundingClientRect();
    const fullyVisible =
      rect.left >= 0 &&
      rect.top >= 0 &&
      rect.right <= window.innerWidth &&
      rect.bottom <= window.innerHeight;
    const fitsViewport = rect.width <= window.innerWidth && rect.height <= window.innerHeight;

    if (!fullyVisible || !fitsViewport) {
      return undefined;
    }

    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      devicePixelRatio: window.devicePixelRatio || 1,
    };
  }

  private async withOverlayHidden<T>(task: () => Promise<T>): Promise<T> {
    const previousVisibility = this.root.style.visibility;
    this.root.style.visibility = "hidden";
    await nextFrame();
    await nextFrame();
    try {
      return await task();
    } finally {
      this.root.style.visibility = previousVisibility;
      this.position();
    }
  }
}

// ---------------------------------------------------------------------------
// Image scanning
// ---------------------------------------------------------------------------
async function imageElementToDataUrl(img: HTMLImageElement): Promise<string | null> {
  try {
    await img.decode().catch(() => undefined);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    if (width <= 0 || height <= 0) {
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function isComicImage(img: HTMLImageElement): boolean {
  if (!img.isConnected || img.getAttribute("data-act") === "1") return false;
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (w < MIN_COMIC_DIMENSION || h < MIN_COMIC_DIMENSION) return false;
  // Skip images that are clearly icons/avatars by ratio.
  if (w > 0 && h > 0) {
    const ratio = w / h;
    if (ratio > 8 || ratio < 0.125) return false;
  }
  return true;
}

function attachOverlay(img: HTMLImageElement): void {
  img.setAttribute("data-act", "1");
  const overlay = new ComicOverlay(img);
  // Track for later cleanup if the node is removed from the DOM.
  const observer = new MutationObserver(() => {
    if (!img.isConnected) {
      overlay.destroy();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function scanImages(): void {
  if (!settings.enabled) return;
  const images = Array.from(document.images);
  for (const img of images) {
    if (isComicImage(img)) {
      attachOverlay(img);
    }
  }
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
function init(): void {
  // Images may not have loaded dimensions yet; wait for load, then scan.
  const tryScan = () => scanImages();
  window.addEventListener("load", tryScan);
  document.addEventListener("load", tryScan, true); // capture image loads

  // Watch for dynamically added images (infinite-scroll manga readers).
  const observer = new MutationObserver(() => {
    if (settings.enabled) scanImages();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Initial scan once images finish decoding.
  if (document.readyState === "complete") {
    tryScan();
  } else {
    document.addEventListener("DOMContentLoaded", () => setTimeout(tryScan, 400));
  }
}

init();
