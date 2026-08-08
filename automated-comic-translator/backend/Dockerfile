# =============================================================================
# Automated Comic Translator - Backend image (CPU)
# Build:   docker build -t act-backend ./backend
# Run:     docker run --rm -p 8000:8000 act-backend
# =============================================================================

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps for OpenCV / PaddleOCR runtime.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 libgomp1 libsm6 libxext6 libxrender1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# Install core deps first, then the heavy ML stack separately so Docker
# layer caching keeps rebuilds fast.
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Pre-download model weights at build time (optional, speeds first run):
# RUN python -c "from simple_lama_inpainting import SimpleLama; SimpleLama()" \
#     || true
# RUN python -c "from paddleocr import PaddleOCR; PaddleOCR(lang='japan', use_angle_cls=True)" \
#     || true

COPY app ./app
COPY models ./models
COPY .env.example ./.env.example

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
