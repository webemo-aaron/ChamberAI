#!/usr/bin/env bash
set -euo pipefail

# Manual production auth smoke runbook with log capture.
#
# Usage:
#   ./scripts/run_production_auth_smoke.sh [project_id] [api_service] [frontend_url]
#
# Defaults:
#   project_id=cam-aim-dev
#   api_service=chamberai-api
#   frontend_url=https://secretary-console.vercel.app

PROJECT_ID="${1:-cam-aim-dev}"
API_SERVICE="${2:-chamberai-api}"
FRONTEND_URL="${3:-https://secretary-console.vercel.app}"

OUT_DIR="artifacts/auth-smoke"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
CHECKLIST="${OUT_DIR}/auth-smoke-${STAMP}.checklist.txt"
LOGS_FILE="${OUT_DIR}/auth-smoke-${STAMP}.cloudrun.json"
SUMMARY="${OUT_DIR}/auth-smoke-${STAMP}.summary.txt"

mkdir -p "${OUT_DIR}"

cat > "${CHECKLIST}" <<EOF
Production Auth Smoke Checklist
Timestamp (UTC): ${STAMP}
Project: ${PROJECT_ID}
API Service: ${API_SERVICE}
Frontend: ${FRONTEND_URL}

[ ] 1) Open an incognito/private window.
[ ] 2) Navigate to ${FRONTEND_URL}
[ ] 3) Confirm top bar shows "Auth: not connected".
[ ] 4) Click Logout once (if visible), then hard refresh.
[ ] 5) Click "Continue with Google".
[ ] 6) Confirm Google account chooser/auth page appears.
[ ] 7) Sign in as the intended user.
[ ] 8) Confirm top bar shows "Auth: Google connected (<email>)".
[ ] 9) Open Settings -> Motion Integration.
[ ] 10) Click "Test Connection".
[ ] 11) Confirm no 401/403 auth error appears.
[ ] 12) Save Motion config and confirm success banner.

Notes:
- If a step fails, write exact UI error text and timestamp below.

Failure notes:
-
EOF

cat <<EOF
Auth smoke checklist created:
  ${CHECKLIST}

Run through the checklist now in your browser.
EOF

read -r -p "Press Enter after you complete the browser steps and notes..."

echo "Collecting Cloud Run logs for auth/integration endpoints..."
gcloud logging read \
  "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${API_SERVICE}\" AND (jsonPayload.path=\"/integrations/motion/config\" OR jsonPayload.path=\"/integrations/motion/test\" OR textPayload:\"Firebase token verification failed\" OR textPayload:\"Membership lookup failed\")" \
  --project "${PROJECT_ID}" \
  --freshness=2h \
  --limit=200 \
  --format=json > "${LOGS_FILE}"

python - <<'PY' "${LOGS_FILE}" "${SUMMARY}" "${STAMP}" "${PROJECT_ID}" "${API_SERVICE}" "${FRONTEND_URL}"
import json, sys
logs_path, summary_path, stamp, project_id, api_service, frontend = sys.argv[1:]
with open(logs_path, "r", encoding="utf-8") as f:
    raw = json.load(f)

status_counts = {}
endpoint_hits = {}
errors = []
for item in raw:
    jp = item.get("jsonPayload") or {}
    path = jp.get("path")
    status = jp.get("status")
    if path:
      endpoint_hits[path] = endpoint_hits.get(path, 0) + 1
    if status is not None:
      key = str(status)
      status_counts[key] = status_counts.get(key, 0) + 1
    txt = item.get("textPayload") or ""
    if "Firebase token verification failed" in txt or "Membership lookup failed" in txt:
      errors.append(txt.strip())

with open(summary_path, "w", encoding="utf-8") as out:
    out.write("Production Auth Smoke Summary\n")
    out.write(f"Timestamp (UTC): {stamp}\n")
    out.write(f"Project: {project_id}\n")
    out.write(f"API Service: {api_service}\n")
    out.write(f"Frontend: {frontend}\n\n")
    out.write("Endpoint hits (last 2h):\n")
    if endpoint_hits:
      for k in sorted(endpoint_hits):
        out.write(f"- {k}: {endpoint_hits[k]}\n")
    else:
      out.write("- none\n")
    out.write("\nHTTP status counts:\n")
    if status_counts:
      for k in sorted(status_counts, key=lambda x: int(x) if x.isdigit() else x):
        out.write(f"- {k}: {status_counts[k]}\n")
    else:
      out.write("- none\n")
    out.write("\nAuth/backend error snippets:\n")
    if errors:
      for e in errors[:20]:
        out.write(f"- {e}\n")
    else:
      out.write("- none\n")

print(summary_path)
PY

echo
echo "Auth smoke outputs:"
echo "  Checklist: ${CHECKLIST}"
echo "  Cloud Run logs: ${LOGS_FILE}"
echo "  Summary: ${SUMMARY}"
