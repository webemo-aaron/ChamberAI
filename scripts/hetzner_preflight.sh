#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.hybrid}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing env file: ${ENV_FILE}" >&2
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a
source "$(dirname "$0")/load_hcloud_token.sh"

HCLOUD_SERVER_ID="${HCLOUD_SERVER_ID:-}"
HCLOUD_FIREWALL_NAME="${HCLOUD_FIREWALL_NAME:-chamberai-firewall}"
DEPLOY_MIN_DISK_FREE_MB="${DEPLOY_MIN_DISK_FREE_MB:-4096}"
DEPLOY_MIN_MEMORY_FREE_MB="${DEPLOY_MIN_MEMORY_FREE_MB:-512}"
DEPLOY_EXPECTED_INBOUND_PORTS="${DEPLOY_EXPECTED_INBOUND_PORTS:-22,80,443}"

if [[ -z "${HCLOUD_TOKEN:-}" ]]; then
  echo "HCLOUD_TOKEN is missing. Export it or set HCLOUD_TOKEN_FILE in ${ENV_FILE}." >&2
  exit 1
fi

if [[ -z "${HCLOUD_SERVER_ID}" ]]; then
  echo "HCLOUD_SERVER_ID must be set in ${ENV_FILE}." >&2
  exit 1
fi

if ! command -v hcloud >/dev/null 2>&1; then
  echo "hcloud CLI is required for Hetzner preflight." >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required for Hetzner preflight." >&2
  exit 1
fi

if ! command -v free >/dev/null 2>&1; then
  echo "free command is required for memory inspection." >&2
  exit 1
fi

echo "== Hetzner preflight =="
echo "Env file: ${ENV_FILE}"
echo "Server ID: ${HCLOUD_SERVER_ID}"
echo "Firewall: ${HCLOUD_FIREWALL_NAME}"

server_json="$(hcloud server describe "${HCLOUD_SERVER_ID}" -o json)"
firewall_json="$(hcloud firewall describe "${HCLOUD_FIREWALL_NAME}" -o json)"
snapshot_count="$(hcloud image list --selector "snapshot_label=${HCLOUD_SNAPSHOT_LABEL:-chamberai-auto}" -o json | jq 'length')"

server_name="$(printf '%s' "${server_json}" | jq -r '.name')"
server_status="$(printf '%s' "${server_json}" | jq -r '.status')"
server_type="$(printf '%s' "${server_json}" | jq -r '.server_type.name')"
server_location="$(printf '%s' "${server_json}" | jq -r '.datacenter.location.name')"
public_ip="$(printf '%s' "${server_json}" | jq -r '.public_net.ipv4.ip')"
attached_firewall_count="$(printf '%s' "${server_json}" | jq -r '[.public_net.firewalls[]?] | length' 2>/dev/null || printf '0')"

if [[ "${server_status}" != "running" ]]; then
  echo "Hetzner server is not running: ${server_status}" >&2
  exit 1
fi

if [[ -n "${API_DOMAIN:-}" ]]; then
  api_dns_ip="$(getent ahostsv4 "${API_DOMAIN}" 2>/dev/null | awk 'NR==1{print $1}' || true)"
  if [[ -n "${api_dns_ip}" && "${api_dns_ip}" != "${public_ip}" ]]; then
    echo "API_DOMAIN resolves to ${api_dns_ip}, expected ${public_ip}." >&2
    exit 1
  fi
fi

if [[ -n "${APP_DOMAIN:-}" ]]; then
  app_dns_ip="$(getent ahostsv4 "${APP_DOMAIN}" 2>/dev/null | awk 'NR==1{print $1}' || true)"
  if [[ -n "${app_dns_ip}" && "${app_dns_ip}" != "${public_ip}" ]]; then
    echo "APP_DOMAIN resolves to ${app_dns_ip}, expected ${public_ip}." >&2
    exit 1
  fi
fi

IFS=',' read -r -a expected_ports <<< "${DEPLOY_EXPECTED_INBOUND_PORTS}"
for port in "${expected_ports[@]}"; do
  trimmed_port="$(printf '%s' "${port}" | xargs)"
  if ! printf '%s' "${firewall_json}" | jq -e --arg port "${trimmed_port}" '.rules[] | select(.direction == "in") | select(.port == $port or (.port | tostring) == $port)' >/dev/null; then
    echo "Expected inbound firewall port ${trimmed_port} not found on ${HCLOUD_FIREWALL_NAME}." >&2
    exit 1
  fi
done

disk_free_mb="$(df -Pm . | awk 'NR==2{print $4}')"
memory_free_mb="$(free -m | awk '/^Mem:/{print $7}')"

if (( disk_free_mb < DEPLOY_MIN_DISK_FREE_MB )); then
  echo "Disk free ${disk_free_mb}MB below threshold ${DEPLOY_MIN_DISK_FREE_MB}MB." >&2
  exit 1
fi

if (( memory_free_mb < DEPLOY_MIN_MEMORY_FREE_MB )); then
  echo "Memory free ${memory_free_mb}MB below threshold ${DEPLOY_MIN_MEMORY_FREE_MB}MB." >&2
  exit 1
fi

printf 'Server: %s (%s, %s)\n' "${server_name}" "${server_type}" "${server_location}"
printf 'Public IP: %s\n' "${public_ip}"
printf 'Snapshots with label %s: %s\n' "${HCLOUD_SNAPSHOT_LABEL:-chamberai-auto}" "${snapshot_count}"
printf 'Disk free: %sMB\n' "${disk_free_mb}"
printf 'Memory free: %sMB\n' "${memory_free_mb}"
printf 'Attached firewalls: %s\n' "${attached_firewall_count}"
echo "Preflight complete."
