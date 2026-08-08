# 💬 Automated Comic Translator

An **Automated Comic Translator** — a Chrome Extension (Manifest V3 + TypeScript)
paired with a Python FastAPI backend that translates the text inside comic/manga
images **in place**, right on the web page. With one click, the original Japanese /
Korean / English text on a comic page is detected, cleaned off the artwork, and
replaced with your chosen language — without leaving the browser tab.

The backend runs a complete computer-vision pipeline: **PaddleOCR** for text
detection (horizontal & vertical), **LaMa inpainting** to remove the old text
while preserving the artwork, **deep-translator** for translation (with automatic
provider failover), and **Pillow** for dynamic, auto-wrapped text rendering.

> **One-Click In-Place Translation** — the guiding principle. Old text is erased
> from the image and the translated text is written over it, and the page's
> `<img src>` is swapped for the new image.

---

## 📑 Daftar Isi

1. [Fitur Utama](#-fitur-utama)
2. [Prasyarat Sistem (Prerequisites)](#-prasyarat-sistem-prerequisites)
3. [Struktur Proyek](#-struktur-proyek)
4. [Panduan Instalasi & Setup](#-panduan-instalasi--setup)
5. [Konfigurasi & Pengaturan (Settings)](#-konfigurasi--pengaturan-settings)
6. [Cara Penggunaan (Usage Guide)](#-cara-penggunaan-usage-guide)
7. [Dokumentasi API Backend (API Reference)](#-dokumentasi-api-backend-api-reference)
8. [Detail Alur Kerja Pipeline (Technical Workflow)](#-detail-alur-kerja-pipeline-technical-workflow)
9. [Pengujian & Optimasi Kinerja (Testing & Performance)](#-pengujian--optimasi-kinerja-testing--performance)
10. [Panduan Troubleshooting & FAQ](#-panduan-troubleshooting--faq)
11. [Panduan Pengembangan & Kontribusi](#-panduan-pengembangan--kontribusi)
12. [Lisensi & Kredit](#-lisensi--kredit)

---

## ⚡ Fitur Utama

- **One-Click In-Place Translation** — a floating **Translate** button appears
  over each comic-sized image. Click it and the page image is replaced with the
  translated version, no manual downloading or re-uploading.

- **Multi-Language OCR Support** — PaddleOCR with orientation/angle
  classification detects **horizontal** text (Indonesian/English) and
  **vertical** Japanese manga, Korean manhwa and Chinese manhua writing.

- **Advanced Text Inpainting** — **LaMa** (Large Mask Inpainting with Fourier
  convolutions) regenerates the region behind the old text, preserving
  screentones, gradients and line-art far better than classic PatchMatch.

- **Dynamic Text Rendering** — Pillow draws the translation with **auto
  word-wrap** (word-based for Latin, character-based for CJK), **dynamic font
  scaling** that shrinks the font until the text fits the detected bubble, and
  a **text stroke/outline** for readability.

- **Automated Fallback Translation** — translations are batched to dodge rate
  limits and automatically fail over across providers:
  **Google Translate → MyMemory → LibreTranslate**, keeping the last source
  text if every provider is down so the page always renders.

- **Privacy-first local processing** — translation happens on your own machine
  via a local FastAPI server; no third-party cloud service touches the image.

---

## 💻 Prasyarat Sistem (Prerequisites)

### 1. Spesifikasi Perangkat Keras (Hardware Requirements)

| | **Minimal (CPU)** | **Rekomendasi (GPU)** |
|---|---|---|
| RAM | 8 GB | 16 GB |
| CPU | 4 core | 8 core |
| GPU / VRAM | — (CPU inference) | NVIDIA GPU ≥ 4 GB VRAM |
| Storage | 5 GB free | 10 GB free (model weights + cache) |

> CPU-only inference works but a full page may take 15–30 s. Enabling CUDA cuts
> inpainting + OCR time dramatically (see [Optimasi Kinerja](#-pengujian--optimasi-kinerja-testing--performance)).

### 2. Spesifikasi Perangkat Lunak (Software Requirements)

- **Python**: 3.10 / 3.11 (64-bit)
- **Node.js & npm**: ≥ 18
- **Google Chrome**: ≥ 116 (Manifest V3 support)
- **NVIDIA CUDA Driver** (opsional, untuk GPU): CUDA 11.8+ / cuDNN 8+ — hanya
  diperlukan jika `DEVICE=cuda`.

---

## 📁 Struktur Proyek

```
automated-comic-translator/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI entry point, CORS, routes
│   │   ├── config.py                  # Pydantic settings & environment
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── ocr_service.py         # PaddleOCR (horizontal & vertical)
│   │   │   ├── inpaint_service.py     # LaMa inpainting + mask dilation
│   │   │   ├── translator_service.py  # deep_translator + rate-limit failover
│   │   │   └── renderer_service.py    # Pillow auto-wrap & font scaling
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── image_utils.py         # Base64 <-> PIL <-> OpenCV Mat
│   ├── models/                        # AI model weights (see models/README.md)
│   ├── tests/                         # Unit & endpoint tests
│   ├── requirements.txt
│   ├── pyproject.toml
│   ├── .env.example
│   └── Dockerfile
├── extension/
│   ├── manifest.json                  # Manifest V3 configuration
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── _locales/en/messages.json
│   └── src/
│       ├── background/
│       │   └── service-worker.ts      # fetch bridge (images & translation)
│       ├── content/
│       │   ├── content.ts             # DOM manipulator & image replacement
│       │   └── overlay.css            # Translate button & spinner styling
│       ├── popup/
│       │   ├── popup.html
│       │   ├── popup.ts               # language & feature settings
│       │   └── popup.css
│       └── utils/
│           └── api.ts                 # HTTP client wrapper for the backend
├── install.sh                          # ONE-command installer (backend + extension)
├── run.sh                              # ONE-command runner (build + start backend)
└── README.md
```

---

## 🛠️ Panduan Instalasi & Setup

### 1. Setup Backend (FastAPI)

```bash
cd backend

# 1. Create & activate a virtual environment
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# 2. Install dependencies (CPU wheels recommended)
pip install --upgrade pip
pip install -r requirements.txt

# 3. (Optional but faster on CPU) install CPU-only PyTorch before requirements
#    pip install torch --index-url https://download.pytorch.org/whl/cpu

# 4. Configure environment
cp .env.example .env
#    edit .env as needed (see Configuration section)

# 5. Run the server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Verify it is up: open <http://localhost:8000/health>. The interactive Swagger
docs live at <http://localhost:8000/docs>.

> **GPU users**: set `DEVICE=cuda` in `.env` and install the CUDA build of
> `paddlepaddle` + `torch` for your driver/CUDA version (see the official
> [PaddlePaddle](https://www.paddlepaddle.org.cn/) and
> [PyTorch](https://pytorch.org/get-started/locally/) install pages).

### 2. Pengunduhan Model Weights

- **PaddleOCR** downloads its detection / recognition / angle-classification
  models automatically into `~/.paddleocr/` on first run — nothing to do.

- **LaMa** (via `simple-lama-inpainting`) downloads the `big-lama` checkpoint
  automatically into `~/.cache/` on first run — nothing to do.

- If you want to use the optional **ONNX Runtime (quantized INT8)** backend for
  faster CPU inpainting, export `big-lama` to `backend/models/lama.onnx` and set
  `DEVICE=onnx`. See [`backend/models/README.md`](backend/models/README.md).

### 3. Setup Chrome Extension (Frontend)

```bash
cd extension

npm install            # install TypeScript + Vite toolchain
npm run build          # type-checks and bundles into extension/dist/
```

Then load the extension in Chrome:

1. Open `chrome://extensions`.
2. Enable **Developer mode** (toggle, top-right).
3. Click **Load unpacked** and select the `extension/dist/` folder.
4. Pin the extension icon to the toolbar if you like.

> During development use `npm run dev` (Vite watch mode) and reload the
> extension from `chrome://extensions` after each rebuild.

---

## ⚙️ Konfigurasi & Pengaturan (Settings)

### 1. Variabel Lingkungan Backend (.env)

Copy `backend/.env.example` to `backend/.env`. Key options:

| Key | Default | Description |
|---|---|---|
| `HOST` / `PORT` | `0.0.0.0` / `8000` | Bind address & port of the server. |
| `CORS_ORIGINS` | `*` | Allowed origins; comma-separated list or `*` for all. |
| `DEFAULT_SOURCE_LANG` | `auto` | Default source language. |
| `DEFAULT_TARGET_LANG` | `id` | Default target language (id = Indonesian). |
| `OCR_LANG` | `japan` | Source script: `japan` \| `korean` \| `ch` \| `en`. |
| `USE_ANGLE_CLS` | `true` | Enable orientation detection (vertical text). |
| `DEVICE` | `cpu` | Inference device: `cpu` \| `cuda` \| `onnx`. |
| `MASK_DILATION` | `5` | px expansion around each mask (covers text outlines). |
| `MAX_IMAGE_SIZE` | `2000` | longest-edge cap; larger images are downscaled. |
| `FONT_PATH` | *(empty)* | TrueType font for rendering (auto-detect if empty). |
| `TRANSLATOR_PRIMARY` | `google` | First translation provider. |
| `TRANSLATOR_FALLBACKS` | `mymemory,libretranslate` | Failover chain. |
| `ENABLE_BATCH_TRANSLATION` | `true` | Batch all lines into one request. |

### 2. Konfigurasi API Translator & Strategy Fallback

The provider order is: **Google Translate → MyMemory → LibreTranslate**.

- Set the primary provider with `TRANSLATOR_PRIMARY` and the ordered fallbacks
  with `TRANSLATOR_FALLBACKS` (comma-separated).
- `GoogleTranslator` / `MyMemoryTranslator` need no API key (free web APIs).
- For **LibreTranslate**, point `LIBRETRANSLATE_URL` at your instance
  (default `http://localhost:5000`) — useful for full self-hosting / privacy.
- Keep `ENABLE_BATCH_TRANSLATION=true`: joining every OCR line of a page into a
  single request massively reduces the chance of `HTTP 429` rate limiting.

### 3. Konfigurasi Inpainting (CPU vs GPU)

| Mode | `DEVICE` | Notes |
|---|---|---|
| **PyTorch CUDA** | `cuda` | Fastest. Requires CUDA-enabled `torch` + `paddlepaddle` + GPU driver. |
| **CPU Standard** | `cpu` | Works everywhere; slower. Consider `MAX_IMAGE_SIZE` downscaling. |
| **ONNX Quantized** | `onnx` | INT8 quantized LaMa via `onnxruntime`; good CPU speed-up. |

### 4. Pengaturan Ekstensi (Popup Settings)

Click the extension icon in the toolbar to open the popup:

- **Enable extension** — master on/off for the overlay Translate buttons.
- **Target language** — the language to translate *into* (e.g. Indonesian).
- **Source language** — the source script, or *Auto-detect*.
- **Save settings** / **Reset** — persist to `chrome.storage.local`.

The content script reacts to storage changes instantly (no reload needed).

---

## 📖 Cara Penggunaan (Usage Guide)

> **One-command install & run.** Dua skrip bantu disediakan di
> `automated-comic-translator/` agar instalasi dan menjalankan seluruh proyek
> (backend + extension) cukup **satu perintah** masing-masing.

### 1. Menjalankan Sistem

**Instalasi (sekali saja):**
```bash
cd automated-comic-translator
./install.sh          # setup backend venv + deps, npm install, .env
```

**Menjalankan semuanya (frontend + backend):**
```bash
./run.sh              # build extension, lalu jalankan backend FastAPI
```

Opsi `./run.sh`:

| Perintah | Fungsi |
|---|---|
| `./run.sh` | Build extension (sekali) + jalankan backend di foreground. |
| `./run.sh --watch` | Build extension sekali, lalu *watch* (rebuild otomatis saat edit) + jalankan backend. |
| `./run.sh --build-only` | Hanya build extension ke `extension/dist/` (tanpa menjalankan server). |

Setelah `./run.sh`, server berjalan di `http://localhost:8000` (dokumen API di
`/docs`, cek kesehatan di `/health`). Stop dengan `Ctrl+C`.

> Tanpa skrip (manual) — setara dengan `./run.sh`:
> ```bash
> cd backend && source .venv/bin/activate
> uvicorn app.main:app --host 0.0.0.0 --port 8000
> ```
> ```bash
> cd extension && npm run build
> ```

### 2. Memuat Extension di Chrome

Build extension dengan `./run.sh` (atau `--build-only`), lalu:

1. Buka `chrome://extensions`.
2. Aktifkan **Developer mode** (toggle, kanan atas).
3. Klik **Load unpacked** dan pilih folder `extension/dist/`.
4. (Opsional) Sematkan ikon ekstensi ke toolbar.

Buka halaman komik/manga, lalu lanjut ke panduan penerjemahan di bawah.

### 3. Penerjemahan Komik di Browser

1. Open a comic page in your browser (a manga reader, image board, etc.).
2. Hover over a comic image — a blue **Translate** button floats over it.
3. Click **Translate**; a spinner appears ("Grabbing image…", then
   "Translating…") while the pipeline runs.
4. When done, the page image is **replaced in place** with the translated
   version. All OCR text regions are cleaned and re-rendered.
5. If translation fails, a red toast shows the error; the original image is left
   untouched.

> Tip: ensure the backend is running and reachable at
> `http://localhost:8000` (check the footer of the popup).

---

## 📡 Dokumentasi API Backend (API Reference)

### Endpoint: `POST /api/v1/translate`

Runs the full OCR → inpaint → translate → render pipeline on an image.

**Headers**
```
Content-Type: application/json
```

**Request body**
```jsonc
{
  "image": "data:image/png;base64,iVBORw0KGgo...",   // required, base64 (data URL ok)
  "target_lang": "id",   // optional (default from .env)
  "source_lang": "auto", // optional
  "max_size": 2000       // optional longest-edge cap
}
```

**Response `200 OK`**
```jsonc
{
  "image": "data:image/png;base64,...",                 // translated comic (data URL)
  "translations": [
    {
      "original": "こんにちは",
      "translated": "Halo",
      "confidence": 0.987,
      "bbox": [20, 20, 140, 60]
    }
  ],
  "processing_time_ms": 2450.1,
  "width": 1280,
  "height": 1920
}
```

**Errors** — `400 Bad Request` (invalid image payload), `500` (pipeline/model failure).

### Endpoint: `GET /health`

```jsonc
{
  "status": "ok",                 // or "degraded" if a model failed to load
  "app": "Automated Comic Translator",
  "version": "1.0.0",
  "device": "cpu",
  "models": { "ocr": true, "inpaint": true }
}
```

Interactive docs: <http://localhost:8000/docs>.

---

## 🔬 Detail Alur Kerja Pipeline (Technical Workflow)

```
[Browser]  click Translate on an <img>
   │
   ▼
[Content Script] grabs the image as a data URL
   │  (via the service worker's fetch → avoids canvas tainting)
   ▼
[Service Worker] POST { image, target_lang, source_lang } → FastAPI
   │
   ▼
[FastAPI]  /api/v1/translate
   │  1. decode base64 → PIL → downscale (longest edge ≤ MAX_IMAGE_SIZE)
   │  2. OCR (PaddleOCR, use_angle_cls=True) → [bbox + text + confidence]
   │  3. batch-translate lines (Google → MyMemory → LibreTranslate)
   │  4. build mask from bboxes → dilate (MASK_DILATION px)
   │  5. LaMa inpaint the masked regions (removes old text, keeps artwork)
   │  6. Pillow render: auto-wrap + dynamic font scaling + stroke + center
   │  7. re-upscale to original resolution → encode PNG → base64 data URL
   ▼
[Service Worker] ← response JSON
   │
   ▼
[Content Script] img.src = response.image   (in-place DOM replacement)
```

Key implementation points per stage:

- **OCR** (`ocr_service.py`): converts the 4-point polygon PaddleOCR returns
  into `[x_min, y_min, x_max, y_max]`; `use_angle_cls` handles rotated glyphs.
- **Masking + Inpainting** (`inpaint_service.py`): white-on-black mask from all
  bboxes, dilated with `cv2.dilate` so faint strokes are covered, then
  `SimpleLama(image, mask)` regenerates the artwork.
- **Translation** (`translator_service.py`): lines joined with
  `BATCH_DELIMITER`, translated in one call, split back; nested `try/except`
  failover per provider.
- **Rendering** (`renderer_service.py`): `fit_text_to_bbox` decrements the font
  size from `MAX_FONT_SIZE` → `MIN_FONT_SIZE` until the wrapped text fits;
  centering via `multiline_textbbox`; stroke via `stroke_width`.

---

## 🧪 Pengujian & Optimasi Kinerja (Testing & Performance)

### Running tests

```bash
cd backend
pip install -e ".[dev]"
pytest                       # unit + endpoint tests (ML services mocked)
ruff check .                 # lint (optional)
```

The test-suite intentionally **mocks** PaddleOCR / LaMa so it runs fast and
without GPU or heavy downloads. Add real-image integration tests behind a pytest
marker (e.g. `@pytest.mark.slow`) if you want to exercise the true ML stack.

### Optimasi latensi

- **Enable CUDA** (`DEVICE=cuda`) for the biggest speed-up.
- **Cap image size** (`MAX_IMAGE_SIZE`) so LaMa/OCR don't process multi-megapixel
  pages; the image is restored to original size after rendering.
- **Batch translation** (`ENABLE_BATCH_TRANSLATION=true`) avoids per-line HTTP
  round-trips and 429 rate limits.
- **Reduce `MASK_DILATION`** to ~3 for crisp text to shave inpaint time; increase
  to ~7 for thick-outlined fonts.
- **Quantized ONNX** (`DEVICE=onnx`) can beat PyTorch-CPU on many machines.

---

## ❓ Panduan Troubleshooting & FAQ

### 1. Masalah Memory & Performa (CUDA OOM / CPU Slow)

- **CUDA Out of Memory**: set `DEVICE=cpu`, or lower `MAX_IMAGE_SIZE` (e.g. 1600)
  and `MASK_DILATION`. In `main.py`, `torch.cuda.empty_cache()` is called on
  shutdown; you can also free VRAM between requests.
- **CPU too slow**: install CPU wheels (`pip install torch --index-url
  https://download.pytorch.org/whl/cpu`), or use the ONNX quantized backend.
- **Unexpected errors with mixed torch versions**: install dependencies into a
  fresh virtualenv (see Setup).

### 2. Masalah OCR & Teks Vertikal

- Ensure `USE_ANGLE_CLS=true` and `OCR_LANG` matches the script
  (`japan`/`korean`/`ch`/`en`).
- If characters are missed, lower `OCR_THRESHOLD` (e.g. 0.3) and lower
  `OCR_DET_DB_THRESH` slightly.
- Vertical Japanese works best with `use_angle_cls=True`; recognition of rotated
  glyphs requires the angle-classifier models (auto-downloaded).

### 3. Masalah Teks Meluap (Text Overflow) & Alignment

- The renderer auto-shrinks the font until the text fits — if it still overflows,
  the bubble bbox may be tiny; increase `MAX_FONT_SIZE` or check `OCR_THRESHOLD`.
- If text appears off-center, ensure `FONT_PATH` points to a proper TrueType font
  (PIL's default font has inconsistent metrics).
- Use `STROKE_RATIO` to balance outline thickness vs. legibility.

### 4. Masalah CORS & Service Worker Extension

- **CORS blocked**: the backend sets `CORSMiddleware(allow_origins=...)`. In dev
  `CORS_ORIGINS=*` allows all; pin to `chrome-extension://<YOUR_ID>` in prod.
- **Service worker dormant**: MV3 kills idle service workers. We don't keep
  global state — settings live in `chrome.storage.local` and listeners are
  top-level, so messages still wake the worker.
- **Canvas tainted / can't read image**: images are fetched as blobs in the
  **service worker** (never drawn to a canvas in the content script), so
  cross-origin CDN images work as long as they're in `host_permissions`.

---

## 👨‍💻 Panduan Pengembangan & Kontribusi

- **TypeScript (extension)**: strict mode (`tsconfig.json`), `@types/chrome`,
  run `npm run typecheck` before committing. Keep MV3-compatible code (no
  top-level side effects in the service worker beyond listener registration).
- **Python (backend)**: target Python 3.10+, type hints everywhere, `ruff` for
  lint/format (`ruff check .`). Keep heavy model imports *lazy* (inside
  functions) so unit tests and lightweight tools don't import torch/PaddleOCR.
- **Branching / PRs**: open PRs against `main`; add tests for any new service
  logic and keep the ML services mocked in unit tests.

---

## 📜 Lisensi & Kredit

- **Lisensi**: MIT (see `LICENSE`). You are free to use, modify and distribute,
  provided the copyright notice is preserved.
- **Kredit / pihak ketiga**:
  - [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) — text detection & recognition
  - [simple-lama-inpainting](https://github.com/enesmsahin/simple-lama-inpainting) — LaMa inpainting (based on [LaMa](https://github.com/advimman/lama))
  - [deep-translator](https://github.com/nidhaloff/deep-translator) — Google/MyMemory/LibreTranslate bindings
  - [FastAPI](https://fastapi.tiangolo.com/) & [Uvicorn](https://www.uvicorn.org/) — web server
  - [Pillow](https://python-pillow.org/) — image rendering
  - [Vite](https://vitejs.dev/) & [TypeScript](https://www.typescriptlang.org/) — extension tooling

The LaMa model is available under its own license; review third-party licenses
before redistributing model weights. This project is **not affiliated** with any
of the above projects.
