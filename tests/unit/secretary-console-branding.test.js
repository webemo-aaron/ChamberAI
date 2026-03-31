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

  assert.match(indexHtml, /<title>ChamberAI - Operations Workspace<\/title>/);
  assert.match(indexHtml, />ChamberAI<\/div>/);
  assert.match(indexHtml, />AI platform for local business visibility and engagement<\/div>/);
  assert.match(indexHtml, />Runtime Connection<\/h3>/);
  assert.match(indexHtml, /Point the workspace to your active ChamberAI API environment\./);
  assert.match(indexHtml, /fonts\.googleapis\.com/);
  assert.match(indexHtml, /Fraunces/);
  assert.match(indexHtml, /Manrope/);
  assert.match(loginJs, /title\.textContent = "Enter ChamberAI"/);
  assert.match(
    loginJs,
    /subtitle\.textContent =\s*"Sign in to run business visibility, relationship outreach, customer communication, and chamber governance in one place\.";/
  );
  assert.match(
    loginJs,
    /eyebrow\.textContent = "Workspace Access"/
  );
  assert.match(
    loginJs,
    /demoNote\.textContent = "Demo access is intended for local validation, responsive QA, and workflow review\."/
  );
  assert.match(loginJs, /prefers-color-scheme: dark/);
  assert.match(loginJs, /data-login-theme/);
});

test("navigation titles stay user-facing and route-specific", () => {
  assert.equal(getNavigationTitle("/dashboard"), "Overview");
  assert.equal(getNavigationTitle("/analytics"), "Growth Analytics");
  assert.equal(getNavigationTitle("/business-hub/123"), "Business Hub");
  assert.equal(getNavigationTitle("/admin/stripe"), "Stripe Admin");
  assert.equal(getNavigationTitle("/admin/products"), "Products Admin");
});
