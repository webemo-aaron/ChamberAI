#!/usr/bin/env bash
set -euo pipefail

# Enable Firebase Auth + authorized domains, and optionally enable Google provider.
#
# Usage:
#   ./scripts/enable_firebase_google_auth.sh <project-id> [google-oauth-client-id] [google-oauth-client-secret] [extra-domains-csv]
#
# Examples:
#   ./scripts/enable_firebase_google_auth.sh cam-aim-dev
#   ./scripts/enable_firebase_google_auth.sh cam-aim-dev client-id client-secret secretary-console.vercel.app,example.com

PROJECT_ID="${1:-}"
GOOGLE_CLIENT_ID="${2:-}"
GOOGLE_CLIENT_SECRET="${3:-}"
EXTRA_DOMAINS_CSV="${4:-secretary-console.vercel.app,secretary-console-mahooosuc-solutions.vercel.app}"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "Usage: $0 <project-id> [google-oauth-client-id] [google-oauth-client-secret] [extra-domains-csv]" >&2
  exit 1
fi

for cmd in gcloud curl jq; do
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "Missing dependency: ${cmd}" >&2
    exit 1
  fi
done

PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
ACCESS_TOKEN="$(gcloud auth print-access-token)"
AUTH_HEADER="Authorization: Bearer ${ACCESS_TOKEN}"
BILLING_HEADER="x-goog-user-project: ${PROJECT_NUMBER}"

itk() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  local response
  if [[ -n "${body}" ]]; then
    response="$(curl -sS -X "${method}" \
      -H "${AUTH_HEADER}" \
      -H "${BILLING_HEADER}" \
      -H "Content-Type: application/json" \
      "${url}" \
      -d "${body}")"
  else
    response="$(curl -sS -X "${method}" \
      -H "${AUTH_HEADER}" \
      -H "${BILLING_HEADER}" \
      "${url}")"
  fi

  if jq -e '.error' >/dev/null 2>&1 <<<"${response}"; then
    echo "Identity Toolkit API error for ${method} ${url}" >&2
    jq '.error' <<<"${response}" >&2
    return 1
  fi
  echo "${response}"
}

echo "Initializing Identity Platform Auth for ${PROJECT_ID}..."
INIT_RESPONSE="$(curl -sS -X POST \
  -H "${AUTH_HEADER}" \
  -H "${BILLING_HEADER}" \
  -H "Content-Type: application/json" \
  "https://identitytoolkit.googleapis.com/v2/projects/${PROJECT_ID}/identityPlatform:initializeAuth" \
  -d "{}")"
if jq -e '.error' >/dev/null 2>&1 <<<"${INIT_RESPONSE}"; then
  INIT_MESSAGE="$(jq -r '.error.message // ""' <<<"${INIT_RESPONSE}")"
  if [[ "${INIT_MESSAGE}" != *"Identity Platform has already been enabled"* ]]; then
    echo "Identity Toolkit API error while initializing auth:" >&2
    jq '.error' <<<"${INIT_RESPONSE}" >&2
    exit 1
  fi
fi

echo "Reading current auth config..."
CONFIG_JSON="$(itk GET "https://identitytoolkit.googleapis.com/v2/projects/${PROJECT_ID}/config")"

DOMAINS_JSON="$(
  {
    jq -r '.authorizedDomains[]?' <<<"${CONFIG_JSON}"
    tr ',' '\n' <<<"${EXTRA_DOMAINS_CSV}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed '/^$/d'
  } | sort -u | jq -R -s 'split("\n") | map(select(length>0))'
)"

echo "Updating authorized domains..."
UPDATE_BODY="$(jq -cn --argjson domains "${DOMAINS_JSON}" '{authorizedDomains:$domains}')"
itk PATCH "https://identitytoolkit.googleapis.com/v2/projects/${PROJECT_ID}/config?updateMask=authorizedDomains" "${UPDATE_BODY}" >/dev/null

GOOGLE_CONFIG_URL="https://identitytoolkit.googleapis.com/v2/projects/${PROJECT_ID}/defaultSupportedIdpConfigs/google.com"
GOOGLE_CONFIG="$(curl -sS -H "${AUTH_HEADER}" -H "${BILLING_HEADER}" "${GOOGLE_CONFIG_URL}")"
CURRENT_CLIENT_ID="$(jq -r '.clientId // empty' <<<"${GOOGLE_CONFIG}" 2>/dev/null || true)"
CURRENT_CLIENT_SECRET="$(jq -r '.clientSecret // empty' <<<"${GOOGLE_CONFIG}" 2>/dev/null || true)"
FINAL_CLIENT_ID="${GOOGLE_CLIENT_ID:-${CURRENT_CLIENT_ID}}"
FINAL_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-${CURRENT_CLIENT_SECRET}}"

if [[ -n "${FINAL_CLIENT_ID}" && -n "${FINAL_CLIENT_SECRET}" ]]; then
  echo "Enabling Google sign-in provider..."
  GOOGLE_BODY="$(jq -cn --arg clientId "${FINAL_CLIENT_ID}" --arg clientSecret "${FINAL_CLIENT_SECRET}" '{enabled:true, clientId:$clientId, clientSecret:$clientSecret}')"
  if jq -e '.name' <<<"${GOOGLE_CONFIG}" >/dev/null 2>&1; then
    itk PATCH "${GOOGLE_CONFIG_URL}?updateMask=enabled,clientId,clientSecret" "${GOOGLE_BODY}" >/dev/null
  else
    itk POST "https://identitytoolkit.googleapis.com/v2/projects/${PROJECT_ID}/defaultSupportedIdpConfigs?idpId=google.com" "${GOOGLE_BODY}" >/dev/null
  fi
else
  echo "Google provider not enabled automatically: missing OAuth client ID and/or client secret."
  echo "Create or locate a Web OAuth client ID, then rerun:"
  echo "  $0 ${PROJECT_ID} <google-oauth-client-id> <google-oauth-client-secret>"
fi

echo
echo "Current authorized domains:"
itk GET "https://identitytoolkit.googleapis.com/v2/projects/${PROJECT_ID}/config" | jq -r '.authorizedDomains[]' | sed 's/^/- /'

echo
echo "Google provider status:"
if ! itk GET "${GOOGLE_CONFIG_URL}" | jq '{enabled, clientId}'; then
  echo "Not enabled yet. Run with a valid Google OAuth client ID."
fi
