#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeShowcaseBusinessRecord } from "./lib/showcase-business-normalizer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputPath = process.argv[2];
const namespace = process.env.SHOWCASE_NAMESPACE ?? "showcase-import";

if (!inputPath) {
  console.error("Usage: node scripts/normalize_showcase_businesses.js <raw-json-path>");
  process.exit(1);
}

const absoluteInput = path.resolve(process.cwd(), inputPath);
const raw = JSON.parse(fs.readFileSync(absoluteInput, "utf8"));
const cityName = String(raw.city ?? "").trim();
const [scopeId, state = "ME"] = cityName.split(",").map((part) => part.trim());
const scopeType = ["Bethel", "Kingfield", "Carrabassett Valley", "York", "Scarborough"].includes(scopeId)
  ? "town"
  : "city";

const normalized = raw.records.map((record) =>
  normalizeShowcaseBusinessRecord(record, {
    cityName,
    scopeType,
    scopeId,
    namespace
  })
);

const output = {
  city: cityName,
  namespace,
  source_label: raw.source_label,
  source_url: raw.source_url,
  businesses: normalized
};

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
