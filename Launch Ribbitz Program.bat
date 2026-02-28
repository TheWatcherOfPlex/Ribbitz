@echo off
setlocal

set ROOT_DIR=%~dp0

echo Starting Ribbitz Sync Server...
start "Ribbitz Sync Server" cmd /k "cd /d "%ROOT_DIR%ui\server" && npm run dev"

echo Starting Ribbitz UI...
start "Ribbitz UI" cmd /k "cd /d "%ROOT_DIR%ui" && npm run dev -- --host 127.0.0.1 --port 5174"

echo Starting Ribbitz Stat Watcher...
start "Ribbitz Stat Watcher" cmd /k "cd /d "%ROOT_DIR%OBS Auto Sync\Engine" && powershell -ExecutionPolicy Bypass -File RibbitsStatAssistant.ps1"

echo.
echo UI should be at:        http://127.0.0.1:5174
echo Sync server should be:  http://127.0.0.1:5175/api/health
echo.
start "" "http://127.0.0.1:5174"

echo Launch complete.
exit /b 0