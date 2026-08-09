"""Unit tests for inpainting fallbacks."""

from __future__ import annotations

from unittest.mock import patch

import numpy as np
from PIL import Image

from app.services.inpaint_service import InpaintService


def test_inpaint_falls_back_to_opencv_when_lama_unavailable():
    service = InpaintService()
    image = Image.new("RGB", (80, 40), (255, 255, 255))
    detections = [{"bbox": [10, 10, 40, 30], "text": "test", "confidence": 0.9}]
    fake_mask = np.zeros((40, 80), dtype=np.uint8)
    fake_mask[10:30, 10:40] = 255

    with (
        patch.object(service, "init", side_effect=RuntimeError("lama missing")),
        patch.object(service, "dilate_mask", return_value=fake_mask),
        patch.object(service, "_opencv_inpaint", return_value=image) as fallback,
    ):
        result = service.inpaint(image, detections)

    fallback.assert_called_once()
    assert result.size == image.size
    assert result.mode == "RGB"
