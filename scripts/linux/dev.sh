#!/usr/bin/env bash
# ==============================================================
#  dev.sh — Start Backend + Frontend in parallel (dev mode)
# ==============================================================
set -e

# Resolve project root (two levels up from scripts/linux/)
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo ""
echo " ========================================="
echo "  Ignithon 2.0 — Full Dev Stack"
echo "  Backend  : http://127.0.0.1:8000"
echo "  Frontend : http://localhost:5173"
echo "  Press Ctrl+C to stop both servers."
echo " ========================================="
echo ""

# Trap Ctrl+C and kill both child processes cleanly
cleanup() {
    echo ""
    echo " Shutting down..."
    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
    wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
    echo " Stopped."
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start backend
(cd "$ROOT/Backend" && uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000) &
BACKEND_PID=$!

# Start frontend
(cd "$ROOT/frontend" && npm run dev) &
FRONTEND_PID=$!

# Wait for either process to exit
wait "$BACKEND_PID" "$FRONTEND_PID"
