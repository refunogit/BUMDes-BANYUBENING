"""PaddleOCR text detection & recognition.

Detects both horizontal and vertical (Japanese manga / Korean manhwa /
Chinese manhua) text. Returns a list of detections shaped like::

    [
        {"text": "なにこれ", "confidence": 0.97,
         "bbox": [x_min, y_min, x_max, y_max]},
        ...
    ]

The ``use_angle_cls`` flag enables orientation classification so rotated /
vertical glyphs are rotated back before recognition, dramatically improving
accuracy on manga speech bubbles.
"""

from __future__ import annotations

import logging
import re

import numpy as np
from PIL import Image

from app.config import settings
from app.utils.image_utils import pil_to_cv

logger = logging.getLogger(__name__)


class OCRService:
    def __init__(self) -> None:
        self._engine = None
        self.ready = False

    # ---- lifecycle --------------------------------------------------------
    def init(self) -> None:
        """Lazily instantiate the (heavy) PaddleOCR engine once at startup."""
        if self._engine is not None:
            return
        try:
            from paddleocr import PaddleOCR  # local import: heavy dependency
        except ImportError as exc:  # pragma: no cover
            logger.error(
                "PaddleOCR is not installed. Run: pip install paddleocr "
                "paddlepaddle  (see backend/requirements.txt)."
            )
            self.ready = False
            raise RuntimeError(
                "PaddleOCR unavailable. Install 'paddleocr' and 'paddlepaddle'."
            ) from exc

        logger.info(
            "Initialising PaddleOCR (lang=%s, angle_cls=%s)...",
            settings.OCR_LANG,
            settings.USE_ANGLE_CLS,
        )
        self._engine = self._create_engine(PaddleOCR)
        self.ready = True
        logger.info("PaddleOCR ready.")

    def _create_engine(self, paddle_ocr_cls):
        """Create a PaddleOCR instance while tolerating version-specific kwargs."""
        kwargs = {
            "use_angle_cls": settings.USE_ANGLE_CLS,
            "lang": settings.OCR_LANG,
            "show_log": False,
            "det_db_thresh": settings.OCR_DET_DB_THRESH,
            "det_db_box_thresh": settings.OCR_DET_DB_BOX_THRESH,
            "det_db_unclip_ratio": settings.OCR_DET_DB_UNCLIP_RATIO,
        }
        required_kwargs = {"use_angle_cls", "lang"}

        while True:
            try:
                return paddle_ocr_cls(**kwargs)
            except Exception as exc:  # noqa: BLE001
                match = re.search(r"Unknown argument:\s*(\w+)", str(exc))
                if match:
                    arg_name = match.group(1)
                    if arg_name in kwargs and arg_name not in required_kwargs:
                        logger.warning(
                            "PaddleOCR does not support argument '%s'; retrying without it.",
                            arg_name,
                        )
                        kwargs.pop(arg_name, None)
                        continue
                raise

    # ---- detection --------------------------------------------------------
    def detect(self, image: Image.Image) -> list[dict]:
        """Run OCR and return normalised detections with integer bboxes."""
        self.init()
        mat = pil_to_cv(image)  # HxWx3 BGR
        # PaddleOCR >= 2.6 returns list[ [quad, (text, conf)] ].
        raw = self._engine.ocr(mat, cls=settings.USE_ANGLE_CLS)

        results: list[dict] = []
        if not raw:
            return results

        # Some versions wrap the output one level deeper: [[ ... ]].
        lines = raw[0] if len(raw) == 1 and isinstance(raw[0], list) else raw

        for line in lines:
            # line -> [quad(4x2), (text, confidence)]
            if not line or len(line) < 2:
                continue
            quad, text_conf = line[0], line[1]
            if text_conf is None:
                continue
            text, conf = text_conf
            text = (text or "").strip()
            if not text or conf is None or float(conf) < settings.OCR_THRESHOLD:
                continue

            bbox = self._quad_to_bbox(np.asarray(quad, dtype=np.float32))
            results.append({
                "text": text,
                "confidence": round(float(conf), 4),
                "bbox": bbox,
            })
        return results

    @staticmethod
    def _quad_to_bbox(quad: np.ndarray) -> list[int]:
        """Convert a 4x2 polygon into [x_min, y_min, x_max, y_max] ints."""
        xs = quad[:, 0]
        ys = quad[:, 1]
        return [
            int(round(float(xs.min()))),
            int(round(float(ys.min()))),
            int(round(float(xs.max()))),
            int(round(float(ys.max()))),
        ]


# Module-level singleton so the engine is shared across requests.
ocr_service = OCRService()
