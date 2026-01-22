# Firebase Worker Service (WIP)

This worker is a stub for processing jobs. It listens for `/tasks/process` and writes a draft minutes stub to Firestore.

Setup:
- Copy `.env.example` to `.env` and fill values.
- Run with `npm run dev` in `services/worker-firebase`

Notes:
- Replace with real transcription pipeline + diarization
- Connect to Cloud Tasks or Pub/Sub
