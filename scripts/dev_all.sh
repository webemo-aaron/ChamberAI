#!/usr/bin/env bash
set -euo pipefail

api_cmd=(npm run dev:api)
console_port="$(bash /home/webemo-aaron/projects/ChamberAI/scripts/resolve_console_port.sh 5173)"
console_cmd=(env CONSOLE_PORT="$console_port" PORT="$console_port" npm run dev:console)

cleanup() {
  if [[ -n "${api_pid:-}" ]]; then kill "$api_pid" 2>/dev/null || true; fi
  if [[ -n "${console_pid:-}" ]]; then kill "$console_pid" 2>/dev/null || true; fi
}
trap cleanup EXIT INT TERM

"${api_cmd[@]}" &
api_pid=$!

sleep 0.5

"${console_cmd[@]}" &
console_pid=$!

echo "Console URL: http://127.0.0.1:${console_port}"

wait "$api_pid" "$console_pid"
