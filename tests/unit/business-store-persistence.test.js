import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { createInMemoryDb } from "../../services/api/in_memory_db.js";
import { createBusinessListing, listBusinessListings, listBusinessVersions } from "../../services/api/business_listings.js";

const tempPaths = [];

afterEach(() => {
  while (tempPaths.length > 0) {
    const target = tempPaths.pop();
    fs.rmSync(target, { recursive: true, force: true });
  }
});

test("business store persists imported listings across db reinitialization", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "chamberai-business-store-"));
  const storePath = path.join(tempDir, "business-store.json");
  tempPaths.push(tempDir);

  const firstDb = createInMemoryDb({ businessStorePath: storePath });
  createBusinessListing(firstDb, {
    id: "biz_persist_1",
    name: "Persistent Showcase Business",
    city: "Portland",
    state: "ME",
    geo_scope_type: "city",
    geo_scope_id: "Portland"
  });

  const secondDb = createInMemoryDb({ businessStorePath: storePath });
  const businesses = listBusinessListings(secondDb);

  assert.ok(businesses.some((business) => business.id === "biz_persist_1"));
  assert.equal(listBusinessVersions(secondDb, "biz_persist_1").length, 1);
  assert.ok(fs.existsSync(storePath));
});
