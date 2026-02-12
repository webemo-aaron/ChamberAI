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
