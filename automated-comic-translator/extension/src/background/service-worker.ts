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

import { API_BASE_URL } from "../utils/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fetch a remote image (from any domain in host_permissions) as a data URL. */
async function fetchImageAsDataUrl(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl, { credentials: "omit" });
  if (!response.ok) {
    throw new Error(`Image fetch failed: HTTP ${response.status}`);
  }
  const blob = await response.blob();
  return blobToDataUrl(blob);
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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message.type !== "string") {
    return false;
  }

  // -- Fetch a cross-origin image -------------------------------------------
  if (message.type === "FETCH_IMAGE") {
    fetchImageAsDataUrl(message.url)
      .then((dataUrl) => sendResponse({ ok: true, dataUrl }))
      .catch((err: unknown) =>
        sendResponse({ ok: false, error: String(err) }),
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
