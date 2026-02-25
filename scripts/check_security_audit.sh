#!/usr/bin/env bash
set -euo pipefail

mkdir -p artifacts/security

RAW_FILE="artifacts/security/npm-audit.json"
SUMMARY_FILE="artifacts/security/npm-audit-summary.json"

if npm audit --audit-level=high --json >"${RAW_FILE}"; then
  :
else
  # npm audit exits non-zero when vulnerabilities are found; parse summary and fail explicitly below.
  :
fi

node -e '
const fs = require("fs");
const rawPath = process.argv[1];
const summaryPath = process.argv[2];
const report = JSON.parse(fs.readFileSync(rawPath, "utf8"));
const vulnerabilities = report.metadata?.vulnerabilities ?? {};
const summary = {
  total: (vulnerabilities.info ?? 0) + (vulnerabilities.low ?? 0) + (vulnerabilities.moderate ?? 0) + (vulnerabilities.high ?? 0) + (vulnerabilities.critical ?? 0),
  info: vulnerabilities.info ?? 0,
  low: vulnerabilities.low ?? 0,
  moderate: vulnerabilities.moderate ?? 0,
  high: vulnerabilities.high ?? 0,
  critical: vulnerabilities.critical ?? 0,
  dependencies: report.metadata?.dependencies ?? {}
};
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + "\n");
console.log(JSON.stringify(summary, null, 2));
if (summary.high > 0 || summary.critical > 0) {
  process.exit(1);
}
' "${RAW_FILE}" "${SUMMARY_FILE}"

echo "Security audit gate passed."
