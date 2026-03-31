import { test, expect } from "@playwright/test";
import { bootstrapPage, createMeeting, openMeeting } from "./support/ui_helpers.mjs";
import { attachConsoleGuard } from "./support/console_guard.mjs";

test("action items CSV import/export @critical", async ({ page, request }) => {
  const location = `CSV Hall ${Date.now()}`;
  await createMeeting(request, location, {
    date: "2026-01-23",
    start_time: "18:00",
    tags: "csv"
  });

  const guard = attachConsoleGuard(page);

  await bootstrapPage(page);
  await openMeeting(page, location);
  await page.locator(".detail-tab-bar [data-tab='actions']").click();
  await page.waitForFunction(() => {
    const panel = document.querySelector("#actions-panel");
    return panel?.getAttribute("data-loaded") === "true" && panel?.getAttribute("aria-hidden") === "false";
  });
  const actionsPanel = page.locator("#actions-panel");
  await expect(actionsPanel.locator(".btn-import-csv")).toBeVisible();

  const csv = [
    "description,owner_name,due_date,status",
    "Follow up with vendor,Taylor Treasurer,2026-02-10,OPEN",
    "Send member update,Riley Secretary,2026-02-12,OPEN"
  ].join("\n");

  const fileChooserPromise = page.waitForEvent("filechooser");
  await actionsPanel.locator(".btn-import-csv").click();
  const fileChooser = await fileChooserPromise;

  const importResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().includes("/actions/import-csv") &&
      response.status() === 200,
    { timeout: 15000 }
  );

  await fileChooser.setFiles({
    name: "action-items.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv)
  });

  await importResponse;

  const actionsTable = actionsPanel.locator(".actions-table");
  await expect(actionsTable).toContainText("Follow up with vendor");
  await expect(actionsTable).toContainText("Send member update");
  await expect(actionsTable).toContainText("Taylor Treasurer");
  await expect(actionsTable).toContainText("Riley Secretary");

  const downloadPromise = page.waitForEvent("download");
  await actionsPanel.locator(".btn-export-csv").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("action-items.csv");
  await guard.assertNoUnexpected();
});
