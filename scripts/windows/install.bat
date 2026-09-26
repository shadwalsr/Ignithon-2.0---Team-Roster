@echo off
:: ============================================================
::  install.bat — Install all dependencies (backend + frontend)
:: ============================================================
setlocal
set ROOT=%~dp0..\..

echo.
echo  [1/2] Syncing Python backend dependencies via uv...
echo.
cd /d "%ROOT%\Backend"
uv sync --all-groups
if %ERRORLEVEL% neq 0 (
    echo  ERROR: uv sync failed. Is uv installed? https://docs.astral.sh/uv/
    exit /b %ERRORLEVEL%
)

echo.
echo  [2/2] Installing frontend npm dependencies...
echo.
cd /d "%ROOT%\frontend"
npm install
if %ERRORLEVEL% neq 0 (
    echo  ERROR: npm install failed.
    exit /b %ERRORLEVEL%
)

echo.
echo  All dependencies installed successfully.
echo.
endlocal
