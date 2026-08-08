"""Unit tests for Base64 <-> PIL <-> OpenCV conversions."""

from __future__ import annotations

import base64
import io

from PIL import Image

from app.utils.image_utils import (
    base64_to_pil,
    cv_to_pil,
    downscale,
    pil_to_base64,
    pil_to_cv,
    strip_data_url,
)


def _make_image(size=(120, 60), color=(200, 40, 40)) -> Image.Image:
    return Image.new("RGB", size, color)


def test_base64_roundtrip():
    img = _make_image()
    encoded = pil_to_base64(img, mode="raw")
    decoded = base64_to_pil(encoded)
    assert decoded.size == img.size


def test_pil_to_base64_data_url_prefix():
    img = _make_image()
    encoded = pil_to_base64(img, mode="data_url")
    assert encoded.startswith("data:image/png;base64,")
    payload = strip_data_url(encoded)
    # payload decodes to a valid PNG
    Image.open(io.BytesIO(base64.b64decode(payload)))


def test_cv_roundtrip():
    img = _make_image(color=(255, 0, 0))  # red
    mat = pil_to_cv(img)
    assert mat.shape == (60, 120, 3)
    # OpenCV uses BGR, so the red channel is at index 2
    assert mat[0, 0].tolist() == [0, 0, 255]
    back = cv_to_pil(mat)
    assert back.getpixel((0, 0)) == (255, 0, 0)


def test_downscale_only_when_larger():
    img = _make_image(size=(2000, 1000))
    result = downscale(img, 1000)
    assert max(result.size) == 1000
    # untouched when within limit
    small = _make_image(size=(500, 300))
    assert downscale(small, 1000) is small
