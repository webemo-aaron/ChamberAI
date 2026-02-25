#!/usr/bin/env bash
set -euo pipefail

TAG="${1:-${GITHUB_REF_NAME:-}}"
if [[ -z "${TAG}" ]]; then
  echo "Usage: $0 <tag>" >&2
  exit 1
fi

required_assets=(
  "release-gate-report.txt"
  "rollback-drill-report.txt"
  "release-evidence.tar.gz"
)

release_json="$(gh release view "${TAG}" --json isDraft,assets,url)"

node - "${release_json}" "${required_assets[@]}" <<'NODE'
const release = JSON.parse(process.argv[2]);
const required = process.argv.slice(3);
if (!release.isDraft) {
  console.error(`Release ${release.url ?? ""} is not a draft.`);
  process.exit(1);
}
const names = new Set((release.assets ?? []).map((a) => a.name));
const missing = required.filter((name) => !names.has(name));
if (missing.length > 0) {
  console.error(`Missing release assets: ${missing.join(", ")}`);
  process.exit(1);
}
NODE

gh release edit "${TAG}" --draft=false

echo "Release ${TAG} published after asset verification."
