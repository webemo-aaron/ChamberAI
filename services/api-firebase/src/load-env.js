import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceRoot = path.resolve(__dirname, "..");
const serviceEnvPath = path.resolve(serviceRoot, ".env");
const repoRootEnvPath = path.resolve(serviceRoot, "..", "..", ".env");
const rootFallbackKeys = new Set([
  "AI_GENERATION_ENABLED",
  "AI_TEXT_MODEL",
  "GEMINI_API_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "AI_GATEWAY_API_KEY"
]);

loadServiceEnv();
loadRepoRootAiFallback();

function loadServiceEnv() {
  dotenv.config({
    path: serviceEnvPath,
    override: false
  });
}

function loadRepoRootAiFallback() {
  if (!fs.existsSync(repoRootEnvPath)) {
    return;
  }

  const parsed = dotenv.parse(fs.readFileSync(repoRootEnvPath, "utf8"));
  for (const key of rootFallbackKeys) {
    if (hasValue(process.env[key])) {
      continue;
    }

    if (hasValue(parsed[key])) {
      process.env[key] = parsed[key];
    }
  }
}

function hasValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}
