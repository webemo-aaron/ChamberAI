#!/usr/bin/env bash
set -euo pipefail

changelog="CHANGELOG.md"

if [[ ! -f "$changelog" ]]; then
  echo "CHANGELOG.md not found" >&2
  exit 1
fi

# Extract only the latest concrete release block (first semantic-version heading after [Unreleased]).
awk '
  BEGIN {started=0}
  /^## \[[0-9]/ {
    if (started==0) {
      started=1
      print
      next
    }
    exit
  }
  started==1 {print}
' "$changelog"
