/**
 * Service Worker — communication bridge.
 *
 * Responsibilities:
 *  1. Fetch cross-origin comic images as data URLs (avoids canvas tainting).
 *  2. Forward translation requests from content scripts to the local FastAPI
 *     backend (avoids CORS restrictions / keeps fetch in one place).
 *
 * MV3 notes:
 *  - No long-lived global state. Settings live in chrome.storage.local.
 *  - All listeners are registered at the top level of this script.
 */

import type { CaptureArea } from "../utils/api";
import { API_BASE_URL } from "../utils/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fetch a remote image (from any domain in host_permissions) as a data URL. */
async function fetchImageAsDataUrl(
  imageUrl: string,
  options: {
    pageUrl?: string;
    captureArea?: CaptureArea;
    windowId?: number;
  } = {},
): Promise<string> {
  if (imageUrl.startsWith("data:image/")) {
    return imageUrl;
  }
  if (imageUrl.startsWith("data:")) {
    throw new Error("Selected resource is a data URL but not an image");
  }

  let lastError: unknown;
  for (const credentials of ["include", "omit"] as const) {
    try {
      return await fetchImageOverNetwork(imageUrl, {
        credentials,
        pageUrl: options.pageUrl,
      });
    } catch (error) {
      lastError = error;
    }
  }

  if (options.captureArea && typeof options.windowId === "number") {
    try {
      return await captureVisibleImageArea(options.windowId, options.captureArea);
    } catch (captureError) {
      const detail = captureError instanceof Error ? captureError.message : String(captureError);
      throw new Error(`Image fetch failed and screenshot fallback also failed: ${detail}`);
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("Image fetch failed");
}

async function fetchImageOverNetwork(
  imageUrl: string,
  options: {
    credentials: RequestCredentials;
    pageUrl?: string;
  },
): Promise<string> {
  const response = await fetch(imageUrl, {
    credentials: options.credentials,
    referrer: options.pageUrl,
  });
  if (!response.ok) {
    throw new Error(`Image fetch failed: HTTP ${response.status}`);
  }

  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  if (contentType && !contentType.startsWith("image/")) {
    throw new Error(`Fetched resource is not an image (content-type: ${contentType})`);
  }

  const blob = await response.blob();
  if (blob.type && !blob.type.toLowerCase().startsWith("image/")) {
    throw new Error(`Fetched blob is not an image (type: ${blob.type})`);
  }
  return blobToDataUrl(blob);
}

async function captureVisibleImageArea(windowId: number, area: CaptureArea): Promise<string> {
  const screenshotUrl = await chrome.tabs.captureVisibleTab(windowId, { format: "png" });
  const screenshotBlob = await (await fetch(screenshotUrl)).blob();
  const screenshotBitmap = await createImageBitmap(screenshotBlob);

  const scale = area.devicePixelRatio || 1;
  const sx = Math.max(0, Math.round(area.x * scale));
  const sy = Math.max(0, Math.round(area.y * scale));
  const maxWidth = Math.max(1, screenshotBitmap.width - sx);
  const maxHeight = Math.max(1, screenshotBitmap.height - sy);
  const sw = Math.max(1, Math.min(Math.round(area.width * scale), maxWidth));
  const sh = Math.max(1, Math.min(Math.round(area.height * scale), maxHeight));

  const canvas = new OffscreenCanvas(sw, sh);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    screenshotBitmap.close();
    throw new Error("OffscreenCanvas 2D context unavailable");
  }

  ctx.drawImage(screenshotBitmap, sx, sy, sw, sh, 0, 0, sw, sh);
  screenshotBitmap.close();
  const croppedBlob = await canvas.convertToBlob({ type: "image/png" });
  return blobToDataUrl(croppedBlob);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("FileReader error"));
    reader.readAsDataURL(blob);
  });
}

/** POST the payload to the translation endpoint. */
async function translateRequest(payload: {
  image: string;
  targetLang?: string;
  sourceLang?: string;
  maxSize?: number;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: payload.image,
        target_lang: payload.targetLang ?? undefined,
        source_lang: payload.sourceLang ?? undefined,
        max_size: payload.maxSize ?? undefined,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const err = await response.json();
        detail = err.detail ?? detail;
      } catch {
        /* ignore */
      }
      throw new Error(detail);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Message router
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== "string") {
    return false;
  }

  // -- Fetch a cross-origin image -------------------------------------------
  if (message.type === "FETCH_IMAGE") {
    fetchImageAsDataUrl(message.url, {
      pageUrl: message.pageUrl || sender.tab?.url,
      captureArea: message.captureArea,
      windowId: sender.tab?.windowId,
    })
      .then((dataUrl) => sendResponse({ ok: true, dataUrl }))
      .catch((err: unknown) =>
        sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) }),
      );
    return true; // keep channel open for async response
  }

  // -- Run the translation pipeline -----------------------------------------
  if (message.type === "TRANSLATE") {
    translateRequest({
      image: message.image,
      targetLang: message.targetLang,
      sourceLang: message.sourceLang,
      maxSize: message.maxSize,
    })
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err: unknown) =>
        sendResponse({ ok: false, error: String(err) }),
      );
    return true;
  }

  return false;
});

// Read settings so the service worker stays warm only when needed; state is
// intentionally not cached here to avoid MV3 staleness bugs.
chrome.storage.local.get(["enabled", "targetLang", "sourceLang"], () => {
  // no-op: values are read per-message from the content script instead
});
