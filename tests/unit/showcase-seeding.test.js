import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

test("showcase city manifest includes the requested Maine cities and first-wave defaults", () => {
  const manifest = JSON.parse(read("data/showcase/cities.json"));
  const cityNames = manifest.cities.map((city) => city.name);

  assert.deepEqual(cityNames, [
    "Portland, ME",
    "Augusta, ME",
    "Bangor, ME",
    "Bethel, ME",
    "Kingfield, ME",
    "Carrabassett Valley, ME",
    "York, ME",
    "Scarborough, ME"
  ]);

  assert.deepEqual(manifest.first_wave, [
    "Portland, ME",
    "Bangor, ME",
    "Augusta, ME",
    "Scarborough, ME"
  ]);
});

test("showcase seeder defaults to first-wave cities and seeds meetings plus geo intelligence", () => {
  const seederJs = read("scripts/seed_showcase_data.js");
  const packageJson = JSON.parse(read("package.json"));

  assert.match(seederJs, /data\/showcase\/cities\.json/);
  assert.match(seederJs, /manifest\.first_wave/);
  assert.match(seederJs, /\/meetings/);
  assert.match(seederJs, /\/geo-profiles\/scan/);
  assert.match(seederJs, /\/geo-content-briefs\/generate/);
  assert.match(seederJs, /SHOWCASE_NAMESPACE|showcase-/);
  assert.equal(packageJson.scripts["seed:showcase"], "node scripts/seed_showcase_data.js");
  assert.equal(packageJson.scripts["seed:showcase:all"], "SHOWCASE_WAVE=all node scripts/seed_showcase_data.js");
});

test("showcase source map captures chamber-led sourcing for all target cities", () => {
  const sourceMap = JSON.parse(read("data/showcase/source-map.json"));
  const cityNames = sourceMap.cities.map((city) => city.name);

  assert.deepEqual(cityNames, [
    "Portland, ME",
    "Augusta, ME",
    "Bangor, ME",
    "Bethel, ME",
    "Kingfield, ME",
    "Carrabassett Valley, ME",
    "York, ME",
    "Scarborough, ME"
  ]);

  assert.equal(sourceMap.strategy.priority_order[0], "official_chamber_directory");
  assert.ok(sourceMap.cities.every((city) => Array.isArray(city.primary_sources) && city.primary_sources.length > 0));
});

test("showcase importer script supports raw capture imports into the local business hub API", () => {
  const importerJs = read("scripts/import_showcase_businesses.js");

  assert.match(importerJs, /normalizeShowcaseBusinessRecord/);
  assert.match(importerJs, /\/business-listings/);
  assert.match(importerJs, /data\/showcase\/raw/);
  assert.match(importerJs, /sync_run_id/);
  assert.match(importerJs, /iteration/);
});
