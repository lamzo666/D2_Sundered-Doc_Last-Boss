@echo off
setlocal
title Dial Helper - dev preview
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo Could not find npm. Install Node.js from https://nodejs.org and try again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Installing dependencies, this only happens once...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed - see the error above.
    pause
    exit /b 1
  )
  echo.
)

echo Starting the dev server...
echo.
echo   Local        opens in your browser automatically
echo   On your phone  use the "Network" address printed below
echo                  ^(phone must be on the same Wi-Fi^)
echo.
echo Press Ctrl+C in this window to stop the server.
echo.

call npm run dev -- --host --open

echo.
echo Dev server stopped.
pause
