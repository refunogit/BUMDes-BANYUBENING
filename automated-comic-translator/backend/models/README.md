# Models directory

Place downloaded / exported AI model weights here.

## PaddleOCR
PaddleOCR downloads its detection / recognition / angle-classification
models automatically into `~/.paddleocr/` on first run, so nothing needs to
be placed here for OCR.

## LaMa Inpainting
The `simple-lama-inpainting` package downloads the `big-lama` weights
automatically into `~/.cache/` (via huggingface) on first use.

### ONNX Runtime (optional, quantized CPU inference)
If you want faster CPU inference with ONNX Runtime (INT8):

1. Export / download the LaMa model as `lama.onnx` here.
2. Set `DEVICE=onnx` in your `.env`.

> Note: `simple-lama-inpainting` uses the PyTorch checkpoint. For ONNX you
> can export it with `torch.onnx.export` from the PyTorch checkpoint, or use a
> pre-exported model. This folder is the canonical place to keep such weights.
