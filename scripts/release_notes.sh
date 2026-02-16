#!/usr/bin/env bash
set -euo pipefail

changelog="CHANGELOG.md"

if [[ ! -f "$changelog" ]]; then
  echo "CHANGELOG.md not found" >&2
  exit 1
fi

# Extract the latest release block (first heading after [Unreleased])
awk '
  BEGIN {in_release=0}
  /^## \[[0-9]/ {if (in_release==0) {in_release=1; print; next}}
  in_release==1 {print}
  /^## \[/ && in_release==1 && NR>1 {exit}
' "$changelog" | sed '1,0{/^## \[/!d}'
