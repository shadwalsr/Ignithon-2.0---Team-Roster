#!/usr/bin/env bash
# ==============================================================
#  lint.sh — Lint backend (ruff) and frontend (oxlint)
# ==============================================================

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ERRORS=0

echo ""
echo " [1/2] Linting Python backend with ruff..."
echo ""
cd "$ROOT/Backend"
uv run ruff check app/ || ERRORS=1

echo ""
echo " [2/2] Linting frontend with oxlint..."
echo ""
cd "$ROOT/frontend"
npm run lint || ERRORS=1

echo ""
if [ "$ERRORS" -eq 0 ]; then
    echo " No lint errors found."
else
    echo " Lint errors detected. See output above."
    exit 1
fi
echo ""
