@echo off
:: ============================================================
::  dev-backend.bat — Start FastAPI backend only (hot-reload)
:: ============================================================
setlocal

cd /d "%~dp0..\..\Backend"

echo.
echo  Starting FastAPI backend...
echo  API docs : http://127.0.0.1:8000/docs
echo  Health   : http://127.0.0.1:8000/health
echo  Press Ctrl+C to stop.
echo.

uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

endlocal
