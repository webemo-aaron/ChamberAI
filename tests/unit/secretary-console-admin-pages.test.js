import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(
    new URL(`../../${relativePath}`, import.meta.url),
    "utf8"
  );
}

test("stripe admin page uses ChamberAI billing operations framing", () => {
  const stripeAdmin = read("apps/secretary-console/stripe-admin.html");

  assert.match(stripeAdmin, /ChamberAI Billing Operations/);
  assert.match(stripeAdmin, /Runtime health, Stripe readiness, and organization billing control/);
  assert.match(stripeAdmin, /Open Product Admin/);
  assert.match(stripeAdmin, /localStorage\.getItem\("camApiBase"\)/);
  assert.match(stripeAdmin, /async function fetchAdminJson/);
});

test("products admin page uses ChamberAI catalog operations framing", () => {
  const productsAdmin = read("apps/secretary-console/products-admin.html");

  assert.match(productsAdmin, /ChamberAI Product Operations/);
  assert.match(productsAdmin, /Catalog management, Stripe synchronization, and launch configuration/);
  assert.match(productsAdmin, /Back to Billing Admin/);
  assert.match(productsAdmin, /localStorage\.getItem\("camApiBase"\)/);
  assert.match(productsAdmin, /async function fetchAdminJson/);
});

test("admin-route-handlers exports stripeAdminHandler and productsAdminHandler functions", () => {
  const adminHandlers = read(
    "apps/secretary-console/views/admin/admin-route-handlers.js"
  );

  assert.match(adminHandlers, /export function stripeAdminHandler\(params, context\)/);
  assert.match(adminHandlers, /export function productsAdminHandler\(params, context\)/);
});

test("admin route handlers wire context.onCleanup for cleanup on route change", () => {
  const adminHandlers = read(
    "apps/secretary-console/views/admin/admin-route-handlers.js"
  );

  assert.match(adminHandlers, /context\?\.onCleanup\?\.\(\(\) => \{/);
  const cleanupMatches = adminHandlers.match(/context\?\.onCleanup\?\.\(\(\) => \{/g);
  assert.equal(cleanupMatches.length, 2, "Both admin handlers should wire onCleanup");
});

test("admin-workspace.js imports escapeHtml from common/format.js and has no local definition", () => {
  const adminWorkspace = read(
    "apps/secretary-console/views/admin/admin-workspace.js"
  );

  assert.match(adminWorkspace, /import \{ escapeHtml \} from "\.\.\/\.\.\/common\/format\.js"/);
  assert.doesNotMatch(adminWorkspace, /function escapeHtml\(/);
});

test("app.js no longer has inline admin route closures; uses extracted handlers", () => {
  const appJs = read("apps/secretary-console/app.js");

  assert.match(appJs, /import \{ stripeAdminHandler, productsAdminHandler \} from "\.\/views\/admin\/admin-route-handlers\.js"/);
  assert.match(appJs, /registerRoute\("\/admin\/stripe", stripeAdminHandler\)/);
  assert.match(appJs, /registerRoute\("\/admin\/products", productsAdminHandler\)/);
  assert.doesNotMatch(appJs, /registerRoute\("\/admin\/stripe", \(\) => \{/);
  assert.doesNotMatch(appJs, /renderAdminWorkspace\(utilityView, \{[\s\S]*?eyebrow: "Admin"/);
});
