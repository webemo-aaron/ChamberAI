#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://127.0.0.1:4001}"
NOW_DATE="$(date -u +%F)"
SEED_SUFFIX="${SEED_SUFFIX:-$(date +%s)}"

curl -fsS -X POST "${API_BASE}/meetings" \
  -H "Authorization: Bearer demo-token" \
  -H "x-demo-email: admin@acme.com" \
  -H "Content-Type: application/json" \
  -d "{\"date\":\"${NOW_DATE}\",\"start_time\":\"09:00\",\"location\":\"CI Seed ${SEED_SUFFIX}\",\"chair_name\":\"CI Chair\",\"secretary_name\":\"CI Secretary\"}" >/dev/null

echo "Seeded baseline test data at ${API_BASE}"
