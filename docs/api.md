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
- `GET /geo-profiles?scopeType={zip_code|city|town}&scopeId={value}&limit={1-100}&offset={0+}`
- `POST /geo-profiles/scan`
- `GET /geo-content-briefs?scopeType={zip_code|city|town}&scopeId={value}&limit={1-100}&offset={0+}`
- `POST /geo-content-briefs/generate`

Geo endpoint contracts:
- `POST /geo-profiles/scan` payload:
```json
{
  "scopeType": "city",
  "scopeId": "Bethel",
  "scopeLabel": "Bethel, Maine",
  "existingDetails": ["Downtown retail", "Seasonal tourism"]
}
```
- `POST /geo-content-briefs/generate` payload:
```json
{
  "scopeType": "city",
  "scopeId": "Bethel"
}
```
- List response envelope (`/geo-profiles` and `/geo-content-briefs`):
```json
{
  "items": [],
  "offset": 0,
  "limit": 25,
  "next_offset": 0,
  "has_more": false,
  "total": 0
}
```

Geo audit + metrics:
- Geo scan writes audit event `GEO_PROFILE_REFRESHED` with `meeting_id: "system"`.
- Geo brief generation writes audit event `GEO_CONTENT_GENERATED` with `meeting_id: "system"`.
- `GET /health` includes:
```json
{
  "ok": true,
  "geo_metrics": {
    "profile_refreshed": 0,
    "content_generated": 0
  }
}
```
