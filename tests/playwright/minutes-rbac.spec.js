import { test, expect } from "@playwright/test";
import { API_BASE } from "./utils.mjs";

test.describe("Minutes RBAC", () => {
  test("guest cannot update or rollback draft minutes", async ({ request }) => {
    const location = `RBAC Room ${Date.now()}`;
    const createRes = await request.post(`${API_BASE}/meetings`, {
      headers: {
        Authorization: "Bearer demo-token",
        "x-demo-email": "admin@acme.com",
        "Content-Type": "application/json"
      },
      data: {
        date: "2026-03-23",
        start_time: "10:00",
        location,
        chair_name: "Admin Chair",
        secretary_name: "Admin Secretary"
      }
    });
    expect(createRes.ok()).toBeTruthy();
    const meeting = await createRes.json();

    const putRes = await request.put(`${API_BASE}/meetings/${meeting.id}/draft-minutes`, {
      headers: {
        "x-demo-email": "guest@acme.com",
        "Content-Type": "application/json"
      },
      data: {
        content: "forbidden write",
        base_version: 0
      }
    });
    expect(putRes.status()).toBe(403);

    const rollbackRes = await request.post(`${API_BASE}/meetings/${meeting.id}/draft-minutes/rollback`, {
      headers: {
        "x-demo-email": "guest@acme.com",
        "Content-Type": "application/json"
      },
      data: {
        version: 1
      }
    });
    expect(rollbackRes.status()).toBe(403);
  });
});
