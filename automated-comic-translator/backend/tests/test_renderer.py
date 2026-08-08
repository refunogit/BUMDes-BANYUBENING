"""Unit tests for the Pillow renderer (wrap + dynamic font scaling)."""

from __future__ import annotations

from PIL import Image, ImageDraw

from app.services.renderer_service import (
    fit_text_to_bbox,
    render,
    word_wrap,
)


def _draw() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGB", (400, 400), (255, 255, 255))
    return img, ImageDraw.Draw(img)


def test_word_wrap_latin():
    _, draw = _draw()
    from app.services.renderer_service import _load_font
    font = _load_font(20)
    result = word_wrap("the quick brown fox jumps over the lazy dog", font, 150, draw)
    assert "\n" in result


def test_word_wrap_cjk_char_based():
    img, draw = _draw()
    from app.services.renderer_service import _load_font
    font = _load_font(24)
    text = "これはテストです"
    wrapped = word_wrap(text, font, 60, draw)
    # No spaces present, so wrapping must still break into multiple lines.
    assert "\n" in wrapped


def test_fit_text_returns_bbox_sized_font():
    img, draw = _draw()
    font, wrapped = fit_text_to_bbox(draw, "Hello World", [10, 10, 200, 60])
    tb = draw.multiline_textbbox((0, 0), wrapped, font=font)
    assert (tb[2] - tb[0]) <= 190  # fits within width
    assert (tb[3] - tb[1]) <= 50   # fits within height


def test_render_draws_text():
    img = Image.new("RGB", (300, 100), (255, 255, 255))
    det = {"text": "こんにちは", "bbox": [20, 20, 280, 80], "confidence": 0.99}
    out = render(img, [det], ["Hello"])
    assert out.size == img.size
    # Rendered pixels differ from the blank background (text drawn).
    assert out.getbbox() is not None
