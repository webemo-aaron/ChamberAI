#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const routesPath = path.resolve(root, "docs/link-index/routes.json");
const navigationPath = path.resolve(root, "docs/link-index/navigation.json");
const outputPath = path.resolve(root, "artifacts/link-validation-ui.json");

const routesDoc = JSON.parse(fs.readFileSync(routesPath, "utf8"));
const navigationDoc = JSON.parse(fs.readFileSync(navigationPath, "utf8"));
const canonicalRoutes = (routesDoc.routes || []).map((route) => route.path);

const registerRouteFile = path.resolve(root, "apps/secretary-console/app.js");
const appFileText = fs.readFileSync(registerRouteFile, "utf8");
const registeredRoutes = [...appFileText.matchAll(/registerRoute\(\s*["'`]([^"'`]+)["'`]/g)].map(
  (match) => match[1]
);

const sourceFiles = listFiles(path.resolve(root, "apps/secretary-console"), [".js", ".html"])
  .filter((file) => !file.includes("/design-system/"));
const extractedReferences = sourceFiles.flatMap((file) => extractRouteReferences(file));

const invalidReferences = extractedReferences.filter(
  (entry) => entry.type === "internal" && !matchesCanonical(entry.value, canonicalRoutes)
);
const missingFromIndex = registeredRoutes.filter((route) => !canonicalRoutes.includes(route));
const extraInIndex = canonicalRoutes.filter((route) => !registeredRoutes.includes(route));
const invalidNavigationEntries = (navigationDoc.links || []).filter(
  (entry) => !matchesCanonical(entry.expected_route, canonicalRoutes)
);

const summary = {
  canonical_route_count: canonicalRoutes.length,
  app_registered_route_count: registeredRoutes.length,
  extracted_internal_reference_count: extractedReferences.filter((entry) => entry.type === "internal").length,
  extracted_external_reference_count: extractedReferences.filter((entry) => entry.type === "external").length,
  invalid_internal_references: invalidReferences.length,
  missing_routes_in_index: missingFromIndex.length,
  extra_routes_in_index: extraInIndex.length,
  invalid_navigation_entries: invalidNavigationEntries.length
};

const report = {
  generated_at: new Date().toISOString(),
  summary,
  details: {
    missing_routes_in_index: missingFromIndex,
    extra_routes_in_index: extraInIndex,
    invalid_navigation_entries: invalidNavigationEntries,
    invalid_internal_references: invalidReferences
  }
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

if (
  invalidReferences.length > 0 ||
  missingFromIndex.length > 0 ||
  extraInIndex.length > 0 ||
  invalidNavigationEntries.length > 0
) {
  process.exit(1);
}

function listFiles(dir, extensions) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath, extensions));
      continue;
    }
    if (entry.isFile() && extensions.some((extension) => entry.name.endsWith(extension))) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractRouteReferences(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const patterns = [
    { regex: /registerRoute\(\s*["'`](\/[^"'`$]+)["'`]/g, type: "internal" },
    { regex: /navigate\(\s*["'`](\/[^"'`$]+)["'`]/g, type: "internal" },
    { regex: /route:\s*["'`](\/[^"'`$]+)["'`]/g, type: "internal" },
    { regex: /href="#(\/[^"'`$]+)"/g, type: "internal" },
    { regex: /data-route="(\/[^"]+)"/g, type: "internal" },
    { regex: /href="(\.\/[^"]+\.html)"/g, type: "external" }
  ];

  const out = [];
  for (const { regex, type } of patterns) {
    for (const match of text.matchAll(regex)) {
      out.push({
        file: path.relative(root, filePath),
        type,
        value: match[1]
      });
    }
  }
  return dedupe(out);
}

function dedupe(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = `${entry.file}:${entry.type}:${entry.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function matchesCanonical(routeValue, canonicalPatterns) {
  if (!routeValue || typeof routeValue !== "string") return false;
  if (canonicalPatterns.includes(routeValue)) return true;

  for (const pattern of canonicalPatterns) {
    if (!pattern.includes(":")) continue;
    const compiled = new RegExp(
      `^${pattern
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, "[^/]+")}$`
    );
    if (compiled.test(routeValue)) return true;
  }
  return false;
}
