# ChamberOfCommerceAI Architecture

**Audience**: Developers and self-hosters
**Scope**: Free (self-hosted) tier

## Overview

ChamberOfCommerceAI is a web-based secretary console backed by an API and worker service. The
self-hosted stack is designed to run locally with the Firebase Emulator Suite and
can be switched to real Firebase services for production.

At a high level:

- The **Secretary Console** is a static frontend app.
- The **API service** handles requests and persists data in Firestore/Storage.
- The **Worker service** processes background tasks (currently a stub).
- The **Firebase Emulator Suite** provides local Auth, Firestore, and Storage.

## Components

### Secretary Console (Frontend)

Location: `apps/secretary-console`

- Static HTML/CSS/JS UI.
- Calls API endpoints for meetings, minutes, action items, and settings.
- Feature flags are defined in `apps/secretary-console/modules.js`.

### API Services

There are two implementations used for different contexts:

1) **In-memory mock API** (tests/dev helpers)
   - Location: `services/api`
   - Purpose: Lightweight mock with an HTTP server for test workflows.

2) **Firebase API** (self-hosted default)
   - Location: `services/api-firebase`
   - Express server exposing routes for:
     - Meetings
     - Audio sources
     - Minutes
     - Motions
     - Action items
     - Processing pipeline hooks
     - Public summaries
     - Approval
     - Settings
     - Audit log
     - Retention
   - Uses Firebase Admin SDK with Firestore and Storage.

### Worker Services

There are two implementations:

1) **In-memory worker** (tests/dev helpers)
   - Location: `services/worker`

2) **Firebase worker** (self-hosted default)
   - Location: `services/worker-firebase`
   - Receives `/tasks/process` requests and writes a draft minutes stub to Firestore.

### Firebase Emulator Suite

Defined in `docker-compose.yml` and built with `Dockerfile.emulator`.

- Auth emulator
- Firestore emulator
- Storage emulator
- Emulator UI

## Data Flow (Self-Hosted)

1. User interacts with the Secretary Console UI.
2. UI sends requests to the API service.
3. API reads/writes data in Firestore and Storage.
4. For processing tasks, API forwards to the Worker.
5. Worker updates Firestore with processing results.
6. UI refreshes and renders updated data.

## Runtime Topologies

### Local Development (Docker Compose)

- `firebase-emulators` for Auth/Firestore/Storage
- `api` for REST endpoints
- `worker` for background processing

### Local Development (Node.js)

- `npm run dev:firebase`
- `npm run dev:api`
- `npm run dev:console`

### Production (Self-Hosted)

- Same API and Worker services
- Swap emulators for real Firebase services
- Use a reverse proxy and TLS for public traffic

## Configuration

Key environment variables (see `.env.example`):

- `FIREBASE_USE_EMULATOR`
- `FIRESTORE_EMULATOR_HOST`
- `FIREBASE_AUTH_EMULATOR_HOST`
- `FIREBASE_STORAGE_EMULATOR_HOST`
- `GCP_PROJECT_ID`
- `GCS_BUCKET_NAME`
- `CORS_ORIGIN`
- `WORKER_ENDPOINT`

## Testing Notes

- Playwright E2E tests live under `tests/playwright`.
- Unit tests live under `tests/unit`.
- The in-memory API and worker are used in some test workflows.

## Open Items (Planned)

- Replace worker stubs with real transcription and diarization pipeline.
- Expand observability (metrics, tracing, structured logging).
- Formalize data retention and audit policies.
