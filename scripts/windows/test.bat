@echo off
:: ============================================================
::  test.bat — Run the backend test suite
:: ============================================================
setlocal

cd /d "%~dp0..\..\Backend"

echo.
echo  Running backend tests with pytest...
echo.

uv run pytest tests/ -v --tb=short
if %ERRORLEVEL% neq 0 (
    echo.
    echo  Some tests failed. See output above.
    exit /b %ERRORLEVEL%
)

echo.
echo  All tests passed.
echo.
endlocal
