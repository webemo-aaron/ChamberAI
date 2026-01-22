#!/usr/bin/env bash
set -euo pipefail

api_cmd=(npm run dev:api)
console_cmd=(env PORT=5174 npm run dev:console)

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

wait "$api_pid" "$console_pid"
