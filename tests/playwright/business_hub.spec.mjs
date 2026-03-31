// @critical - Business Hub release gate tests aligned to the current workspace UI
import { test, expect } from "@playwright/test";
import { bootstrapPage, UI_BASE } from "./support/ui_helpers.mjs";

async function openBusinessHub(page) {
  await page.goto(`${UI_BASE}/#/business-hub`);
  await expect(page.locator("#businessHubView")).toBeVisible();
  await expect(page.locator("#businessListPane")).toBeVisible();
  await expect(page.locator("#businessDetailPane")).toBeVisible();
}

test.describe("Business Hub @critical", () => {
  test.beforeEach(async ({ page }) => {
    await bootstrapPage(page);
  });

  test("loads the business hub workspace route", async ({ page }) => {
    await openBusinessHub(page);
    await expect(page.locator("#businessListPane")).toContainText("Business Hub");
    await expect(page.locator("#businessDetailPane")).toContainText("Select a business");
    await expect(page.locator("#businessDetailPane")).toContainText("All Showcase Cities");
  });

  test("filters seeded businesses by search term", async ({ page }) => {
    await openBusinessHub(page);

    const businessList = page.locator(".business-list");
    await expect(businessList).toContainText("Harbor Light Hospitality");
    await expect(businessList).toContainText("Bangor Regional Advisors");

    await page.locator("#bizSearch").fill("Harbor");

    await expect(businessList).toContainText("Harbor Light Hospitality");
    await expect(businessList).not.toContainText("Bangor Regional Advisors");
  });

  test("loads a seeded business detail workspace and switches tabs", async ({ page }) => {
    await openBusinessHub(page);

    await page.locator(".business-list-item", { hasText: "Harbor Light Hospitality" }).click();

    await expect(page.locator(".business-name")).toContainText("Harbor Light Hospitality");
    await expect(page.locator(".business-tab-bar .tab.active")).toContainText("Profile");
    await expect(page.locator("#tab-profile")).toBeVisible();

    await page.locator('.business-tab-bar .tab[data-tab="geographic"]').click();
    await expect(page.locator('.business-tab-bar .tab[data-tab="geographic"]')).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#tab-geographic")).toBeVisible();

    await page.locator('.business-tab-bar .tab[data-tab="reviews"]').click();
    await expect(page.locator("#tab-reviews")).toBeVisible();

    await page.locator('.business-tab-bar .tab[data-tab="quotes"]').click();
    await expect(page.locator("#tab-quotes")).toBeVisible();

    await page.locator('.business-tab-bar .tab[data-tab="ai-search"]').click();
    await expect(page.locator("#tab-ai-search")).toBeVisible();
  });

  test("admin can edit and save a seeded business profile", async ({ page }) => {
    await openBusinessHub(page);

    await page.locator(".business-list-item", { hasText: "Harbor Light Hospitality" }).click();
    await page.locator("#editBtn").click();

    const description = page.locator("#businessDescription");
    await description.fill("Updated from Playwright critical release gate.");

    await page.locator("#saveProfileBtn").click();

    await expect(page.locator(".profile-description")).toContainText("Updated from Playwright critical release gate.");
  });

  test("geo intelligence shortcut routes from a business into geo intelligence", async ({ page }) => {
    await openBusinessHub(page);

    await page.locator(".business-list-item", { hasText: "Harbor Light Hospitality" }).click();
    await page.locator("#bizGeoBtn").click();

    await expect(page).toHaveURL(/#\/geo-intelligence$/);
    await expect(page.locator("#utilityView")).toBeVisible();
  });
});
