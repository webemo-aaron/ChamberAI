import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(
    new URL(`../../${relativePath}`, import.meta.url),
    "utf8"
  );
}

test("firestore rules enforce org isolation", () => {
  const rules = read("firestore.rules");

  // Verify org isolation helper function
  assert.match(rules, /function userInOrg/);
  assert.match(rules, /request\.auth\.token\.orgId == orgId/);

  // Verify organization documents require auth and org match
  assert.match(rules, /match \/organizations\/\{orgId\}/);
  assert.match(rules, /allow read, write: if userInOrg/);

  // Verify subcollections also require org isolation
  assert.match(rules, /match \/organizations\/\{orgId\}\/\{subcollection\}/);

  // Verify subdomains are public read-only
  assert.match(rules, /match \/subdomains\/\{slug\}/);
  assert.match(rules, /allow read: if true/);
  assert.match(rules, /allow write: if false/);

  // Verify default deny
  assert.match(rules, /match \/\{document=\*\*\}/);
  assert.match(rules, /allow read, write: if false/);
});

test("auth middleware exports enforceOrgIsolation", () => {
  const authJs = read("services/api-firebase/src/middleware/auth.js");

  // Verify function exists
  assert.match(authJs, /export function enforceOrgIsolation/);

  // Verify it checks request org against user's org
  assert.match(authJs, /req\.params\.orgId/);
  assert.match(authJs, /req\.query\.orgId/);
  assert.match(authJs, /req\.orgId/);

  // Verify it returns 403 for cross-org access
  assert.match(authJs, /403[\s\S]*Not authorized/);
});

test("export endpoint provides user data export", () => {
  const exportJs = read("services/api-firebase/src/routes/export.js");

  // Verify user data export endpoint
  assert.match(exportJs, /\/api\/export\/user-data/);

  // Verify it fetches user's data
  assert.match(exportJs, /where/);
  assert.match(exportJs, /meetings/);
  assert.match(exportJs, /actionItems/);

  // Verify audit logging
  assert.match(exportJs, /user_data_exported/);
});

test("export endpoint provides org data export", () => {
  const exportJs = read("services/api-firebase/src/routes/export.js");

  // Verify org data export endpoint
  assert.match(exportJs, /\/api\/export\/org-data/);

  // Verify it requires admin role
  assert.match(exportJs, /requireRole\("admin"\)/);

  // Verify it fetches full org data
  assert.match(exportJs, /memberships/);
  assert.match(exportJs, /motions/);
  assert.match(exportJs, /audit_logs/);

  // Verify audit logging
  assert.match(exportJs, /org_data_exported/);
});

test("server registers export route", () => {
  const serverJs = read("services/api-firebase/src/server.js");

  // Verify export route is imported
  assert.match(serverJs, /import.*export.*routes\/export/);

  // Verify export route is registered
  assert.match(serverJs, /app\.use\(exportData\)/);
});

test("auth middleware has resolvePublicOrg for kiosk isolation", () => {
  const authJs = read("services/api-firebase/src/middleware/auth.js");

  // Verify it resolves org from subdomain
  assert.match(authJs, /export async function resolvePublicOrg/);

  // Verify it reads host header
  assert.match(authJs, /x-forwarded-host.*host/);

  // Verify it looks up in subdomains collection
  assert.match(authJs, /subdomains.*slug/);
});

test("export routes include download headers for GDPR compliance", () => {
  const exportJs = read("services/api-firebase/src/routes/export.js");

  // Verify Content-Type is set to JSON
  assert.match(exportJs, /Content-Type/);
  assert.match(exportJs, /application\/json/);

  // Verify Content-Disposition is set for download
  assert.match(exportJs, /Content-Disposition/);
  assert.match(exportJs, /attachment/);
  assert.match(exportJs, /filename/);

  // Verify filename includes data and timestamp
  assert.match(exportJs, /user-data/);
  assert.match(exportJs, /org-data/);
  assert.match(exportJs, /Date\.now/);
});

test("firestore rules deny all by default", () => {
  const rules = read("firestore.rules");

  // Verify catch-all deny rule exists
  assert.match(rules, /match \/\{document=\*\*\}/);
  assert.match(rules, /allow read, write: if false/);

  // Verify it's the last rule (order matters)
  const lastRule = rules.split("match")[rules.split("match").length - 1];
  assert.match(lastRule, /allow read, write: if false/);
});
