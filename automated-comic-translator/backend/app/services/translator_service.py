"""Translation service with automated provider failover.

To dodge free-web-API rate limiting (HTTP 429) the service:

1. **Batches** every OCR line of a page into a single request using a rare
   delimiter, then splits the response back into per-line strings.
2. **Fails over** across providers in order:
   ``Google Translate -> MyMemory -> LibreTranslate``.
3. As a last resort returns the untranslated source text rather than failing
   the whole request, so the page always renders.
"""

from __future__ import annotations

import logging
import re

from app.config import settings

logger = logging.getLogger(__name__)


def _translate_single(text: str, source: str, target: str,
                      provider: str) -> str:
    """Translate one text blob via a single named provider.

    Raises on any failure so the caller can try the next provider.
    """
    from deep_translator import (  # local import: dependency
        GoogleTranslator,
        LibreTranslator,
        MyMemoryTranslator,
    )

    if provider == "google":
        return GoogleTranslator(source=source, target=target).translate(text)
    if provider == "mymemory":
        return MyMemoryTranslator(source=source, target=target).translate(text)
    if provider == "libretranslate":
        return LibreTranslator(
            source=source, target=target, base_url=settings.LIBRETRANSLATE_URL
        ).translate(text)
    raise ValueError(f"Unknown translator provider: {provider}")


def _provider_chain() -> list[str]:
    chain = [settings.TRANSLATOR_PRIMARY]
    for p in settings.fallback_providers:
        if p not in chain:
            chain.append(p)
    return chain


def translate_batch(texts: list[str], target: str,
                    source: str = "auto") -> list[str]:
    """Translate a list of OCR lines into ``target`` language.

    Returns one entry per input line (same order/length). Falls back to the
    original text for any line that could not be translated.
    """
    if not texts:
        return []

    chain = _provider_chain()
    # Trim empty lines so we don't waste a request on them.
    non_empty = [t for t in texts if t.strip()]

    if not non_empty:
        return texts[:]

    translated: list[str] = []

    if settings.ENABLE_BATCH_TRANSLATION:
        batch = settings.batch_delimiter.join(non_empty)
        for provider in chain:
            try:
                out = _translate_single(batch, source, target, provider)
                parts = _split_batch(out, len(non_empty))
                if len(parts) == len(non_empty):
                    translated = parts
                    logger.info("Batch translated %d lines via '%s'.",
                                len(non_empty), provider)
                    break
            except Exception as exc:  # noqa: BLE001 - failover
                logger.warning("Batch translate via '%s' failed: %s",
                               provider, exc)
                translated = []
                continue

    # Per-line fallback if batching failed / was disabled.
    if not translated:
        for src_text in non_empty:
            out = src_text
            for provider in chain:
                try:
                    out = _translate_single(src_text, source, target, provider)
                    break
                except Exception as exc:  # noqa: BLE001 - failover
                    logger.warning("Line translate via '%s' failed: %s",
                                   provider, exc)
                    out = src_text
            translated.append(out)

    # Re-align with the original input array (including empty lines).
    result: list[str] = []
    idx = 0
    for t in texts:
        if t.strip():
            result.append(translated[idx] if idx < len(translated) else t)
            idx += 1
        else:
            result.append(t)
    return result


def _split_batch(output: str, expected: int) -> list[str]:
    """Split a batched translation back into lines of the expected count."""
    candidates = [
        settings.batch_delimiter,
        settings.BATCH_DELIMITER,
        "\n-----\n",
        "-----",
    ]

    for delimiter in dict.fromkeys(candidates):
        if not delimiter:
            continue
        parts = [p.strip() for p in output.split(delimiter) if p.strip()]
        if len(parts) == expected:
            return parts

    # Some providers preserve only the dashed separator line but change spacing.
    parts = [p.strip() for p in re.split(r"\n\s*-{3,}\s*\n", output) if p.strip()]
    if len(parts) == expected:
        return parts

    # Last resort: plain line split, but only accept it if it matches the count.
    parts = [p.strip() for p in output.splitlines() if p.strip()]
    if len(parts) == expected:
        return parts

    return [output.strip()] if output.strip() else []
