@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js 20 or newer is required.
  echo Download it from https://nodejs.org/
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo npm was not found. Reinstall Node.js with the npm option enabled.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing project dependencies...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

start "" cmd /c "ping 127.0.0.1 -n 3 >nul & start http://localhost:5173"
call npm run dev
endlocal
