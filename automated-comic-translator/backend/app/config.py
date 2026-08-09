"""Application configuration.

All tunable knobs for the backend live here. Values can be overridden via
environment variables or a ``.env`` file (see ``.env.example``). Uses
Pydantic Settings for typed, validated configuration.
"""

from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Absolute path to the backend package directory: backend/app
BASE_DIR = Path(__file__).resolve().parent.parent  # backend/
MODEL_DIR_DEFAULT = BASE_DIR / "models"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ---- Server -----------------------------------------------------------
    APP_NAME: str = "Automated Comic Translator"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Comma separated list, or "*" to allow every origin (dev friendly).
    # For production use explicit origins e.g. "chrome-extension://<ID>".
    CORS_ORIGINS: str = "*"
    MAX_UPLOAD_MB: int = 20

    # ---- Translation defaults --------------------------------------------
    DEFAULT_SOURCE_LANG: str = "auto"
    DEFAULT_TARGET_LANG: str = "id"

    # Ordered failover chain: "google" -> "mymemory" -> "libretranslate"
    TRANSLATOR_PRIMARY: str = "google"
    TRANSLATOR_FALLBACKS: str = "mymemory,libretranslate"
    LIBRETRANSLATE_URL: str = "http://localhost:5000"

    # Batch all OCR lines into a single request to reduce rate-limiting.
    ENABLE_BATCH_TRANSLATION: bool = True
    BATCH_DELIMITER: str = "\n-----\n"

    # ---- OCR (PaddleOCR) ---------------------------------------------------
    # Recognised source script. Options: "japan", "korean", "ch", "en".
    OCR_LANG: str = "japan"
    USE_ANGLE_CLS: bool = True  # orientation / angle classification
    OCR_THRESHOLD: float = 0.5  # minimum recognition confidence
    OCR_DET_DB_THRESH: float = 0.3
    OCR_DET_DB_BOX_THRESH: float = 0.6
    OCR_DET_DB_UNCLIP_RATIO: float = 1.5

    # ---- Inpainting (LaMa) ------------------------------------------------
    MODEL_DIR: str = str(MODEL_DIR_DEFAULT)
    # Execution device: "cpu", "cuda", or "onnx" for quantized ONNX Runtime.
    DEVICE: str = "cpu"
    # Pixel expansion applied to each OCR mask before inpainting so old text
    # outlines / anti-aliasing edges are fully covered.
    MASK_DILATION: int = 5
    # Cap long edge; larger images are downscaled before the pipeline.
    MAX_IMAGE_SIZE: int = 2000

    # ---- Rendering (Pillow) -----------------------------------------------
    # Path to a TrueType font. Empty = try bundled Noto fonts, else default.
    FONT_PATH: str = ""
    MIN_FONT_SIZE: int = 10
    MAX_FONT_SIZE: int = 40
    # Stroke (outline) width as a ratio of the final font size.
    STROKE_RATIO: float = 0.20
    TEXT_FILL: str = "#FFFFFF"
    STROKE_FILL: str = "#000000"

    # ---- Derived helpers ---------------------------------------------------
    @property
    def cors_origin_list(self) -> list[str]:
        if self.CORS_ORIGINS.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def model_dir(self) -> Path:
        return Path(self.MODEL_DIR)

    @property
    def fallback_providers(self) -> list[str]:
        return [p.strip() for p in self.TRANSLATOR_FALLBACKS.split(",") if p.strip()]

    @property
    def batch_delimiter(self) -> str:
        """Return the batch delimiter with common escape sequences resolved.

        This lets `.env` safely store values like ``\n-----\n`` while runtime
        code still receives actual newline characters.
        """
        raw = self.BATCH_DELIMITER
        if "\\" not in raw:
            return raw
        try:
            return raw.encode("utf-8").decode("unicode_escape")
        except UnicodeDecodeError:
            return raw


settings = Settings()
