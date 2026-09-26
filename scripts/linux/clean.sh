#!/usr/bin/env bash
# ==============================================================
#  clean.sh — Remove build artifacts and caches
# ==============================================================

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo ""
echo " Cleaning project artifacts..."
echo ""

# Frontend
rm -rf "$ROOT/frontend/dist"              && echo " Removed: frontend/dist"
rm -rf "$ROOT/frontend/node_modules/.vite" && echo " Removed: frontend/node_modules/.vite"

# Backend
rm -rf "$ROOT/Backend/.venv"              && echo " Removed: Backend/.venv"
rm -f  "$ROOT/Backend/uv.lock"            && echo " Removed: Backend/uv.lock"
rm -f  "$ROOT/Backend/fraud_evidence.db"  && echo " Removed: Backend/fraud_evidence.db"

# Python caches
find "$ROOT/Backend" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
echo " Removed: Python __pycache__ dirs"

find "$ROOT/Backend" -name "*.pyc" -delete 2>/dev/null
echo " Removed: .pyc files"

echo ""
echo " Clean complete."
echo ""
