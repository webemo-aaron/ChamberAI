#!/usr/bin/env bash
set -euo pipefail

console_host="${CONSOLE_HOST:-127.0.0.1}"
console_port="${CONSOLE_PORT:-5173}"
console_url="http://${console_host}:${console_port}"

echo "== Frontend Diagnostics =="
echo "Target URL: ${console_url}"
echo "Working directory: $(pwd)"

echo
echo "[1/5] Listener check"
if command -v lsof >/dev/null 2>&1; then
  lsof -nP -iTCP:"${console_port}" -sTCP:LISTEN || true
else
  echo "lsof not installed"
fi

echo
echo "[2/5] HTTP root probe"
curl -sS -o /dev/null -w "GET / -> %{http_code}\n" "${console_url}" || true

echo
echo "[3/5] Health probe"
curl -sS -o /dev/null -w "GET /healthz -> %{http_code}\n" "${console_url}/healthz" || true

echo
echo "[4/5] Static file existence"
for file in \
  "/home/webemo-aaron/projects/ChamberAI/apps/secretary-console/index.html" \
  "/home/webemo-aaron/projects/ChamberAI/apps/secretary-console/app.js" \
  "/home/webemo-aaron/projects/ChamberAI/apps/secretary-console/styles.css"; do
  if [[ -f "${file}" ]]; then
    echo "OK ${file}"
  else
    echo "MISSING ${file}"
  fi
done

echo
echo "[5/5] API CORS env (docker compose)"
if command -v docker-compose >/dev/null 2>&1; then
  docker-compose ps >/dev/null 2>&1 || true
  docker-compose exec -T api /bin/sh -lc 'echo "CORS_ORIGIN=${CORS_ORIGIN:-unset}"' 2>/dev/null || true
elif command -v docker >/dev/null 2>&1; then
  docker compose ps >/dev/null 2>&1 || true
  docker compose exec -T api /bin/sh -lc 'echo "CORS_ORIGIN=${CORS_ORIGIN:-unset}"' 2>/dev/null || true
else
  echo "docker compose not installed"
fi
