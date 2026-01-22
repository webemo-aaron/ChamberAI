#!/usr/bin/env bash
set -euo pipefail

api_cmd=(npm run dev)
worker_cmd=(npm run dev)
console_cmd=(env PORT=5174 npm run dev:console)

cleanup() {
  if [[ -n "${api_pid:-}" ]]; then kill "$api_pid" 2>/dev/null || true; fi
  if [[ -n "${worker_pid:-}" ]]; then kill "$worker_pid" 2>/dev/null || true; fi
  if [[ -n "${console_pid:-}" ]]; then kill "$console_pid" 2>/dev/null || true; fi
}
trap cleanup EXIT INT TERM

(
  cd /home/webemo-aaron/projects/ChamberAI/services/api-firebase
  "${api_cmd[@]}" &
  echo $! > /tmp/cam_api_firebase.pid
) &

sleep 0.5

(
  cd /home/webemo-aaron/projects/ChamberAI/services/worker-firebase
  "${worker_cmd[@]}" &
  echo $! > /tmp/cam_worker_firebase.pid
) &

sleep 0.5

"${console_cmd[@]}" &
console_pid=$!

api_pid=$(cat /tmp/cam_api_firebase.pid || true)
worker_pid=$(cat /tmp/cam_worker_firebase.pid || true)

wait "$api_pid" "$worker_pid" "$console_pid"
