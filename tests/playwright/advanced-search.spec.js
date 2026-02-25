import { test, expect } from "@playwright/test";
import { API_BASE, bootstrapPage, createMeeting } from "./support/ui_helpers.mjs";

test.describe("Advanced Search", () => {
  test("advanced search returns full-text results", async ({ page, request }) => {
    const token = Date.now();
    const phrase = `neon-token-${token}`;
    const location = `Search Room ${token}`;
    const meeting = await createMeeting(request, location);
    await request.put(`${API_BASE}/meetings/${meeting.id}/draft-minutes`, {
      headers: {
        Authorization: "Bearer demo-token",
        "x-demo-email": "admin@acme.com",
        "Content-Type": "application/json"
      },
      data: {
        content: `Board discussed ${phrase} strategy.`
      }
    });

    await bootstrapPage(page);
    await page.locator('[data-testid="advanced-search-query"]').fill(phrase);
    await page.locator('[data-testid="advanced-search-run"]').click();
    await expect(page.locator(".meeting-card", { hasText: location }).first()).toBeVisible();
  });
});
