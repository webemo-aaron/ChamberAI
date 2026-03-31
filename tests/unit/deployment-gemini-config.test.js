import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

test("gcp vercel env example includes Gemini AI runtime settings", () => {
  const source = read(".env.gcp.vercel.example");

  assert.match(source, /AI_GENERATION_ENABLED=/);
  assert.match(source, /AI_TEXT_MODEL=gemini-2\.5-flash/);
  assert.match(source, /GEMINI_API_KEY=/);
  assert.match(source, /GOOGLE_GENERATIVE_AI_API_KEY=/);
});

test("gcp deployment script forwards Gemini AI runtime settings to Cloud Run", () => {
  const source = read("scripts/deploy_gcp_vercel_low_cost.sh");

  assert.match(source, /AI_GENERATION_ENABLED="\$\{AI_GENERATION_ENABLED:-false\}"/);
  assert.match(source, /AI_TEXT_MODEL="\$\{AI_TEXT_MODEL:-gemini-2\.5-flash\}"/);
  assert.match(source, /GEMINI_API_KEY="\$\{GEMINI_API_KEY:-\}"/);
  assert.match(source, /GOOGLE_GENERATIVE_AI_API_KEY="\$\{GOOGLE_GENERATIVE_AI_API_KEY:-\}"/);
  assert.match(source, /AI_GENERATION_ENABLED=\$\{AI_GENERATION_ENABLED\}/);
  assert.match(source, /AI_TEXT_MODEL=\$\{AI_TEXT_MODEL\}/);
  assert.match(source, /GEMINI_API_KEY=\$\{GEMINI_API_KEY\}/);
});

test("gcp deployment script rejects placeholder deploy values before rollout", () => {
  const source = read("scripts/deploy_gcp_vercel_low_cost.sh");

  assert.match(source, /\[\[ "\$\{value\}" =~ \^\[A-Z0-9_\]\+=\$ \]\]/);
  assert.match(source, /require_real_value "PROJECT_ID" "\$\{PROJECT_ID\}"/);
  assert.match(source, /require_real_value "GCS_BUCKET_NAME" "\$\{GCS_BUCKET_NAME\}"/);
  assert.match(source, /require_real_value "VERCEL_FRONTEND_URL" "\$\{VERCEL_FRONTEND_URL\}"/);
  assert.match(source, /your-gcp-project-id/);
  assert.match(source, /your-audio-bucket/);
  assert.match(source, /your-app\.vercel\.app/);
});
