@echo off
:: ============================================================
::  dev.bat — Start Backend + Frontend in parallel (dev mode)
:: ============================================================
setlocal

:: Move to project root (one level up from scripts\windows\)
cd /d "%~dp0..\.."

echo.
echo  =========================================
echo   Ignithon 2.0 — Full Dev Stack
echo   Backend  : http://127.0.0.1:8000
echo   Frontend : http://localhost:5173
echo  =========================================
echo.

:: Open Backend in a new terminal window
start "Ignithon-API" cmd /k "title Ignithon-API && cd /d "%~dp0..\.." && cd Backend && uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

:: Open Frontend in a new terminal window
start "Ignithon-UI" cmd /k "title Ignithon-UI && cd /d "%~dp0..\.." && cd frontend && npm run dev"

echo  Both servers launched in separate windows.
echo  Close those windows (or press Ctrl+C in each) to stop.
echo.
endlocal
