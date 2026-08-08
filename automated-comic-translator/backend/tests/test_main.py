"""Endpoint tests for /health and /api/v1/translate (services mocked)."""

from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.utils.image_utils import pil_to_base64

client = TestClient(app)


def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] in ("ok", "degraded")
    assert "models" in body


def test_translate_pipeline_full():
    # A tiny image with two fake OCR detections.
    img = Image.new("RGB", (320, 160), (255, 255, 255))
    data_url = pil_to_base64(img, mode="data_url")

    detections = [
        {"text": "こんにちは", "confidence": 0.99, "bbox": [20, 20, 140, 60]},
        {"text": "世界", "confidence": 0.98, "bbox": [180, 100, 300, 140]},
    ]

    with (
        patch("app.main.ocr_service.detect", return_value=detections),
        patch("app.main.inpaint_service.inpaint",
              side_effect=lambda image, _dets: image),
        patch("app.main.translate_batch",
              return_value=["Hello", "World"]),
    ):
        resp = client.post(
            "/api/v1/translate",
            json={"image": data_url, "target_lang": "id", "source_lang": "auto"},
        )

    assert resp.status_code == 200
    body = resp.json()
    assert body["image"].startswith("data:image/png;base64,")
    assert body["width"] == 320
    assert body["height"] == 160
    assert len(body["translations"]) == 2
    assert body["translations"][0]["original"] == "こんにちは"
    assert body["translations"][0]["translated"] == "Hello"


def test_translate_returns_original_when_no_text():
    img = Image.new("RGB", (100, 100), (0, 0, 0))
    data_url = pil_to_base64(img, mode="data_url")

    with patch("app.main.ocr_service.detect", return_value=[]):
        resp = client.post("/api/v1/translate", json={"image": data_url})

    assert resp.status_code == 200
    assert resp.json()["translations"] == []


def test_translate_invalid_image_returns_400():
    # Long enough to pass min_length, but not valid base64 image data.
    resp = client.post("/api/v1/translate", json={"image": "!!!not-real-base64-payload!!!"})
    assert resp.status_code == 400
