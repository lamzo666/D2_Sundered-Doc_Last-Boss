@echo off
setlocal
title Dial Helper - production preview (offline capable)
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

echo Building the production site...
echo.
call npm run build
if errorlevel 1 (
  echo.
  echo Build failed - see the error above.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo  This is the REAL build, with the service worker active.
echo  ^(start.bat runs the dev server, which has no service
echo   worker on purpose - offline will not work there.^)
echo.
echo  To test offline:
echo    1. Open the address below and let the page finish loading
echo    2. F12 - Application - Service workers
echo       Wait for sw.js to show "activated and is running"
echo    3. Tick "Offline", then reload the page ^(Ctrl+R^)
echo    4. The app should load completely, map and all
echo.
echo  When done, click "Unregister" on that same panel so the
echo  cached copy does not confuse later dev sessions.
echo ============================================================
echo.
echo Press Ctrl+C in this window to stop the server.
echo.

call npm run preview -- --open

echo.
echo Preview server stopped.
pause
