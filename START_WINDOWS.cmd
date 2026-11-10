@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Install Node.js 22.13 or later from https://nodejs.org/ and run this file again.
 pause
 exit /b 1
)
if not exist node_modules\electron\dist\electron.exe (
 echo Installing pinned desktop dependencies and the Electron runtime...
 call npm ci
 if errorlevel 1 (
  echo Installation failed. Check the error above and your internet connection.
  pause
  exit /b 1
 )
)
call npm start
if errorlevel 1 pause
