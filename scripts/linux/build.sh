#!/usr/bin/env bash
# ==============================================================
#  build.sh — Build the frontend for production
# ==============================================================
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo ""
echo " Building frontend for production..."
echo ""

cd "$ROOT/frontend"
npm run build

echo ""
echo " Build complete. Output is in: frontend/dist/"
echo ""
