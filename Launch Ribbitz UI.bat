@echo off
setlocal

set ROOT_DIR=%~dp0

echo Starting Ribbitz Sync Server...
start "Ribbitz Sync Server" cmd /k "cd /d "%ROOT_DIR%ui\server" && npm run dev"

echo Starting Ribbitz UI...
start "Ribbitz UI" cmd /k "cd /d "%ROOT_DIR%ui" && npm run dev"

echo Launch complete.
exit /b 0