# ChamberAI Testing Setup Guide

**Last Updated**: 2026-03-04
**Status**: Phase 0 - Critical Environment Setup Documentation

---

## Overview

This guide provides step-by-step instructions to set up the test environment for ChamberAI. A properly configured test environment is **required** to run E2E tests and validate the system.

---

## Test Environment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Test Environment                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Frontend (Vite Dev Server)                            │
│  http://127.0.0.1:5173                                 │
│                                                         │
│  ↓ (API calls via fetch)                               │
│                                                         │
│  API Service (Express)                                 │
│  http://127.0.0.1:4001                                 │
│  - Handles meeting CRUD                                │
│  - Processes audio                                      │
│  - Returns search results                               │
│  - Serves business listings (NEW)                       │
│                                                         │
│  ↓ (async jobs via queue)                              │
│                                                         │
│  Worker Service (Async Processor)                       │
│  http://127.0.0.1:4002                                 │
│  - Processes audio files                               │
│  - Generates minutes (AI)                               │
│  - Extracts motions/actions                             │
│                                                         │
│  ↓ (database reads/writes)                             │
│                                                         │
│  Firebase Emulators                                     │
│  - Auth: 9099                                           │
│  - Firestore: 8080                                      │
│  - Storage: 9199                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Option 1: Docker Compose (Recommended for CI & RC Validation)

**Pros**:
- Isolated environment
- No local ports/conflicts
- Reproducible
- CI/CD compatible

**Cons**:
- Slower startup (~30-60s)
- Can't modify code without rebuilding
- Harder to debug

### 1.1 Start Docker Compose Stack

```bash
# From repo root
docker-compose down  # Clean slate
docker-compose up -d --build

# Wait for services to boot
sleep 30

# Verify all services are running
docker-compose ps
# Expected: 4 containers (api, worker, console, firebase-emulators)
```

### 1.2 Verify Services Health

```bash
# Check API health
curl http://localhost:4001/health
# Expected: {"ok": true}

# Check Worker health
curl http://localhost:4002/health
# Expected: {"ok": true}

# Check Frontend is accessible
curl http://localhost:3000 -s | head -20
# Expected: HTML content

# Check Firebase emulators are responsive
curl http://localhost:8080/v1/projects 2>/dev/null | head -10
# Expected: {"projects": [...]}
```

### 1.3 Run Tests with Docker Compose

```bash
# Make sure environment is running
docker-compose ps | grep -q api && echo "✓ Environment running"

# Run E2E tests (Playwright will connect to http://localhost:3000)
npm run test:e2e:critical

# Or full suite
npm run test:e2e

# Cleanup
docker-compose down
```

### 1.4 Troubleshooting Docker Compose

**Problem**: "Port already in use"
```bash
# Find process using port
lsof -i :4001
lsof -i :3000

# Kill it
kill -9 <PID>

# Or change docker-compose ports
export API_PORT=4011 && docker-compose up -d
```

**Problem**: "Firebase emulator won't start"
```bash
# Check if Java is available
java -version

# If not, install: On Mac: brew install openjdk@21
# On Linux: apt-get install openjdk-21-jre-headless

# Check container logs
docker-compose logs firebase-emulators | tail -30
```

**Problem**: "Tests timeout waiting for frontend"
```bash
# Frontend might not be ready yet
# Check if it's actually running
curl http://localhost:3000

# If not, increase sleep time or add retry logic
# docker-compose up -d && sleep 60 && npm run test:e2e
```

---

## Option 2: Local Development (Faster for Development)

**Pros**:
- Fast hot reload
- Can modify code and test immediately
- Full IDE integration
- Better for debugging

**Cons**:
- More complex setup
- Port conflicts possible
- Firebase emulator must be running separately
- Multiple terminal windows

### 2.1 Install Dependencies

```bash
# Root directory
npm install

# Install service dependencies
cd services/api-firebase && npm install && cd ../..
cd services/worker-firebase && npm install && cd ../..
cd apps/secretary-console && npm install && cd ../../..
```

### 2.2 Start Firebase Emulators (Terminal 1)

```bash
cd services/firebase

# Download emulators if not cached
firebase emulators:start --project=cam-aim-dev

# Or with specific ports
firebase emulators:start \
  --project=cam-aim-dev \
  --host=127.0.0.1 \
  --import=./seed-data

# Expected output:
# ✔  Emulator started - Firestore at http://127.0.0.1:8080
# ✔  Emulator started - Auth at http://127.0.0.1:9099
# ✔  Emulator started - Storage at http://127.0.0.1:9199
```

### 2.3 Start API Service (Terminal 2)

```bash
cd services/api-firebase

# Set environment variables
export FIREBASE_EMULATOR_HOST=127.0.0.1:8080
export GOOGLE_CLOUD_PROJECT=cam-aim-dev
export PORT=4001
export NODE_ENV=development

# Start server (with auto-reload)
npm run dev

# Or manually
node src/server.js

# Expected output:
# API listening on http://0.0.0.0:4001
```

### 2.4 Start Worker Service (Terminal 3)

```bash
cd services/worker-firebase

export FIREBASE_EMULATOR_HOST=127.0.0.1:8080
export GOOGLE_CLOUD_PROJECT=cam-aim-dev
export PORT=4002
export NODE_ENV=development

npm run dev

# Expected output:
# Worker listening on http://0.0.0.0:4002
```

### 2.5 Start Frontend Dev Server (Terminal 4)

```bash
cd apps/secretary-console

# Install Vite dependencies if not already
npm install

# Start dev server
npm run dev

# Expected output:
# VITE v... ready in ... ms
#   ➜  Local:   http://127.0.0.1:5173/
```

### 2.6 Verify All Services Running

```bash
# In a new terminal, run all at once:
curl http://127.0.0.1:4001/health && echo "✓ API"
curl http://127.0.0.1:4002/health && echo "✓ Worker"
curl http://127.0.0.1:5173 -s | head -5 && echo "✓ Frontend"
curl http://127.0.0.1:9099 -s | grep -q "projects" && echo "✓ Auth"
```

---

## Running Tests

### E2E Critical Tests (Quick Validation)

```bash
# Make sure environment is running first!
# (Either docker-compose OR all 4 local services)

npm run test:e2e:critical

# Expected: 5 critical tests passing in ~2-3 minutes
# Output: "tests X, passes X, duration X"
```

### E2E Full Suite

```bash
npm run test:e2e

# Expected: 44 tests passing (may have 5 known flaky tests)
# Duration: 10-15 minutes
```

### Unit Tests (No environment needed)

```bash
npm run test:unit

# Expected: All tests passing
# Duration: <1 minute
```

### Contract Tests

```bash
npm run test:contracts

# Expected: API contracts validated
# Duration: <1 minute
```

---

## Environment Verification Checklist

Use this checklist before running tests:

```bash
#!/bin/bash
echo "=== Environment Verification Checklist ==="

# Check prerequisites
echo "1. Node.js version..."
node --version | grep -q v18 && echo "   ✓ v18+" || echo "   ✗ Need v18+"

echo "2. Docker..."
docker --version >/dev/null 2>&1 && echo "   ✓ Docker installed" || echo "   ✗ Docker not found"

echo "3. Docker Compose..."
docker-compose --version >/dev/null 2>&1 && echo "   ✓ Docker Compose installed" || echo "   ✗ Not found"

echo "4. Java (for emulator)..."
java -version 2>&1 | grep -q "java version\|openjdk" && echo "   ✓ Java installed" || echo "   ✗ Java not found"

echo ""
echo "=== Service Checks ==="

echo "5. API service..."
curl -s http://localhost:4001/health | grep -q '"ok":true' && echo "   ✓ API running" || echo "   ⚠ API not responding"

echo "6. Worker service..."
curl -s http://localhost:4002/health | grep -q '"ok":true' && echo "   ✓ Worker running" || echo "   ⚠ Worker not responding"

echo "7. Frontend..."
curl -s http://localhost:3000 | grep -q "<!doctype html" && echo "   ✓ Frontend running" || echo "   ⚠ Frontend not responding"

echo "8. Firebase Auth..."
curl -s http://localhost:9099 -X POST -H "Content-Type: application/json" -d '{}' >/dev/null && echo "   ✓ Auth emulator running" || echo "   ⚠ Auth emulator not responding"

echo ""
echo "✅ Ready to run tests!" || echo "❌ Fix issues above before testing"
```

Save as `scripts/verify_test_env.sh` and run:
```bash
bash scripts/verify_test_env.sh
```

---

## Common Issues & Fixes

### Issue: "ECONNREFUSED" when running tests

**Cause**: Frontend dev server not running at http://127.0.0.1:5173

**Fix**:
```bash
# Make sure frontend is running
cd apps/secretary-console
npm run dev

# Then in another terminal
npm run test:e2e
```

### Issue: "Firebase emulator failed to start"

**Cause**: Java not installed or port 8080 in use

**Fix**:
```bash
# Check Java
java -version

# Install if needed
# macOS: brew install openjdk@21
# Ubuntu: sudo apt-get install openjdk-21-jre-headless
# Windows: Download from oracle.com

# Or kill process using port 8080
lsof -i :8080 | awk 'NR==2 {print $2}' | xargs kill -9
```

### Issue: "Worker can't connect to Firebase"

**Cause**: FIREBASE_EMULATOR_HOST not set

**Fix**:
```bash
export FIREBASE_EMULATOR_HOST=127.0.0.1:8080
npm run dev  # in services/worker-firebase
```

### Issue: Tests timeout waiting for responses

**Cause**: API/Worker taking too long to respond

**Fix**:
```bash
# Check service logs
docker-compose logs api | tail -30
docker-compose logs worker | tail -30

# Increase timeout in playwright.config.js
# timeout: 120000  # 120 seconds instead of 60
```

---

## Performance Tips

### Speed Up Docker Startup
```bash
# Remove unused containers/images first
docker system prune -a

# Then start fresh
docker-compose up -d --build
```

### Speed Up Unit Tests
```bash
# Run tests in parallel
npm run test:unit -- --parallel

# Run only changed tests (if supported)
npm run test:unit -- --changed
```

### Speed Up E2E Tests (Development)
```bash
# Run single test file
npm run test:e2e -- tests/playwright/meetings.spec.mjs

# Run tests matching pattern
npm run test:e2e -- --grep "should create meeting"

# Run in headed mode to see what's happening
npm run test:e2e -- --headed
```

---

## CI/CD Setup (GitHub Actions)

For automated testing in CI:

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      # Add service containers if needed

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Start Docker Compose
        run: docker-compose up -d --build

      - name: Wait for services
        run: |
          for i in {1..30}; do
            curl -f http://localhost:4001/health && break
            sleep 1
          done

      - name: Run tests
        run: npm run test:e2e:critical

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

      - name: Cleanup
        if: always()
        run: docker-compose down
```

---

## Next Steps

1. **Choose your setup**: Docker Compose (recommended) or Local Development
2. **Follow the setup instructions** for your chosen approach
3. **Verify environment** using the checklist
4. **Run E2E critical tests**: `npm run test:e2e:critical`
5. **If tests pass**, proceed with RC validation
6. **If tests fail**, check the troubleshooting section

---

## Questions?

See related documentation:
- **RC Validation Guide**: `RC_VALIDATION_GUIDE.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **API Docs**: `docs/api-firebase.md`
- **Deployment**: `docs/DEPLOYMENT.md`
