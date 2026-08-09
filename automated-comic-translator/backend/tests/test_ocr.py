"""Unit tests for PaddleOCR initialisation compatibility handling."""

from __future__ import annotations

from app.config import settings
from app.services.ocr_service import OCRService


def test_create_engine_retries_without_unknown_kwargs():
    captured: dict[str, object] = {}

    class FakePaddleOCR:
        def __init__(self, **kwargs):
            if "show_log" in kwargs:
                raise RuntimeError("Unknown argument: show_log")
            captured.update(kwargs)

    service = OCRService()
    engine = service._create_engine(FakePaddleOCR)

    assert engine is not None
    assert "show_log" not in captured
    assert captured["use_angle_cls"] == settings.USE_ANGLE_CLS
    assert captured["lang"] == settings.OCR_LANG
