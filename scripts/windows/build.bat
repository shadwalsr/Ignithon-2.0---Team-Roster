@echo off
:: ============================================================
::  build.bat — Build the frontend for production
:: ============================================================
setlocal

cd /d "%~dp0..\..\frontend"

echo.
echo  Building frontend for production...
echo.

npm run build
if %ERRORLEVEL% neq 0 (
    echo  ERROR: Build failed.
    exit /b %ERRORLEVEL%
)

echo.
echo  Build complete. Output is in: frontend\dist\
echo.
endlocal
