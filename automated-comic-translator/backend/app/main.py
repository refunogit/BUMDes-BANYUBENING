"""FastAPI entry point for the Automated Comic Translator backend.

Endpoints
---------
- ``GET  /health``          status of server & loaded models
- ``POST /api/v1/translate`` run the full translation pipeline
"""

from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel, Field

from app.config import settings
from app.services import renderer_service
from app.services.inpaint_service import inpaint_service
from app.services.ocr_service import ocr_service
from app.services.translator_service import translate_batch
from app.utils import image_utils

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger("act.backend")


# --------------------------------------------------------------------------
# Request / response models
# --------------------------------------------------------------------------
class TranslateRequest(BaseModel):
    # Base64 string, optionally with a data:image/...;base64, prefix.
    image: str = Field(..., min_length=16, description="Base64-encoded comic image")
    # Target language code, e.g. "id" (Indonesian), "en", "ko", "ja", ...
    target_lang: str | None = None
    # Source language ("auto" lets the OCR/translator guess).
    source_lang: str | None = None
    # Longest edge cap in px; larger images are downscaled first.
    max_size: int | None = None


class TranslationItem(BaseModel):
    original: str
    translated: str
    confidence: float
    bbox: list[int]


class TranslateResponse(BaseModel):
    image: str                       # data URL of the translated comic
    translations: list[TranslationItem]
    processing_time_ms: float
    width: int
    height: int


class HealthResponse(BaseModel):
    status: str
    app: str
    version: str
    device: str
    models: dict[str, bool]


# --------------------------------------------------------------------------
# Application + CORS
# --------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Loading AI models into memory...")
    load_models()
    yield
    # (optional) release GPU memory on shutdown
    try:
        import torch  # noqa: F401
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    except Exception:  # noqa: BLE001
        pass


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description=(
        "Backend for the Automated Comic Translator Chrome extension. "
        "Runs PaddleOCR + LaMa inpainting + translation + Pillow rendering."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_models() -> None:
    """Preload heavy models at startup so the first request is fast.

    Loading is best-effort: if a model's runtime is missing (e.g. PaddleOCR /
    torch not installed), we log a warning and keep the server up in a
    "degraded" state so ``/health`` still responds.
    """
    for name, svc in (("OCR", ocr_service), ("LaMa", inpaint_service)):
        try:
            svc.init()
        except Exception as exc:  # noqa: BLE001 - model loading is best-effort
            logger.warning("Failed to load %s model: %s", name, exc)


# --------------------------------------------------------------------------
# Routes
# --------------------------------------------------------------------------
@app.get("/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    return HealthResponse(
        status="ok" if (ocr_service.ready and inpaint_service.ready) else "degraded",
        app=settings.APP_NAME,
        version=settings.VERSION,
        device=settings.DEVICE,
        models={"ocr": ocr_service.ready, "inpaint": inpaint_service.ready},
    )


@app.post(f"{settings.API_V1_PREFIX}/translate",
          response_model=TranslateResponse, tags=["translation"])
def translate(req: TranslateRequest) -> TranslateResponse:
    start = time.perf_counter()

    # 0. Decode + downscale ------------------------------------------------
    try:
        image = image_utils.base64_to_pil(req.image)
    except Exception as exc:
        raise HTTPException(
            status_code=400, detail=f"Invalid image payload: {exc}"
        ) from exc

    original_size = image.size
    max_size = req.max_size or settings.MAX_IMAGE_SIZE
    image = image_utils.downscale(image, max_size)

    # 1. OCR -----------------------------------------------------------------
    detections = ocr_service.detect(image)
    if not detections:
        # Nothing to translate: return the (possibly downscaled) original.
        return _finish(image, [], [], start, original_size)

    # 2. Translation ----------------------------------------------------------
    target = req.target_lang or settings.DEFAULT_TARGET_LANG
    source = req.source_lang or settings.DEFAULT_SOURCE_LANG
    translations = translate_batch(
        [d["text"] for d in detections], target, source
    )

    # 3. Inpainting (remove old text) ---------------------------------------
    inpainted = inpaint_service.inpaint(image, detections)

    # 4. Rendering (draw new text) -------------------------------------------
    result = renderer_service.render(inpainted, detections, translations)

    # 5. Restore original resolution ----------------------------------------
    if result.size != original_size:
        result = result.resize(original_size, Image.LANCZOS)

    return _finish(result, detections, translations, start, original_size)


def _finish(image: Image.Image, detections: list[dict],
            translations: list[str], start: float,
            original_size: tuple[int, int]) -> TranslateResponse:
    data_url = image_utils.pil_to_base64(image, fmt="PNG", mode="data_url")
    items = [
        TranslationItem(
            original=det["text"],
            translated=tr if tr else det["text"],
            confidence=float(det.get("confidence", 0.0)),
            bbox=[int(v) for v in det["bbox"]],
        )
        for det, tr in zip(detections, translations, strict=False)
    ]
    elapsed = (time.perf_counter() - start) * 1000.0
    logger.info("Processed %d text regions in %.1f ms", len(items), elapsed)
    return TranslateResponse(
        image=data_url,
        translations=items,
        processing_time_ms=round(elapsed, 2),
        width=original_size[0],
        height=original_size[1],
    )
