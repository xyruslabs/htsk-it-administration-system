@echo off
echo ========================================================
echo        SmartHR Enterprise System - Launcher
echo ========================================================
echo.
echo Starting SmartHR Backend Server on port 5000...
start "SmartHR Backend Server" cmd /k "cd /d %~dp0server && node --watch src/index.js"

echo Starting SmartHR Frontend Client on port 5173...
start "SmartHR Frontend Client" cmd /k "cd /d %~dp0client && npm.cmd run dev"

echo.
echo ========================================================
echo Both services launched!
echo Access the application at: http://localhost:5173
echo ========================================================
echo.
timeout /t 3
start http://localhost:5173
