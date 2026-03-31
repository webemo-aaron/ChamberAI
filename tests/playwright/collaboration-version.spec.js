import { test, expect } from "@playwright/test";
import { API_BASE, bootstrapPage, createMeeting, openMeeting } from "./support/ui_helpers.mjs";

const authHeaders = {
  Authorization: "Bearer demo-token",
  "x-demo-email": "secretary@acme.com",
  "Content-Type": "application/json"
};

async function saveMinutes(page, meetingId, content) {
  await page.locator("#minutesContent").fill(content);
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes(`/meetings/${meetingId}/minutes`) &&
      response.request().method() === "POST" &&
      response.ok()
    ),
    page.locator(".minutes-editor .btn-save").click()
  ]);
}

test.describe("Version History", () => {
  test("latest save is visible after a second editor refreshes the meeting", async ({ page, request }) => {
    const location = `Version Sync Room ${Date.now()}`;
    const meeting = await createMeeting(request, location);
    const pageB = await page.context().newPage();

    await bootstrapPage(page);
    await bootstrapPage(pageB);
    await openMeeting(page, location);
    await openMeeting(pageB, location);

    const content = `Shared draft ${Date.now()}`;
    await saveMinutes(page, meeting.id, content);

    await pageB.goto("about:blank");
    await openMeeting(pageB, location);
    await expect(pageB.locator("#minutesContent")).toHaveValue(content);
    await pageB.close();
  });

  test("stale base_version writes return a conflict from the minutes API", async ({ request }) => {
    const location = `Conflict Room ${Date.now()}`;
    const meeting = await createMeeting(request, location);

    const firstSaveRes = await request.post(`${API_BASE}/meetings/${meeting.id}/minutes`, {
      headers: authHeaders,
      data: {
        text: `Server copy ${Date.now()}`
      }
    });
    expect(firstSaveRes.ok()).toBeTruthy();

    const conflictRes = await request.post(`${API_BASE}/meetings/${meeting.id}/minutes`, {
      headers: authHeaders,
      data: {
        text: `stale update ${Date.now()}`,
        base_version: 0
      }
    });
    expect(conflictRes.status()).toBe(409);
    const conflict = await conflictRes.json();
    expect(conflict.error).toMatch(/Version conflict/i);
    expect(conflict.current_version).toBeGreaterThanOrEqual(1);
    expect(conflict.current_content).toMatch(/Server copy/);
  });

  test("minutes tab renders the latest saved version snapshot", async ({ page, request }) => {
    const location = `Version History Room ${Date.now()}`;
    const meeting = await createMeeting(request, location);

    await bootstrapPage(page);
    await openMeeting(page, location);

    await saveMinutes(page, meeting.id, "v1 baseline minutes");
    await saveMinutes(page, meeting.id, "v2 changed minutes");

    await page.goto("about:blank");
    await openMeeting(page, location);

    const history = page.locator(".version-history");
    await expect(history).toBeVisible();
    await expect(history).toContainText("Version History");
    await expect(history.locator(".history-item")).toHaveCount(1);
    await expect(history.locator(".history-preview").first()).toContainText("v2 changed minutes");
  });

  test("rollback API restores previous version content for the workspace", async ({ page, request }) => {
    const location = `Version Rollback Room ${Date.now()}`;
    const meeting = await createMeeting(request, location);

    await bootstrapPage(page);
    await openMeeting(page, location);

    await saveMinutes(page, meeting.id, "v1 baseline minutes");
    await saveMinutes(page, meeting.id, "v2 changed minutes");

    const versionsRes = await request.get(`${API_BASE}/meetings/${meeting.id}/draft-minutes/versions`, {
      headers: authHeaders
    });
    expect(versionsRes.ok()).toBeTruthy();
    const versions = await versionsRes.json();
    expect(Array.isArray(versions.items)).toBe(true);
    const baselineVersion = versions.items.find((entry) => entry.content === "v1 baseline minutes");
    expect(baselineVersion).toBeTruthy();

    const rollbackRes = await request.post(`${API_BASE}/meetings/${meeting.id}/draft-minutes/rollback`, {
      headers: authHeaders,
      data: { version: baselineVersion.version }
    });
    expect(rollbackRes.ok()).toBeTruthy();

    await page.goto("about:blank");
    await openMeeting(page, location);
    await expect(page.locator("#minutesContent")).toHaveValue("v1 baseline minutes");
  });

  test("version history endpoint paginates after enough saves", async ({ request }) => {
    const location = `Version Paging Room ${Date.now()}`;
    const meeting = await createMeeting(request, location);

    for (let i = 1; i <= 7; i += 1) {
      const saveRes = await request.post(`${API_BASE}/meetings/${meeting.id}/minutes`, {
        headers: authHeaders,
        data: { text: `v${i} minutes` }
      });
      expect(saveRes.ok()).toBeTruthy();
    }

    const firstPageRes = await request.get(
      `${API_BASE}/meetings/${meeting.id}/draft-minutes/versions?limit=5&offset=0`,
      { headers: authHeaders }
    );
    const firstPage = await firstPageRes.json();
    expect(firstPage.items).toHaveLength(5);
    expect(firstPage.has_more).toBe(true);
    expect(firstPage.next_offset).toBe(5);

    const secondPageRes = await request.get(
      `${API_BASE}/meetings/${meeting.id}/draft-minutes/versions?limit=5&offset=5`,
      { headers: authHeaders }
    );
    const secondPage = await secondPageRes.json();
    expect(secondPage.items.length).toBeGreaterThanOrEqual(2);
    expect(secondPage.has_more).toBe(false);
    expect(secondPage.next_offset).toBeNull();
  });
});
