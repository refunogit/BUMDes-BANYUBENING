#!/usr/bin/env bash
# =============================================================================
# Automated Comic Translator — ONE-COMMAND RUNNER
#
#   ./run.sh                # build extension, then start backend (foreground)
#   ./run.sh --watch        # build extension in watch mode + start backend
#   ./run.sh --build-only   # only build the extension, do not start server
#
# Runs BOTH sides:
#   1. Builds the Chrome extension (TypeScript/Vite) into extension/dist/.
#   2. Starts the FastAPI backend server (uvicorn) on HOST:PORT from .env.
#
# The extension is loaded once into Chrome (chrome://extensions → Load unpacked)
# and its translated output talks to the local backend. With --watch the
# extension rebuilds automatically when you edit its source.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
EXTENSION_DIR="$SCRIPT_DIR/extension"

MODE="run"          # run | watch | build-only
case "${1:-}" in
  --watch)     MODE="watch" ;;
  --build-only) MODE="build-only" ;;
  -h|--help)
    echo "Usage: ./run.sh [--watch | --build-only]"
    exit 0 ;;
esac

step() { echo; echo "──► $1"; }

# ---- Sanity checks ----------------------------------------------------------
if [ ! -d "$EXTENSION_DIR/node_modules" ]; then
  echo "ERROR: extension dependencies missing. Run ./install.sh first." >&2
  exit 1
fi
if [ ! -x "$BACKEND_DIR/.venv/bin/uvicorn" ]; then
  echo "ERROR: backend not installed. Run ./install.sh first." >&2
  exit 1
fi

# ---- 1. Build / watch the extension ------------------------------------------
case "$MODE" in
  build-only)
    step "Building extension (one-shot)"
    ( cd "$EXTENSION_DIR" && npm run build )
    echo "✅ Extension built: $EXTENSION_DIR/dist"
    echo "   Load it in chrome://extensions → Load unpacked"
    exit 0
    ;;
  watch)
    step "Building extension in watch mode"
    ( cd "$EXTENSION_DIR" && npm run build )   # initial build
    ( cd "$EXTENSION_DIR" && npm run dev & )   # rebuild on changes (background)
    ;;
  *)
    step "Building extension (one-shot)"
    ( cd "$EXTENSION_DIR" && npm run build )
    ;;
esac

# ---- 2. Read HOST / PORT from backend/.env (the backend reads .env itself;
#         we just pick up these two for the uvicorn command) ---------------------
read_env() { # $1=key  $2=default
  local key="$1" default="${2:-}"
  local val
  if [ -f "$BACKEND_DIR/.env" ]; then
    val="$(grep -E "^${key}=" "$BACKEND_DIR/.env" | tail -1 | cut -d= -f2- | tr -d '[:space:]')"
  fi
  echo "${val:-$default}"
}
HOST="$(read_env HOST 0.0.0.0)"
PORT="$(read_env PORT 8000)"

# ---- 3. Start the backend server (foreground) ---------------------------------
step "Starting backend on http://$HOST:$PORT  (Ctrl+C to stop)"
echo "   API docs:  http://localhost:$PORT/docs"
echo "   Health:    http://localhost:$PORT/health"
echo
cd "$BACKEND_DIR"
source .venv/bin/activate
exec uvicorn app.main:app --host "$HOST" --port "$PORT"
