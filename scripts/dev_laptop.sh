#!/usr/bin/env bash
set -euo pipefail

emulator_cmd=(npx firebase-tools emulators:start --only firestore,auth,storage --project cam-aims-dev)
api_cmd=(env PORT=4100 npm run dev)
worker_cmd=(npm run dev)
console_cmd=(env PORT=5174 npm run dev:console)

cleanup() {
  if [[ -n "${emu_pid:-}" ]]; then kill "$emu_pid" 2>/dev/null || true; fi
  if [[ -n "${api_pid:-}" ]]; then kill "$api_pid" 2>/dev/null || true; fi
  if [[ -n "${worker_pid:-}" ]]; then kill "$worker_pid" 2>/dev/null || true; fi
  if [[ -n "${console_pid:-}" ]]; then kill "$console_pid" 2>/dev/null || true; fi
}
trap cleanup EXIT INT TERM

pushd /home/webemo-aaron/projects/ChamberAI >/dev/null
"${emulator_cmd[@]}" &
emu_pid=$!
popd >/dev/null

sleep 1

pushd /home/webemo-aaron/projects/ChamberAI/services/api-firebase >/dev/null
"${api_cmd[@]}" &
api_pid=$!
popd >/dev/null

sleep 0.5

pushd /home/webemo-aaron/projects/ChamberAI/services/worker-firebase >/dev/null
"${worker_cmd[@]}" &
worker_pid=$!
popd >/dev/null

sleep 0.5

"${console_cmd[@]}" &
console_pid=$!

wait "$emu_pid" "$api_pid" "$worker_pid" "$console_pid"
