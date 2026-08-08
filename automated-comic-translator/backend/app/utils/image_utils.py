"""Image conversion helpers: Base64 <-> PIL <-> OpenCV (numpy) matrices."""

from __future__ import annotations

import base64
import io

import numpy as np
from PIL import Image

ImageLike = str | bytes | Image.Image


def strip_data_url(data: str) -> str:
    """Strip a ``data:image/...;base64,`` prefix, returning raw base64."""
    data = data.strip()
    if data.startswith("data:") and "," in data:
        _, _, rest = data.partition(",")
        return rest
    return data


def base64_to_bytes(data: str) -> bytes:
    """Decode a (possibly data-URL prefixed) base64 string into raw bytes."""
    return base64.b64decode(strip_data_url(data), validate=False)


def base64_to_pil(data: str) -> Image.Image:
    """Convert a base64 / data-URL string into an RGB PIL Image."""
    raw = base64_to_bytes(data)
    try:
        img = Image.open(io.BytesIO(raw))
        img.load()
    except Exception as exc:  # pragma: no cover - defensive
        raise ValueError(f"Could not decode image bytes: {exc}") from exc
    return img.convert("RGB")


def bytes_to_pil(data: bytes) -> Image.Image:
    """Convert raw image bytes into an RGB PIL Image."""
    img = Image.open(io.BytesIO(data)).convert("RGB")
    img.load()
    return img


def pil_to_cv(img: Image.Image) -> np.ndarray:
    """Convert a PIL Image to an OpenCV BGR numpy matrix."""
    return np.asarray(img)[:, :, ::-1].copy()


def cv_to_pil(mat: np.ndarray) -> Image.Image:
    """Convert an OpenCV BGR numpy matrix back to a PIL Image."""
    return Image.fromarray(mat[:, :, ::-1].copy())


def pil_to_base64(img: Image.Image, fmt: str = "PNG", mode: str = "data_url") -> str:
    """Encode a PIL Image to base64.

    ``mode="data_url"`` returns ``data:image/png;base64,...`` which the browser
    can assign directly to an ``<img src>`` attribute. ``mode="raw"`` returns
    the bare base64 payload.
    """
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    encoded = base64.b64encode(buf.getvalue()).decode("ascii")
    if mode == "data_url":
        mime = "image/png" if fmt.upper() == "PNG" else f"image/{fmt.lower()}"
        return f"data:{mime};base64,{encoded}"
    return encoded


def downscale(img: Image.Image, max_size: int) -> Image.Image:
    """Downscale an image so its longest edge is at most ``max_size``.

    Returns the original object unchanged when already within limits, so the
    caller can preserve the original dimensions for final re-upscaling.
    """
    w, h = img.size
    longest = max(w, h)
    if longest <= max_size:
        return img
    ratio = max_size / float(longest)
    return img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)
