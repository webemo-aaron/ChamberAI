import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const navigationIndex = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), "docs/link-index/navigation.json"), "utf8")
);
const routeIndex = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), "docs/link-index/routes.json"), "utf8")
);

const baseUrl = process.env.LINK_TEST_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:5173";

test.describe("Navigation Link Validation", () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithRetry(page, `${baseUrl}/#/`);
    await page.evaluate(() => {
      localStorage.setItem("camRole", "admin");
      localStorage.setItem("camEmail", "automation-link-check@mahoosuc.ai");
      localStorage.setItem("camDisplayName", "Link Validator");
      localStorage.setItem("camUserTier", "Council");
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await gotoWithRetry(page, `${baseUrl}/#/dashboard`);
    await expect(page.locator("[data-testid='sidebar-link-dashboard']")).toBeVisible({ timeout: 15000 });
  });

  test("sidebar links navigate to expected routes", async ({ page }) => {
    for (const link of navigationIndex.links || []) {
      await gotoWithRetry(page, `${baseUrl}/#/dashboard`);
      const target = page.locator(link.selector).first();
      await expect(target).toBeVisible();
      await target.click();

      await expect
        .poll(() => getCurrentHashPath(page.url()), { timeout: 10000 })
        .toBe(link.expected_route);
    }
  });

  test("canonical routes resolve without redirect regressions", async ({ page }) => {
    const routes = (routeIndex.routes || [])
      .map((route) => route.path)
      .filter((route) => !route.includes(":"));

    for (const route of routes) {
      await gotoWithRetry(page, `${baseUrl}/#${route}`);
      if (route === "/") {
        await expect
          .poll(() => getCurrentHashPath(page.url()), { timeout: 10000 })
          .toBe("/dashboard");
        continue;
      }

      await expect
        .poll(() => getCurrentHashPath(page.url()), { timeout: 10000 })
        .toBe(route);
      if (route !== "/login") {
        expect(getCurrentHashPath(page.url())).not.toBe("/login");
      }
    }
  });
});

function getCurrentHashPath(url) {
  const hash = new URL(url).hash.replace(/^#/, "");
  const [path] = hash.split("?");
  return path || "/";
}

async function gotoWithRetry(page, url, attempts = 3) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(500);
    }
  }
  throw lastError;
}
