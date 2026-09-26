@echo off
:: ============================================================
::  dev-frontend.bat — Start Vite dev server only
:: ============================================================
setlocal

cd /d "%~dp0..\..\frontend"

echo.
echo  Starting Vite frontend dev server...
echo  URL : http://localhost:5173
echo  Press Ctrl+C to stop.
echo.

npm run dev

endlocal
