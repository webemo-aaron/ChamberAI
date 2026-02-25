# Laptop Hosting Guide (Firebase Emulators)

This setup runs CAM-AIMS fully on your laptop using Firebase emulators.

## 1) Prerequisites
- Node.js installed
- `firebase-tools` (auto via npx)

## 2) Configure Environment

Copy examples:
- `services/api-firebase/.env.laptop.example` → `services/api-firebase/.env`
- `services/worker-firebase/.env.laptop.example` → `services/worker-firebase/.env`

No service account is required when using emulators.

## 3) Run Everything

```
./scripts/dev_laptop.sh
```

This starts:
- Firebase emulators (Auth/Firestore/Storage)
- API (`http://127.0.0.1:4100`)
- Worker (`http://127.0.0.1:4001`)
- Console (prefers `http://127.0.0.1:5173`, auto-falls back if occupied)

Note: Emulator rules are set to allow all reads/writes in `firestore.rules` and `storage.rules`.

## 4) Open the Console
- `http://127.0.0.1:5173` (or the URL printed by `dev_laptop.sh`)
Set API Base (top-right) to `http://127.0.0.1:4100`.

## 5) Troubleshooting

- If a port is in use, change it in `.env` and re-run.
- If storage emulator is not reachable, confirm `STORAGE_EMULATOR_HOST` matches firebase.json.
