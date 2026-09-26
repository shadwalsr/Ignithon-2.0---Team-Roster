#!/usr/bin/env bash
# ==============================================================
#  dev-backend.sh — Start FastAPI backend only (hot-reload)
# ==============================================================
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo ""
echo " Starting FastAPI backend..."
echo " API docs : http://127.0.0.1:8000/docs"
echo " Health   : http://127.0.0.1:8000/health"
echo " Press Ctrl+C to stop."
echo ""

cd "$ROOT/Backend"
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
