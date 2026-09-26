@echo off
:: ============================================================
::  lint.bat — Lint backend (ruff) and frontend (oxlint)
:: ============================================================
setlocal
set ROOT=%~dp0..\..
set ERRORS=0

echo.
echo  [1/2] Linting Python backend with ruff...
echo.
cd /d "%ROOT%\Backend"
uv run ruff check app/
if %ERRORLEVEL% neq 0 set ERRORS=1

echo.
echo  [2/2] Linting frontend with oxlint...
echo.
cd /d "%ROOT%\frontend"
npm run lint
if %ERRORLEVEL% neq 0 set ERRORS=1

echo.
if %ERRORS%==0 (
    echo  No lint errors found.
) else (
    echo  Lint errors detected. See output above.
    exit /b 1
)
echo.
endlocal
