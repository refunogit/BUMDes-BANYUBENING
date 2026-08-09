/**
 * HTTP client wrapper for the FastAPI backend.
 *
 * The service worker sends the actual fetch (so cross-origin image fetches
 * and CORS are handled in the background). Content scripts talk to the
 * backend through these helpers via `chrome.runtime.sendMessage`.
 */

/** Base URL of the local FastAPI backend. */
export const API_BASE_URL = "http://localhost:8000";

export interface Bbox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface TranslationItem {
  original: string;
  translated: string;
  confidence: number;
  bbox: [number, number, number, number];
}

export interface TranslateResponse {
  image: string; // data URL of the translated comic
  translations: TranslationItem[];
  processing_time_ms: number;
  width: number;
  height: number;
}

export interface TranslatePayload {
  image: string;
  targetLang?: string;
  sourceLang?: string;
  maxSize?: number;
}

export type TranslateResult =
  | { ok: true; data: TranslateResponse }
  | { ok: false; error: string };

export interface CaptureArea {
  x: number;
  y: number;
  width: number;
  height: number;
  devicePixelRatio: number;
}

export type FetchImageResult =
  | { ok: true; dataUrl: string }
  | { ok: false; error: string };

const REQUEST_TIMEOUT_MS = 120_000; // LaMa + OCR can be slow on CPU

/** POST the image to the backend through the service worker. */
export async function translateImage(
  payload: TranslatePayload,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<TranslateResult> {
  return sendWithTimeout<TranslateResult>(
    {
      type: "TRANSLATE",
      image: payload.image,
      targetLang: payload.targetLang,
      sourceLang: payload.sourceLang,
      maxSize: payload.maxSize,
    },
    timeoutMs,
  );
}

/** Ask the service worker to fetch a cross-origin image as a data URL. */
export async function fetchImageAsDataUrl(
  imageUrl: string,
  options: {
    pageUrl?: string;
    captureArea?: CaptureArea;
    timeoutMs?: number;
  } = {},
): Promise<FetchImageResult> {
  return sendWithTimeout<FetchImageResult>(
    {
      type: "FETCH_IMAGE",
      url: imageUrl,
      pageUrl: options.pageUrl,
      captureArea: options.captureArea,
    },
    options.timeoutMs ?? 30_000,
  );
}

/**
 * Wrap `chrome.runtime.sendMessage` with a timeout. MV3 service workers may
 * need to spin up, so we give generous default timeouts.
 */
function sendWithTimeout<T>(message: unknown, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => {
      resolve({ ok: false, error: "Request timed out" } as T);
    }, timeoutMs);

    chrome.runtime.sendMessage(message, (response) => {
      clearTimeout(timer);
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message ?? "Unknown error" } as T);
        return;
      }
      resolve(response as T);
    });
  });
}
