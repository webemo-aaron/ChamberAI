# CAM-AIMS API (In-Memory Mock)

This mock API is implemented as in-memory functions for testing:
- Meetings: create, list, get, update
- Audio: register, list
- Processing: start batch pipeline, status
- Minutes: draft update, approve, export
- Action Items: update, list
- Retention: sweep

See `services/api/index.js` for exports and `services/api/server.js` for the mock HTTP server.

Run locally:
- `npm run dev:api`

Additional endpoints:
- `GET /meetings/{id}/approval-status`
- `GET /meetings/{id}/motions`
- `PUT /meetings/{id}/motions`
- `GET /meetings/{id}/public-summary`
- `PUT /meetings/{id}/public-summary`
- `POST /meetings/{id}/public-summary/generate`
- `POST /meetings/{id}/public-summary/publish`

Public summary payload includes:
- `content` (compiled text)
- `fields` (structured sections)
- `checklist` (publish readiness flags)
- `GET /meetings/{id}/audit-log`
- `GET /meetings/{id}/action-items/export/csv`
- `POST /retention/sweep`
- `GET /settings`
- `PUT /settings`
