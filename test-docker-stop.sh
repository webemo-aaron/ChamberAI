#!/bin/bash

echo "Stopping ChamberAI Docker Test Environment..."
echo "=============================================="

# Stop Firebase emulators
if [ -f firebase-emulator.pid ]; then
    PID=$(cat firebase-emulator.pid)
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        echo "✓ Firebase emulators stopped (PID: $PID)"
    fi
    rm firebase-emulator.pid
fi

# Stop Docker containers
docker stop chamberai-api-test 2>/dev/null && echo "✓ API container stopped"
docker stop chamberai-worker-test 2>/dev/null && echo "✓ Worker container stopped"

# Remove containers
docker rm chamberai-api-test 2>/dev/null && echo "✓ API container removed"
docker rm chamberai-worker-test 2>/dev/null && echo "✓ Worker container removed"

echo ""
echo "=============================================="
echo "All services stopped and cleaned up"
echo "=============================================="
