"""Unit tests for the translation service & failover logic."""

from __future__ import annotations

from unittest.mock import patch

from app.services import translator_service


@patch("app.services.translator_service._translate_single")
def test_batch_translation_joins_and_splits(mock_translate):
    # Simulate a batched response that splits back into matching lines.
    mock_translate.return_value = "satu\n-----\ndua\n-----\ntiga"

    result = translator_service.translate_batch(
        ["one", "two", "three"], target="id", source="auto"
    )
    assert result == ["satu", "dua", "tiga"]
    # Called exactly once for the batch (batching is enabled).
    assert mock_translate.call_count == 1


@patch("app.services.translator_service._translate_single")
def test_failover_switches_provider(mock_translate):
    # Google fails (rate limit), MyMemory (2nd provider) succeeds.
    def fake(text, source, target, provider):
        if provider == "google":
            raise RuntimeError("429 Too Many Requests")
        return f"{target}:{text}"

    mock_translate.side_effect = fake

    # Disable batching so per-line fallback path is exercised.
    with patch.object(translator_service.settings, "ENABLE_BATCH_TRANSLATION", False):
        result = translator_service.translate_batch(
            ["hello"], target="id", source="auto"
        )
    assert result == ["id:hello"]


@patch("app.services.translator_service._translate_single")
def test_returns_source_text_when_all_fail(mock_translate):
    mock_translate.side_effect = RuntimeError("all providers down")
    with patch.object(translator_service.settings, "ENABLE_BATCH_TRANSLATION", False):
        result = translator_service.translate_batch(
            ["hello"], target="id", source="auto"
        )
    # Last-resort behaviour: keep the original text so the page still renders.
    assert result == ["hello"]
