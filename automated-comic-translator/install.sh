#!/usr/bin/env bash
# =============================================================================
# Automated Comic Translator — ONE-COMMAND INSTALLER
#
#   ./install.sh
#
# Sets up BOTH the FastAPI backend and the Chrome extension automatically:
#   1. Creates a Python virtualenv & installs backend dependencies.
#   2. Installs the extension toolchain (TypeScript + Vite via npm).
#   3. Creates a local .env from .env.example (if missing).
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
EXTENSION_DIR="$SCRIPT_DIR/extension"

step() { echo; echo "──► $1"; }

# ---- Prerequisite check ----------------------------------------------------
PY="python3"
if ! command -v "$PY" >/dev/null 2>&1; then
  echo "ERROR: python3 not found. Install Python 3.10+ first." >&2
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm not found. Install Node.js 18+ first." >&2
  exit 1
fi

# ---- 1. Backend -------------------------------------------------------------
step "Installing backend (FastAPI + ML stack) — this may take a while"
if [ ! -d "$BACKEND_DIR/.venv" ]; then
  "$PY" -m venv "$BACKEND_DIR/.venv"
fi
# shellcheck disable=SC1091
source "$BACKEND_DIR/.venv/bin/activate"
python -m pip install --upgrade pip
pip install -r "$BACKEND_DIR/requirements.txt"

# ---- 2. Extension -----------------------------------------------------------
step "Installing extension toolchain (TypeScript + Vite)"
( cd "$EXTENSION_DIR" && npm install )

# ---- 3. Environment ---------------------------------------------------------
step "Preparing backend/.env from template"
if [ ! -f "$BACKEND_DIR/.env" ]; then
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  echo "  Created backend/.env (defaults). Edit it if needed."
else
  echo "  backend/.env already exists — leaving it untouched."
fi

echo
echo "✅ Install complete."
echo "   Next: load the extension in Chrome via chrome://extensions → Load unpacked"
echo "   (select the folder: $EXTENSION_DIR/dist)  — build it first with ./run.sh"
echo
