#!/usr/bin/env bash
set -euo pipefail

# Create/find Firebase web app and print SDK config for secretary console Google auth.
#
# Usage:
#   ./scripts/setup_firebase_web_auth.sh cam-aim-dev

PROJECT_ID="${1:-}"
if [[ -z "${PROJECT_ID}" ]]; then
  echo "Usage: $0 <firebase-project-id>" >&2
  exit 1
fi

if ! command -v firebase >/dev/null 2>&1; then
  echo "firebase CLI not found." >&2
  exit 1
fi

APP_ID="$(firebase apps:list WEB --project "${PROJECT_ID}" --json | node -e '
let data="";
process.stdin.on("data",d=>data+=d);
process.stdin.on("end",()=>{
  try{
    const parsed=JSON.parse(data);
    const arr=parsed.result||[];
    if(arr.length>0){ process.stdout.write(arr[0].appId || ""); }
  }catch{}
});
')"

if [[ -z "${APP_ID}" ]]; then
  echo "No WEB app found; creating one..."
  firebase apps:create WEB "chamberai-secretary-console" --project "${PROJECT_ID}" --json >/tmp/firebase-app-create.json
  APP_ID="$(node -e 'const fs=require("fs");const p=JSON.parse(fs.readFileSync("/tmp/firebase-app-create.json","utf8"));process.stdout.write(p.result?.appId||"");')"
fi

echo "Firebase WEB app: ${APP_ID}"
echo ""
echo "SDK config:"
firebase apps:sdkconfig WEB "${APP_ID}" --project "${PROJECT_ID}"
echo ""
echo "Next:"
echo "1) Enable Google provider in Firebase Console > Authentication > Sign-in method."
echo "2) Add your Vercel domain under Authentication > Settings > Authorized domains."
echo "3) Copy SDK config values into apps/secretary-console/firebase-config.js and redeploy Vercel."
