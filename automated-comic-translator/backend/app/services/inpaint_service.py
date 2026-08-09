"""LaMa inpainting with OpenCV mask dilation.

Pipeline:
    1. Build a white-on-black mask from every OCR bounding box.
    2. Dilate the mask (``settings.MASK_DILATION`` px) so faint anti-aliasing
       edges / strokes of the old text are fully covered.
    3. Feed the original image + mask to the LaMa model to regenerate the
       underlying artwork cleanly (screentones, gradients, line-art).

LaMa (Large Mask inpainting with Fourier convolutions) is used because it
understands visual context and preserves comic/manga screentone patterns far
better than classic PatchMatch-style algorithms.
"""

from __future__ import annotations

import logging

import numpy as np
from PIL import Image

from app.config import settings

logger = logging.getLogger(__name__)


class InpaintService:
    def __init__(self) -> None:
        self._lama = None
        self.ready = False

    # ---- lifecycle --------------------------------------------------------
    def init(self) -> None:
        if self._lama is not None:
            return
        try:
            from simple_lama_inpainting import SimpleLama  # heavy dep
        except ImportError as exc:  # pragma: no cover
            logger.error(
                "simple-lama-inpainting is not installed. Install it via "
                "backend/requirements.txt before using the backend."
            )
            self.ready = False
            raise RuntimeError(
                "LaMa inpainting unavailable. Install 'simple-lama-inpainting' "
                "and 'torch'."
            ) from exc

        logger.info("Initialising LaMa inpainting on device='%s'...", settings.DEVICE)
        self._lama = SimpleLama(device=_resolve_torch_device(settings.DEVICE))
        self.ready = True
        logger.info("LaMa inpainting ready.")

    # ---- mask building ----------------------------------------------------
    @staticmethod
    def build_mask(size: tuple[int, int],
                   detections: list[dict]) -> np.ndarray:
        """Create a binary mask from OCR detections (white = erase region)."""
        w, h = size
        mask = np.zeros((h, w), dtype=np.uint8)
        for det in detections:
            x0, y0, x1, y1 = (int(v) for v in det["bbox"])
            x0 = max(0, x0)
            y0 = max(0, y0)
            x1 = min(w, x1)
            y1 = min(h, y1)
            if x1 <= x0 or y1 <= y0:
                continue
            mask[y0:y1, x0:x1] = 255
        return mask

    @staticmethod
    def dilate_mask(mask: np.ndarray, kernel_size: int | None = None) -> np.ndarray:
        """Expand white regions of the mask so text outlines are covered."""
        k = kernel_size or settings.MASK_DILATION
        if k <= 0:
            return mask
        try:
            import cv2
        except ImportError as exc:  # pragma: no cover
            raise RuntimeError(
                "OpenCV is unavailable. Install backend dependencies before using inpainting."
            ) from exc
        kernel = np.ones((k * 2 + 1, k * 2 + 1), np.uint8)
        return cv2.dilate(mask, kernel, iterations=1)

    # ---- inpainting -------------------------------------------------------
    def inpaint(self, image: Image.Image, detections: list[dict]) -> Image.Image:
        """Clean all detected text regions and return a regenerated image."""
        if not detections:
            return image.convert("RGB")

        rgb = image.convert("RGB")
        mask = self.build_mask(rgb.size, detections)
        mask = self.dilate_mask(mask)

        if mask.sum() == 0:
            return rgb

        try:
            self.init()
            # simple_lama expects a grayscale uint8 mask of identical size.
            mask_pil = Image.fromarray(mask, mode="L")
            logger.info("Inpainting %d region(s) with LaMa...", len(detections))
            result = self._lama(rgb, mask_pil)
            return result.convert("RGB")
        except Exception as exc:  # noqa: BLE001
            logger.warning("Falling back to OpenCV inpaint: %s", exc)
            return self._opencv_inpaint(rgb, mask)

    @staticmethod
    def _opencv_inpaint(image: Image.Image, mask: np.ndarray) -> Image.Image:
        """Fallback inpainting using OpenCV when LaMa is unavailable."""
        try:
            import cv2
        except ImportError as exc:  # pragma: no cover
            raise RuntimeError(
                "OpenCV is unavailable. Install backend dependencies before using inpainting."
            ) from exc

        bgr = np.asarray(image, dtype=np.uint8)[:, :, ::-1].copy()
        repaired = cv2.inpaint(bgr, mask, 3, cv2.INPAINT_TELEA)
        return Image.fromarray(repaired[:, :, ::-1].copy())


def _resolve_torch_device(device: str):
    """Map our config value to a torch device string, guarding imports."""
    if device in ("onnx", "quantized"):
        # simple_lama handles ONNX via its own path; fall back to CPU default
        # string here and let the integration layer decide.
        return "cpu"
    try:
        import torch  # noqa: F401
    except ImportError:  # pragma: no cover
        return "cpu"
    if device == "cuda":
        return "cuda" if torch.cuda.is_available() else "cpu"
    return "cpu"


# Module-level singleton.
inpaint_service = InpaintService()
