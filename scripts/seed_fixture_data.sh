#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://127.0.0.1:4001}"
SEED_TAG="${SEED_TAG:-fixture-$(date +%s)}"
DATE_BASE="${SEED_DATE:-2026-02-25}"
FIXTURE_CLEANUP_MODE="${FIXTURE_CLEANUP_MODE:-namespace}"

if [[ "${FIXTURE_CLEANUP_MODE}" == "reset" ]]; then
  ./scripts/reset_test_state.sh >/dev/null
fi

create_meeting() {
  local date="$1"
  local location="$2"
  curl -fsS -X POST "${API_BASE}/meetings" \
    -H "Authorization: Bearer demo-token" \
    -H "x-demo-email: admin@acme.com" \
    -H "Content-Type: application/json" \
    -d "{\"date\":\"${date}\",\"start_time\":\"09:00\",\"location\":\"${location}\",\"chair_name\":\"Fixture Chair\",\"secretary_name\":\"Fixture Secretary\"}"
}

id_from_json() {
  node -e 'const fs=require("fs"); const raw=fs.readFileSync(0,"utf8"); const data=JSON.parse(raw); process.stdout.write(String(data.id ?? ""));'
}

set_audio_created_at_days_ago() {
  local audio_id="$1"
  local days_ago="$2"
  docker compose exec -T \
    -e AUDIO_ID="${audio_id}" \
    -e DAYS_AGO="${days_ago}" \
    api node --input-type=module - <<'NODE'
import admin from "firebase-admin";
const audioId = process.env.AUDIO_ID;
const daysAgo = Number(process.env.DAYS_AGO ?? "90");
if (!audioId) process.exit(1);
const projectId = process.env.GCP_PROJECT_ID || "chamberofcommerceai-local";
if (!admin.apps.length) admin.initializeApp({ projectId });
const db = admin.firestore();
const oldDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
await db.collection("audioSources").doc(audioId).set(
  { created_at: admin.firestore.Timestamp.fromDate(oldDate) },
  { merge: true }
);
NODE
}

meeting_created_json="$(create_meeting "${DATE_BASE}" "Fixture Created ${SEED_TAG}")"
meeting_created_id="$(printf '%s' "$meeting_created_json" | id_from_json)"

meeting_draft_json="$(create_meeting "${DATE_BASE}" "Fixture Draft ${SEED_TAG}")"
meeting_draft_id="$(printf '%s' "$meeting_draft_json" | id_from_json)"

curl -fsS -X POST "${API_BASE}/meetings/${meeting_draft_id}/process" \
  -H "Authorization: Bearer demo-token" \
  -H "x-demo-email: admin@acme.com" \
  -H "Content-Type: application/json" \
  -d '{}' >/dev/null

curl -fsS -X PUT "${API_BASE}/meetings/${meeting_draft_id}/draft-minutes" \
  -H "Authorization: Bearer demo-token" \
  -H "x-demo-email: admin@acme.com" \
  -H "Content-Type: application/json" \
  -d '{"content":"Fixture draft minutes v1"}' >/dev/null

meeting_approved_json="$(create_meeting "${DATE_BASE}" "Fixture Approved ${SEED_TAG}")"
meeting_approved_id="$(printf '%s' "$meeting_approved_json" | id_from_json)"

curl -fsS -X POST "${API_BASE}/meetings/${meeting_approved_id}/process" \
  -H "Authorization: Bearer demo-token" \
  -H "x-demo-email: admin@acme.com" \
  -H "Content-Type: application/json" \
  -d '{}' >/dev/null

curl -fsS -X PUT "${API_BASE}/meetings/${meeting_approved_id}/action-items" \
  -H "Authorization: Bearer demo-token" \
  -H "x-demo-email: admin@acme.com" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"description":"Fixture follow-up","owner_name":"Ops","due_date":"2026-03-01","status":"OPEN"}]}' >/dev/null

curl -fsS -X PUT "${API_BASE}/meetings/${meeting_approved_id}/motions" \
  -H "Authorization: Bearer demo-token" \
  -H "x-demo-email: admin@acme.com" \
  -H "Content-Type: application/json" \
  -d '{"motions":[{"text":"Adopt fixture agenda","mover_name":"Fixture Chair","seconder_name":"Fixture Secretary","vote_method":"voice","outcome":"Passed"}]}' >/dev/null

curl -fsS -X PUT "${API_BASE}/meetings/${meeting_approved_id}" \
  -H "Authorization: Bearer demo-token" \
  -H "x-demo-email: admin@acme.com" \
  -H "Content-Type: application/json" \
  -d '{"end_time":"10:30"}' >/dev/null

curl -fsS -X POST "${API_BASE}/meetings/${meeting_approved_id}/approve" \
  -H "Authorization: Bearer demo-token" \
  -H "x-demo-email: admin@acme.com" \
  -H "Content-Type: application/json" \
  -d '{}' >/dev/null

meeting_summary_json="$(create_meeting "${DATE_BASE}" "Fixture Summary Ready ${SEED_TAG}")"
meeting_summary_id="$(printf '%s' "$meeting_summary_json" | id_from_json)"

curl -fsS -X POST "${API_BASE}/meetings/${meeting_summary_id}/process" \
  -H "Authorization: Bearer demo-token" \
  -H "x-demo-email: admin@acme.com" \
  -H "Content-Type: application/json" \
  -d '{}' >/dev/null

curl -fsS -X PUT "${API_BASE}/meetings/${meeting_summary_id}/motions" \
  -H "Authorization: Bearer demo-token" \
  -H "x-demo-email: admin@acme.com" \
  -H "Content-Type: application/json" \
  -d '{"motions":[{"text":"Approve summary-ready fixture","mover_name":"Fixture Chair","seconder_name":"Fixture Secretary","vote_method":"voice","outcome":"Passed"}]}' >/dev/null

curl -fsS -X PUT "${API_BASE}/meetings/${meeting_summary_id}/action-items" \
  -H "Authorization: Bearer demo-token" \
  -H "x-demo-email: admin@acme.com" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"description":"Publish chamber update","owner_name":"Comms","due_date":"2026-03-02","status":"OPEN"}]}' >/dev/null

curl -fsS -X PUT "${API_BASE}/meetings/${meeting_summary_id}" \
  -H "Authorization: Bearer demo-token" \
  -H "x-demo-email: admin@acme.com" \
  -H "Content-Type: application/json" \
  -d '{"end_time":"10:45"}' >/dev/null

curl -fsS -X POST "${API_BASE}/meetings/${meeting_summary_id}/approve" \
  -H "Authorization: Bearer demo-token" \
  -H "x-demo-email: admin@acme.com" \
  -H "Content-Type: application/json" \
  -d '{}' >/dev/null

curl -fsS -X PUT "${API_BASE}/meetings/${meeting_summary_id}/public-summary" \
  -H "Authorization: Bearer demo-token" \
  -H "x-demo-email: admin@acme.com" \
  -H "Content-Type: application/json" \
  -d '{"content":"Fixture summary ready for publication.","fields":{"title":"Fixture Summary"},"checklist":{"no_confidential":true,"names_approved":true,"motions_reviewed":true,"actions_reviewed":true,"chair_approved":true}}' >/dev/null

curl -fsS -X POST "${API_BASE}/meetings/${meeting_summary_id}/public-summary/publish" \
  -H "Authorization: Bearer demo-token" \
  -H "x-demo-email: admin@acme.com" \
  -H "Content-Type: application/json" \
  -d '{}' >/dev/null

meeting_retention_json="$(create_meeting "${DATE_BASE}" "Fixture Retention Aged ${SEED_TAG}")"
meeting_retention_id="$(printf '%s' "$meeting_retention_json" | id_from_json)"

retention_audio_json="$(
curl -fsS -X POST "${API_BASE}/meetings/${meeting_retention_id}/audio-sources" \
  -H "Authorization: Bearer demo-token" \
  -H "x-demo-email: admin@acme.com" \
  -H "Content-Type: application/json" \
  -d '{"type":"UPLOAD","file_uri":"fixture-retention.wav","duration_seconds":300}'
)"
retention_audio_id="$(printf '%s' "$retention_audio_json" | id_from_json)"

curl -fsS -X PUT "${API_BASE}/meetings/${meeting_retention_id}/motions" \
  -H "Authorization: Bearer demo-token" \
  -H "x-demo-email: admin@acme.com" \
  -H "Content-Type: application/json" \
  -d '{"motions":[{"text":"Approve retention fixture","mover_name":"Fixture Chair","seconder_name":"Fixture Secretary","vote_method":"voice","outcome":"Passed"}]}' >/dev/null

curl -fsS -X PUT "${API_BASE}/meetings/${meeting_retention_id}/action-items" \
  -H "Authorization: Bearer demo-token" \
  -H "x-demo-email: admin@acme.com" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"description":"Archive old audio","owner_name":"Records","due_date":"2026-03-03","status":"OPEN"}]}' >/dev/null

curl -fsS -X PUT "${API_BASE}/meetings/${meeting_retention_id}" \
  -H "Authorization: Bearer demo-token" \
  -H "x-demo-email: admin@acme.com" \
  -H "Content-Type: application/json" \
  -d '{"end_time":"11:00"}' >/dev/null

curl -fsS -X POST "${API_BASE}/meetings/${meeting_retention_id}/approve" \
  -H "Authorization: Bearer demo-token" \
  -H "x-demo-email: admin@acme.com" \
  -H "Content-Type: application/json" \
  -d '{}' >/dev/null

set_audio_created_at_days_ago "${retention_audio_id}" 120

echo "Seeded fixture dataset at ${API_BASE}: ${meeting_created_id}, ${meeting_draft_id}, ${meeting_approved_id}, ${meeting_summary_id}, ${meeting_retention_id}"
