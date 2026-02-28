#!/bin/bash
#
# Ribbitz Launcher for Linux/macOS
# Usage: ./launch.sh
#
# This script starts the Express sync server and the Vite UI.
# NOTE: OBS Auto Sync (PowerShell script) is Windows-only and will NOT run on Linux.
#

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo "========================================"
echo "  Ribbitz Launcher (Linux/macOS)"
echo "========================================"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed."
    echo "Install it via: https://nodejs.org/"
    exit 1
fi

# Start Express sync server in background
echo "Starting Ribbitz Sync Server (port 5175)..."
cd "$ROOT_DIR/ui/server"
npm run dev &
SERVER_PID=$!

# Give server a moment to start
sleep 2

# Start Vite UI in background
echo "Starting Ribbitz UI (port 5174)..."
cd "$ROOT_DIR/ui"
npm run dev -- --host 127.0.0.1 --port 5174 &
UI_PID=$!

echo ""
echo "========================================"
echo "  Started!"
echo "========================================"
echo ""
echo "  UI:          http://127.0.0.1:5174"
echo "  API:         http://127.0.0.1:5175"
echo "  API Health:  http://127.0.0.1:5175/api/health"
echo ""
echo "  PIDs: Server=$SERVER_PID, UI=$UI_PID"
echo ""
echo "  NOTE: OBS Auto Sync will not run on Linux."
echo "        Run the PowerShell script on a Windows machine for OBS overlays."
echo ""
echo "Press Ctrl+C to stop all services."
echo ""

# Wait for both processes
wait
