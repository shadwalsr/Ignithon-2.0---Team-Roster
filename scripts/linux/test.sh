#!/usr/bin/env bash
# ==============================================================
#  test.sh — Run the backend test suite
# ==============================================================
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo ""
echo " Running backend tests with pytest..."
echo ""

cd "$ROOT/Backend"
uv run pytest tests/ -v --tb=short

echo ""
echo " All tests passed."
echo ""
