"""Pillow text renderer.

Writes the translated text on top of the inpainted image with:

* **Auto word-wrap** that respects the bounding-box width (character-based
  wrapping is used automatically for space-less CJK text).
* **Dynamic font scaling** — the font size shrinks step by step until the
  wrapped text fits inside the OCR bounding box.
* **Horizontal & vertical centering** within the box.
* **Text stroke / outline** so the text stays readable over busy artwork.
"""

from __future__ import annotations

import logging

from PIL import Image, ImageDraw, ImageFont

from app.config import settings

logger = logging.getLogger(__name__)

# Fonts we try to load (in order) before falling back to PIL's default.
_BUNDLED_FONT_PATHS = [
    "assets/fonts/NotoSans-Regular.ttf",
    "assets/fonts/NotoSansJP-Regular.otf",
    "assets/fonts/DejaVuSans.ttf",
]


def _load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """Load the configured TrueType font at ``size``, else a fallback."""
    candidates: list[str] = []
    if settings.FONT_PATH:
        candidates.append(settings.FONT_PATH)
    candidates += _BUNDLED_FONT_PATHS

    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except Exception:  # noqa: BLE001 - try next candidate
            continue

    # Last resort: PIL default (no true outline glyph scaling on old Pillow).
    try:
        return ImageFont.load_default(size=size)  # Pillow >= 10.1
    except TypeError:
        return ImageFont.load_default()


def word_wrap(text: str, font, max_width: float, draw: ImageDraw.ImageDraw) -> str:
    """Wrap ``text`` to fit ``max_width`` pixels.

    Uses word-based wrapping when spaces exist (Latin/Indonesian), otherwise
    falls back to character-based wrapping for CJK scripts.
    """
    if not text.strip():
        return text

    if " " in text.strip():
        return _word_wrap(text, font, max_width, draw)
    return _char_wrap(text, font, max_width, draw)


def _word_wrap(text: str, font, max_width: float,
               draw: ImageDraw.ImageDraw) -> str:
    lines: list[str] = []
    current = ""
    for word in text.split():
        candidate = (current + " " + word).strip()
        if draw.textlength(candidate, font=font) <= max_width or not current:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return "\n".join(lines)


def _char_wrap(text: str, font, max_width: float,
               draw: ImageDraw.ImageDraw) -> str:
    lines: list[str] = []
    line = ""
    for ch in text:
        candidate = line + ch
        if draw.textlength(candidate, font=font) <= max_width or not line:
            line = candidate
        else:
            lines.append(line)
            line = ch
    if line:
        lines.append(line)
    return "\n".join(lines)


def fit_text_to_bbox(draw: ImageDraw.ImageDraw, text: str,
                     bbox: list[int]) -> tuple[ImageFont.ImageFont, str]:
    """Pick the largest font whose wrapped text fits inside ``bbox``.

    Returns ``(font, wrapped_text)``, degrading to the minimum font size.
    """
    bbox_w = max(1, bbox[2] - bbox[0])
    bbox_h = max(1, bbox[3] - bbox[1])
    min_size = max(1, settings.MIN_FONT_SIZE)
    max_size = max(min_size, settings.MAX_FONT_SIZE)

    fallback_font = _load_font(min_size)
    fallback_wrapped = word_wrap(text, fallback_font, bbox_w, draw)

    for size in range(max_size, min_size - 1, -1):
        font = _load_font(size)
        wrapped = word_wrap(text, font, bbox_w, draw)
        tb = draw.multiline_textbbox((0, 0), wrapped, font=font)
        text_w = tb[2] - tb[0]
        text_h = tb[3] - tb[1]
        if text_w <= bbox_w and text_h <= bbox_h:
            return font, wrapped
    return fallback_font, fallback_wrapped


def render(image: Image.Image, detections: list[dict],
           translations: list[str]) -> Image.Image:
    """Draw translated text over the inpainted image, in place of each OCR box."""
    canvas = image.convert("RGB")
    draw = ImageDraw.Draw(canvas)

    for det, translated in zip(detections, translations, strict=False):
        text = (translated or "").strip()
        if not text:
            continue

        bbox = [int(v) for v in det["bbox"]]
        font, wrapped = fit_text_to_bbox(draw, text, bbox)

        tb = draw.multiline_textbbox((0, 0), wrapped, font=font)
        text_w = tb[2] - tb[0]
        text_h = tb[3] - tb[1]

        cx = (bbox[0] + bbox[2]) / 2.0
        cy = (bbox[1] + bbox[3]) / 2.0
        x = cx - text_w / 2.0
        y = cy - text_h / 2.0

        stroke = max(1, int(font.size * settings.STROKE_RATIO))
        draw.multiline_text(
            (x, y),
            wrapped,
            font=font,
            fill=settings.TEXT_FILL,
            stroke_width=stroke,
            stroke_fill=settings.STROKE_FILL,
            align="center",
        )

    return canvas


def render_single(image: Image.Image, det: dict, translated: str) -> Image.Image:
    """Convenience wrapper to render one detection (used by tests)."""
    return render(image, [det], [translated])
