# Firebase API Service (WIP)

This service is a production-oriented API skeleton that uses Firebase Admin + Firestore + GCS.
Location: `services/api-firebase`

Setup:
1) Create a Firebase service account JSON.
2) Copy `.env.example` to `.env` and fill values.
3) Install dependencies in `services/api-firebase`.

Run:
- `npm install`
- `npm run dev`

Notes:
- Auth middleware supports Firebase ID tokens when `FIREBASE_AUTH_ENABLED=true`.
- Processing pipeline endpoints are stubbed (worker hook).
- CSV export for action items is implemented.
- Audio download URL endpoint is available at `/audio-sources/{id}/download-url`.
- Advanced full-text meeting search endpoint is available at `/search/meetings?q=...`.
- Runtime service metrics are available at `/metrics`.
- Minutes version history endpoint: `GET /meetings/{id}/draft-minutes/versions?limit={1-100}&offset={0+}` returns `{ items, offset, limit, next_offset, has_more, total }`.
  - Query policy: non-numeric `limit`/`offset` returns HTTP `400`; numeric values are clamped (`limit` to 1..100, `offset` to 0+).
- Minutes rollback endpoint: `POST /meetings/{id}/draft-minutes/rollback` (admin/secretary role required).
- For CI/integration auth path tests, `FIREBASE_AUTH_MOCK_TOKENS` can map bearer tokens to mocked user payloads when `FIREBASE_AUTH_ENABLED=true`.
- Retention sweep audit events are written with `meeting_id: "system"` so they are retrievable via `GET /meetings/system/audit-log`.
- Geo intelligence endpoints:
  - `GET /geo-profiles?scopeType={zip_code|city|town}&scopeId={value}&limit={1-100}&offset={0+}`
  - `POST /geo-profiles/scan` (admin/secretary)
  - `GET /geo-content-briefs?scopeType={zip_code|city|town}&scopeId={value}&limit={1-100}&offset={0+}`
  - `POST /geo-content-briefs/generate` (admin/secretary)
- Geo list endpoints return paginated envelopes:
  - `{ items, offset, limit, next_offset, has_more, total }`
  - `limit` and `offset` are clamped when non-ideal values are provided.
- Geo scan/generate write system audit events:
  - `GEO_PROFILE_REFRESHED`
  - `GEO_CONTENT_GENERATED`
- Runtime geo event counters are exposed in `/metrics` under `geo_events`:
  - `profile_refreshed`
  - `content_generated`
