#!/usr/bin/env bash
# ==============================================================
#  dev-frontend.sh — Start Vite dev server only
# ==============================================================
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo ""
echo " Starting Vite frontend dev server..."
echo " URL : http://localhost:5173"
echo " Press Ctrl+C to stop."
echo ""

cd "$ROOT/frontend"
npm run dev
