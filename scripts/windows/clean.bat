@echo off
:: ============================================================
::  clean.bat — Remove build artifacts and caches
:: ============================================================
setlocal
set ROOT=%~dp0..\..

echo.
echo  Cleaning project artifacts...
echo.

:: Frontend
if exist "%ROOT%\frontend\dist"              rmdir /s /q "%ROOT%\frontend\dist"              && echo  Removed: frontend\dist
if exist "%ROOT%\frontend\node_modules\.vite" rmdir /s /q "%ROOT%\frontend\node_modules\.vite" && echo  Removed: frontend\node_modules\.vite

:: Backend
if exist "%ROOT%\Backend\.venv"             rmdir /s /q "%ROOT%\Backend\.venv"             && echo  Removed: Backend\.venv
if exist "%ROOT%\Backend\uv.lock"           del /q      "%ROOT%\Backend\uv.lock"           && echo  Removed: Backend\uv.lock
if exist "%ROOT%\Backend\fraud_evidence.db" del /q      "%ROOT%\Backend\fraud_evidence.db" && echo  Removed: Backend\fraud_evidence.db

:: Python caches
for /d /r "%ROOT%\Backend" %%d in (__pycache__) do (
    if exist "%%d" rmdir /s /q "%%d"
)
echo  Removed: Python __pycache__ dirs

echo.
echo  Clean complete.
echo.
endlocal
