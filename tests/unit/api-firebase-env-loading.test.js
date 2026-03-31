import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

test("api server bootstraps env through the dedicated loader", () => {
  const source = read("services/api-firebase/src/server.js");

  assert.match(source, /import "\.\/load-env\.js";/);
  assert.doesNotMatch(source, /import "dotenv\/config";/);
});

test("api env loader prefers service-local env and supports repo-root fallback", () => {
  const source = read("services/api-firebase/src/load-env.js");

  assert.match(source, /serviceEnvPath = path\.resolve\(serviceRoot, "\.env"\)/);
  assert.match(source, /repoRootEnvPath = path\.resolve\(serviceRoot, "\.\.", "\.\.", "\.env"\)/);
  assert.match(source, /rootFallbackKeys = new Set\(/);
  assert.match(source, /GEMINI_API_KEY/);
  assert.match(source, /override:\s*false/);
});

test("api env examples document Gemini-first configuration", () => {
  const example = read("services/api-firebase/.env.example");

  assert.match(example, /GEMINI_API_KEY=/);
  assert.match(example, /GOOGLE_GENERATIVE_AI_API_KEY=/);
  assert.match(example, /AI_TEXT_MODEL=gemini-2\.5-flash/);
});
