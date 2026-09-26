#!/usr/bin/env bash
# ==============================================================
#  install.sh — Install all dependencies (backend + frontend)
# ==============================================================
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo ""
echo " [1/2] Syncing Python backend dependencies via uv..."
echo ""
cd "$ROOT/Backend"
uv sync --all-groups

echo ""
echo " [2/2] Installing frontend npm dependencies..."
echo ""
cd "$ROOT/frontend"
npm install

echo ""
echo " All dependencies installed successfully."
echo ""
