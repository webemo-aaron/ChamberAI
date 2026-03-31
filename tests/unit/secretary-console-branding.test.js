import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getNavigationTitle } from "../../apps/secretary-console/components/sidebar-config.js";

function read(relativePath) {
  return readFileSync(
    new URL(`../../${relativePath}`, import.meta.url),
    "utf8"
  );
}

test("topbar and login copy use ChamberAI branding language", () => {
  const indexHtml = read("apps/secretary-console/index.html");
  const loginJs = read("apps/secretary-console/views/login/login.js");

  assert.match(indexHtml, />ChamberAI<\/div>/);
  assert.match(indexHtml, />Operational intelligence for chamber teams<\/div>/);
  assert.match(indexHtml, />Connection Control<\/h3>/);
  assert.match(indexHtml, /Point the console at your active ChamberAI API environment\./);
  assert.match(loginJs, /title\.textContent = "Enter ChamberAI"/);
  assert.match(
    loginJs,
    /subtitle\.textContent =\s*"Sign in to the control center for chamber teams, board workflows, and governed AI operations\.";/
  );
  assert.match(
    loginJs,
    /eyebrow\.textContent = "Workspace Access"/
  );
  assert.match(
    loginJs,
    /demoNote\.textContent = "Demo access is intended for local validation, responsive QA, and workflow review\."/
  );
});

test("navigation titles stay user-facing and route-specific", () => {
  assert.equal(getNavigationTitle("/dashboard"), "Dashboard");
  assert.equal(getNavigationTitle("/analytics"), "Analytics");
  assert.equal(getNavigationTitle("/business-hub/123"), "Business Hub");
  assert.equal(getNavigationTitle("/admin/stripe"), "Stripe Admin");
  assert.equal(getNavigationTitle("/admin/products"), "Products Admin");
});
