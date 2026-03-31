import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  getDefaultRouteForRole,
  getNavigationSections,
  getMobileNavigationItems,
  getWorkspaceLanes
} from "../../apps/secretary-console/components/sidebar-config.js";

function read(relativePath) {
  return readFileSync(
    new URL(`../../${relativePath}`, import.meta.url),
    "utf8"
  );
}

test("semantic navigation groups Overview, Operations & Growth, Admin, and Account", () => {
  const sections = getNavigationSections({ role: "admin", tier: "Council" });

  assert.deepEqual(
    sections.map((section) => section.id),
    ["intelligence", "operations", "admin", "account"]
  );

  assert.deepEqual(
    sections[0].items.map((item) => item.id),
    ["dashboard", "business-hub", "geo-intelligence", "kiosk"]
  );

  assert.deepEqual(
    sections[1].items.map((item) => item.id),
    ["meetings", "engagement", "campaigns", "settings", "analytics", "billing"]
  );

  assert.deepEqual(
    sections[2].items.map((item) => item.id),
    ["stripe-admin", "products-admin"]
  );
  assert.equal(
    sections[2].items.find((item) => item.id === "stripe-admin")?.route,
    "/admin/stripe"
  );
  assert.equal(
    sections[2].items.find((item) => item.id === "products-admin")?.route,
    "/admin/products"
  );

  assert.deepEqual(
    sections[3].items.map((item) => item.id),
    ["profile", "preferences", "logout"]
  );

  assert.equal(
    sections[0].description,
    "Business visibility, relationship health, and local market signals."
  );
  assert.equal(
    sections[0].items.find((item) => item.id === "kiosk")?.badge,
    "Council+"
  );
});

test("non-admin roles do not receive admin section and free tier hides kiosk", () => {
  const sections = getNavigationSections({ role: "secretary", tier: "Free" });

  assert.equal(sections.some((section) => section.id === "admin"), false);

  const intelligenceSection = sections.find(
    (section) => section.id === "intelligence"
  );
  assert.ok(intelligenceSection);
  assert.equal(
    intelligenceSection.items.some((item) => item.id === "kiosk"),
    false
  );
});

test("mobile navigation is limited to primary destinations", () => {
  const items = getMobileNavigationItems({ role: "admin", tier: "Council" });

  assert.deepEqual(
    items.map((item) => item.id),
    ["dashboard", "business-hub", "meetings", "engagement", "analytics"]
  );
});

test("workspace lanes mirror visible operational sections", () => {
  const adminLanes = getWorkspaceLanes({ role: "admin", tier: "Council" });
  const guestLanes = getWorkspaceLanes({ role: "guest", tier: "Free" });

  assert.deepEqual(
    adminLanes.map((lane) => lane.id),
    ["intelligence", "operations", "admin"]
  );
  assert.deepEqual(
    guestLanes.map((lane) => lane.id),
    ["intelligence", "operations"]
  );
});

test("default authenticated landing route is dashboard", () => {
  assert.equal(getDefaultRouteForRole("guest"), "/dashboard");
  assert.equal(getDefaultRouteForRole("admin"), "/dashboard");
});

test("saved landing preference overrides default route when valid", () => {
  const originalLocalStorage = globalThis.localStorage;
  globalThis.localStorage = {
    getItem(key) {
      return key === "camPreferenceLanding" ? "/meetings" : null;
    }
  };

  assert.equal(getDefaultRouteForRole("admin"), "/meetings");

  globalThis.localStorage = {
    getItem() {
      return "/not-real";
    }
  };

  assert.equal(getDefaultRouteForRole("admin"), "/dashboard");
  globalThis.localStorage = originalLocalStorage;
});

test("showcase-city-context dispatches chamberai:city-changed on window", () => {
  const contextJs = read("apps/secretary-console/views/common/showcase-city-context.js");

  assert.match(contextJs, /window\.dispatchEvent.*chamberai:city-changed/s);
});

test("showcase-city-context includes city in event detail", () => {
  const contextJs = read("apps/secretary-console/views/common/showcase-city-context.js");

  assert.match(contextJs, /detail.*city.*selected/s);
});

test("sidebar.js subscribes to chamberai:city-changed and calls updateCityPill", () => {
  const sidebarJs = read("apps/secretary-console/components/sidebar.js");

  assert.match(sidebarJs, /chamberai:city-changed/);
  assert.match(sidebarJs, /updateCityPill/);
  assert.match(sidebarJs, /function updateCityPill/);
});

test("legacy login modal uses distinct field ids from routed login screen", () => {
  const shellHtml = read("apps/secretary-console/index.html");
  const routedLoginJs = read("apps/secretary-console/views/login/login.js");

  assert.match(shellHtml, /modalLoginEmail/);
  assert.match(shellHtml, /modalLoginRole/);
  assert.match(shellHtml, /modalLoginSubmit/);
  assert.match(shellHtml, /modalLoginGoogle/);

  assert.doesNotMatch(shellHtml, /id="loginEmail"/);
  assert.doesNotMatch(shellHtml, /id="loginRole"/);
  assert.doesNotMatch(shellHtml, /id="loginSubmit"/);
  assert.doesNotMatch(shellHtml, /id="loginGoogle"/);

  assert.match(routedLoginJs, /emailInput\.id = "loginEmail"/);
  assert.match(routedLoginJs, /roleSelect\.id = "loginRole"/);
  assert.match(routedLoginJs, /submitBtn\.id = "loginSubmit"/);
  assert.match(routedLoginJs, /googleBtn\.id = "loginGoogle"/);
});
