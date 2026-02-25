#!/bin/bash

set -e

PROJECT_ROOT="$(pwd)"
echo "Starting ChamberOfCommerceAI Docker Test Environment"
echo "==========================================="

# Detect the host address from Docker's perspective
# Try different methods to find the right host IP
detect_host_ip() {
    # First try host.docker.internal (works on Docker Desktop)
    if docker run --rm alpine ping -c 1 host.docker.internal 2>/dev/null | grep -q "bytes from"; then
        echo "host.docker.internal"
        return 0
    fi

    # Fall back to gateway IP
    echo "172.17.0.1"
}

HOST_IP=$(detect_host_ip)
echo "Detected host IP for Docker: $HOST_IP"

# Start Firebase emulators
echo ""
echo "Starting Firebase Emulators..."
cd "$PROJECT_ROOT"
firebase emulators:start --only auth,firestore,storage > firebase-emulator.log 2>&1 &
FIREBASE_PID=$!
echo $FIREBASE_PID > firebase-emulator.pid

# Wait for emulators to start
echo "Waiting for emulators to start..."
sleep 10

# Check if Firebase started
if ! kill -0 $FIREBASE_PID 2>/dev/null; then
    echo "ERROR: Firebase emulators failed to start"
    cat firebase-emulator.log
    exit 1
fi

echo "Firebase emulators started (PID: $FIREBASE_PID)"

# Start API service
echo ""
echo "Starting API Service..."
docker run -d \
    --name chamberofcommerceai-api-test \
    -p 4001:8080 \
    -e PORT=8080 \
    -e NODE_ENV=development \
    -e GCP_PROJECT_ID=chamberofcommerceai-local \
    -e FIREBASE_AUTH_ENABLED=false \
    -e FIRESTORE_EMULATOR_HOST=$HOST_IP:8080 \
    -e FIREBASE_AUTH_EMULATOR_HOST=$HOST_IP:9099 \
    -e FIREBASE_STORAGE_EMULATOR_HOST=$HOST_IP:9199 \
    -e GCS_BUCKET_NAME=chamberofcommerceai-local-audio \
    -e CORS_ORIGIN="http://localhost:5173" \
    -e WORKER_ENDPOINT="http://localhost:4002/tasks/process" \
    chamberofcommerceai-api:local > /dev/null

sleep 2

# Start Worker service
echo "Starting Worker Service..."
docker run -d \
    --name chamberofcommerceai-worker-test \
    -p 4002:8080 \
    -e PORT=8080 \
    -e NODE_ENV=development \
    -e GCP_PROJECT_ID=chamberofcommerceai-local \
    -e FIRESTORE_EMULATOR_HOST=$HOST_IP:8080 \
    -e FIREBASE_AUTH_EMULATOR_HOST=$HOST_IP:9099 \
    -e FIREBASE_STORAGE_EMULATOR_HOST=$HOST_IP:9199 \
    chamberofcommerceai-worker:local > /dev/null

sleep 2

# Test endpoints
echo ""
echo "Testing Endpoints..."
echo "==================="

echo ""
echo "1. API Health Check..."
curl -s http://localhost:4001/health | jq . || echo "FAILED"

echo ""
echo "2. Worker Health Check..."
curl -s http://localhost:4002/health | jq . || echo "FAILED"

echo ""
echo "3. API Meetings Endpoint (GET /meetings)..."
curl -s http://localhost:4001/meetings 2>&1 | head -20

echo ""
echo "4. Create Meeting (POST /meetings)..."
curl -s -X POST http://localhost:4001/meetings \
    -H "Content-Type: application/json" \
    -d '{
        "title": "Test Board Meeting",
        "date": "2026-02-12",
        "organization_id": "org-test-1",
        "location": "Conference Room A"
    }' | jq .

echo ""
echo "==========================================="
echo "✓ Test Environment Started Successfully!"
echo "==========================================="
echo ""
echo "Services running:"
echo "  - Firebase Emulators: http://localhost:4000"
echo "  - API Service: http://localhost:4001"
echo "  - Worker Service: http://localhost:4002"
echo "  - Firestore: 127.0.0.1:8080"
echo "  - Auth: 127.0.0.1:9099"
echo "  - Storage: 127.0.0.1:9199"
echo ""
echo "To stop services, run: ./test-docker-stop.sh"
echo "To view logs:"
echo "  - Firebase: tail -f firebase-emulator.log"
echo "  - API: docker logs -f chamberofcommerceai-api-test"
echo "  - Worker: docker logs -f chamberofcommerceai-worker-test"
