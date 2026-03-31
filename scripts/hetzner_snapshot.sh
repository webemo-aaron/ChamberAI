#!/usr/bin/env bash
#
# hetzner_snapshot.sh
#
# Automated Hetzner server snapshot with retention policy.
# Keeps last 7 snapshots, deletes older ones.
#
# Usage:
#   HCLOUD_TOKEN=xxx SERVER_ID=12345 ./scripts/hetzner_snapshot.sh
#
# Cron example (daily at 2am UTC):
#   0 2 * * * cd /opt/chamberai && HCLOUD_TOKEN=$HCLOUD_TOKEN SERVER_ID=$SERVER_ID ./scripts/hetzner_snapshot.sh >> /var/log/chamberai-snapshot.log 2>&1

set -euo pipefail

SERVER_ID="${SERVER_ID:-}"
SNAPSHOT_LABEL="${SNAPSHOT_LABEL:-chamberai-auto}"
RETENTION_COUNT="${RETENTION_COUNT:-7}"
SNAPSHOT_REASON="${SNAPSHOT_REASON:-scheduled}"
RELEASE_REF="${RELEASE_REF:-manual}"

if [[ -z "${HCLOUD_TOKEN:-}" ]]; then
  echo "ERROR: HCLOUD_TOKEN not set"
  exit 1
fi

if [[ -z "$SERVER_ID" ]]; then
  echo "ERROR: SERVER_ID not set"
  exit 1
fi

if ! command -v hcloud &> /dev/null; then
  echo "ERROR: hcloud CLI not installed"
  exit 1
fi

echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Starting snapshot for server $SERVER_ID"

# Create snapshot
SNAPSHOT_NAME="${SNAPSHOT_LABEL}-$(date -u +'%Y%m%d-%H%M%S')"
echo "Creating snapshot: $SNAPSHOT_NAME"

SNAPSHOT_JSON=$(hcloud server create-image --type snapshot "$SERVER_ID" \
  --description "${SNAPSHOT_REASON}:${RELEASE_REF}:${SNAPSHOT_NAME}" \
  --label "snapshot_label=${SNAPSHOT_LABEL}" \
  --label "snapshot_reason=${SNAPSHOT_REASON}" \
  --label "release_ref=${RELEASE_REF}")

SNAPSHOT_ID=$(printf '%s\n' "${SNAPSHOT_JSON}" | sed -n 's/^Image: //p' | head -1)
if [[ -z "${SNAPSHOT_ID}" ]]; then
  SNAPSHOT_ID="$(
    hcloud image list --selector "snapshot_label=${SNAPSHOT_LABEL},release_ref=${RELEASE_REF}" -o json \
      | jq -r 'sort_by(.created)[-1].id // empty'
  )"
fi

echo "Snapshot created: $SNAPSHOT_ID"

# Wait for snapshot to complete (max 30 minutes)
echo "Waiting for snapshot to complete..."
for i in {1..180}; do
  STATUS=$(hcloud image describe "$SNAPSHOT_ID" -o json | jq -r '.status')
  if [[ "$STATUS" == "available" ]]; then
    echo "Snapshot completed"
    break
  fi
  if [[ $i -eq 180 ]]; then
    echo "ERROR: Snapshot did not complete within 30 minutes"
    exit 1
  fi
  sleep 10
done

# Clean up old snapshots
echo "Cleaning up old snapshots (keeping last $RETENTION_COUNT)..."
OLD_SNAPSHOTS=$(
  hcloud image list --selector "snapshot_label=${SNAPSHOT_LABEL}" -o json \
    | jq -r 'sort_by(.created) | reverse | .[] | .id' \
    | tail -n +$((RETENTION_COUNT + 1))
)

if [[ -n "$OLD_SNAPSHOTS" ]]; then
  while IFS= read -r OLD_SNAPSHOT_ID; do
    echo "Deleting old snapshot: $OLD_SNAPSHOT_ID"
    hcloud image delete "$OLD_SNAPSHOT_ID" || true
  done <<< "$OLD_SNAPSHOTS"
fi

echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Snapshot complete. ID: $SNAPSHOT_ID"
