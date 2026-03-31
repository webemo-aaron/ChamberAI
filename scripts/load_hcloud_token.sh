#!/usr/bin/env bash
set -euo pipefail

# Load HCLOUD_TOKEN from a secure local source if it is not already exported.
# Supported sources (first match wins):
# 1) HCLOUD_TOKEN (already in environment)
# 2) HCLOUD_TOKEN_FILE (path to file containing token, first non-empty line)
# 3) ~/.config/hcloud/cli.toml (hcloud CLI config, active/default context token)

if [[ -n "${HCLOUD_TOKEN:-}" ]]; then
  export HCLOUD_TOKEN
  return 0
fi

if [[ -n "${HCLOUD_TOKEN_FILE:-}" && -r "${HCLOUD_TOKEN_FILE}" ]]; then
  token_from_file="$(awk 'NF { print; exit }' "${HCLOUD_TOKEN_FILE}" | tr -d '\r' | xargs)"
  if [[ -n "${token_from_file}" ]]; then
    export HCLOUD_TOKEN="${token_from_file}"
    return 0
  fi
fi

hcloud_cli_config="${HOME}/.config/hcloud/cli.toml"
if [[ -r "${hcloud_cli_config}" ]]; then
  token_from_cli="$(
    awk '
      /^\[context\./ { in_context=1; next }
      /^\[/ && $0 !~ /^\[context\./ { in_context=0 }
      in_context && $0 ~ /^token[[:space:]]*=/ {
        gsub(/^token[[:space:]]*=[[:space:]]*"/, "", $0)
        gsub(/".*$/, "", $0)
        print $0
        exit
      }
    ' "${hcloud_cli_config}" | tr -d '\r' | xargs
  )"
  if [[ -n "${token_from_cli}" ]]; then
    export HCLOUD_TOKEN="${token_from_cli}"
    return 0
  fi
fi

