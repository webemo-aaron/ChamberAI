import { test, expect } from "@playwright/test";
import { UI_BASE, bootstrapPage, createMeeting } from "./support/ui_helpers.mjs";

test.describe("Meetings Search", () => {
  test("meetings search filters created meetings by location", async ({ page, request }) => {
    const token = Date.now();
    const location = `Search Room ${token}`;
    await createMeeting(request, location);

    await bootstrapPage(page);
    await page.goto(`${UI_BASE}/#/meetings`);
    await page.locator("#refreshBtn").waitFor({ state: "visible", timeout: 5000 });

    const meetingList = page.locator(".meeting-list");
    await expect(meetingList).toContainText(location);

    await page.locator("#meetingSearch").fill(String(token));
    await expect(page.locator(".meeting-item", { hasText: location }).first()).toBeVisible();
  });
});
