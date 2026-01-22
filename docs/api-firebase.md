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
- Auth middleware is a placeholder and should be wired to Firebase Auth.
- Processing pipeline endpoints are stubbed.
- CSV export for action items is implemented.
