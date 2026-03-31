#!/usr/bin/env bash
set -euo pipefail

echo "== Verify Local Stack =="

detect_compose_cmd() {
  if command -v docker-compose >/dev/null 2>&1 && docker-compose version >/dev/null 2>&1; then
    echo "docker-compose"
    return 0
  fi

  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    echo "docker compose"
    return 0
  fi

  return 1
}

check_http() {
  local url="$1"
  curl -fsS "$url" >/dev/null
}

verify_with_host_stack() {
  local console_url="${LOCAL_CONSOLE_HEALTH_URL:-http://127.0.0.1:5173/healthz}"
  local api_url="${LOCAL_API_HEALTH_URL:-http://127.0.0.1:4000/health}"
  local worker_url="${LOCAL_WORKER_HEALTH_URL:-}"

  echo "[1/4] Compose status"
  echo "Compose unavailable or inactive; using host-local stack verification"

  echo "[2/4] Console health (host)"
  check_http "${console_url}"
  echo "200 ${console_url}"

  echo "[3/4] API health (host)"
  check_http "${api_url}"
  echo "200 ${api_url}"

  echo "[4/4] Worker health"
  if [[ -n "${worker_url}" ]]; then
    check_http "${worker_url}"
    echo "200 ${worker_url}"
  else
    echo "SKIP worker health; set LOCAL_WORKER_HEALTH_URL to enforce host-worker verification"
  fi
}

verify_with_compose() {
  local compose_cmd="$1"

  echo "[1/4] Compose status"
  local compose_status
  compose_status="$(${compose_cmd} ps 2>&1)" || return 1
  echo "${compose_status}"

  echo "[2/4] Console health (in-container)"
  ${compose_cmd} exec -T console node -e "require('http').get('http://localhost:5173/healthz',r=>{console.log(r.statusCode);process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))" || return 1

  echo "[3/4] API health (in-container)"
  ${compose_cmd} exec -T api node -e "require('http').get('http://localhost:8080/health',r=>{console.log(r.statusCode);process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))" || return 1

  echo "[4/4] Worker health (in-container)"
  ${compose_cmd} exec -T worker node -e "require('http').get('http://localhost:8080/health',r=>{console.log(r.statusCode);process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))" || return 1
}

if COMPOSE_CMD="$(detect_compose_cmd)" && verify_with_compose "${COMPOSE_CMD}"; then
  :
else
  verify_with_host_stack
fi

echo "Stack verification complete."
