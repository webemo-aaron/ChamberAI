import test from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";

const API_BASE = process.env.API_BASE ?? "http://127.0.0.1:4001";
const headers = {
  Authorization: "Bearer demo-token",
  "x-demo-email": "admin@acme.com",
  "Content-Type": "application/json"
};

async function api(path, method = "GET", body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data = null;
  if (text) {
    data = JSON.parse(text);
  }
  assert.equal(res.ok, true, `${method} ${path} failed: ${res.status} ${text}`);
  return data;
}

async function apiExpect(path, expectedStatus, method = "GET", body) {
  return apiExpectWithHeaders(path, expectedStatus, headers, method, body);
}

async function apiExpectWithHeaders(path, expectedStatus, requestHeaders, method = "GET", body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data = null;
  if (text) data = JSON.parse(text);
  assert.equal(res.status, expectedStatus, `${method} ${path} expected ${expectedStatus} got ${res.status}: ${text}`);
  assert.equal(typeof data?.error, "string");
  return data;
}

async function waitForApiHealth(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error("API did not become healthy in time");
}

test("API contracts: meeting/audio/action/motion/settings/export", async () => {
  const suffix = Date.now();
  const meeting = await api("/meetings", "POST", {
    date: "2026-03-20",
    start_time: "10:00",
    location: `contract-room-${suffix}`,
    chair_name: "Alex",
    secretary_name: "Riley"
  });
  assert.equal(typeof meeting.id, "string");
  assert.equal(meeting.status, "CREATED");

  const audio = await api(`/meetings/${meeting.id}/audio-sources`, "POST", {
    type: "UPLOAD",
    file_uri: "contract.wav",
    duration_seconds: 60
  });
  assert.equal(audio.meeting_id, meeting.id);

  const process = await api(`/meetings/${meeting.id}/process`, "POST");
  assert.equal(process.status, "PROCESSING");

  const items = await api(`/meetings/${meeting.id}/action-items`, "PUT", {
    items: [{ description: "Contract check", owner_name: "Riley", due_date: "2026-04-01", status: "OPEN" }]
  });
  assert.equal(Array.isArray(items), true);
  assert.equal(items.length, 1);

  const motions = await api(`/meetings/${meeting.id}/motions`, "PUT", {
    motions: [{ text: "Approve report", mover_name: "Alex", seconder_name: "Riley", vote_method: "voice", outcome: "Passed" }]
  });
  assert.equal(Array.isArray(motions), true);
  assert.equal(motions.length, 1);

  await api("/settings", "PUT", {
    retentionDays: 45,
    maxFileSizeMb: 500,
    maxDurationSeconds: 14400,
    featureFlags: { public_summary: true }
  });
  const settings = await api("/settings");
  assert.equal(settings.retentionDays, 45);
  assert.equal(settings.featureFlags.public_summary, true);

  const approval = await api(`/meetings/${meeting.id}/approval-status`);
  assert.equal("ok" in approval, true);
  assert.equal("has_motions" in approval, true);
  assert.equal("missing_action_items" in approval, true);

  const exportResult = await api(`/meetings/${meeting.id}/export`, "POST", { format: "pdf" });
  assert.equal(typeof exportResult.file_uri, "string");
  assert.equal(exportResult.file_uri.includes(".pdf"), true);
});

test("API contracts: error response shape", async () => {
  await apiExpect("/meetings/missing-id", 404, "GET");
  await apiExpect("/meetings", 422, "POST", {
    // missing required fields should trigger validation error response with error string
    location: "invalid"
  });
});

test("API contracts: draft minutes versioning and rollback", async () => {
  const suffix = Date.now();
  const meeting = await api("/meetings", "POST", {
    date: "2026-03-21",
    start_time: "11:00",
    location: `contract-version-room-${suffix}`,
    chair_name: "Casey",
    secretary_name: "Morgan"
  });

  const v1 = await api(`/meetings/${meeting.id}/draft-minutes`, "PUT", {
    content: "v1 baseline minutes",
    base_version: 0
  });
  assert.equal(v1.minutes_version, 1);

  const conflict = await apiExpect(`/meetings/${meeting.id}/draft-minutes`, 409, "PUT", {
    content: "stale write",
    base_version: 0
  });
  assert.equal(conflict.current_version, 1);
  assert.equal(conflict.current_content, "v1 baseline minutes");

  const v2 = await api(`/meetings/${meeting.id}/draft-minutes`, "PUT", {
    content: "v2 updated minutes",
    base_version: 1
  });
  assert.equal(v2.minutes_version, 2);

  const versions = await api(`/meetings/${meeting.id}/draft-minutes/versions`, "GET");
  assert.equal(Array.isArray(versions.items), true);
  assert.equal(versions.items.length >= 2, true);
  assert.equal(versions.items[0].version > versions.items[1].version, true);
  assert.equal(typeof versions.items[0].version, "number");
  assert.equal(typeof versions.items[0].content, "string");
  assert.equal(versions.offset, 0);
  assert.equal(versions.limit, 50);
  assert.equal(versions.has_more, false);
  assert.equal(versions.next_offset, null);

  const paged = await api(`/meetings/${meeting.id}/draft-minutes/versions?limit=1&offset=1`, "GET");
  assert.equal(Array.isArray(paged.items), true);
  assert.equal(paged.items.length, 1);
  assert.equal(paged.items[0].version, 1);
  assert.equal(paged.offset, 1);
  assert.equal(paged.limit, 1);
  assert.equal(paged.has_more, false);
  assert.equal(paged.next_offset, null);

  const firstPage = await api(`/meetings/${meeting.id}/draft-minutes/versions?limit=1&offset=0`, "GET");
  assert.equal(firstPage.items.length, 1);
  assert.equal(firstPage.has_more, true);
  assert.equal(firstPage.next_offset, 1);

  let walked = 0;
  let offset = 0;
  do {
    const page = await api(`/meetings/${meeting.id}/draft-minutes/versions?limit=1&offset=${offset}`, "GET");
    walked += page.items.length;
    offset = page.next_offset ?? offset;
    if (!page.has_more) break;
  } while (walked < 10);
  assert.equal(walked >= 2, true);

  const bounded = await api(`/meetings/${meeting.id}/draft-minutes/versions?limit=0&offset=9999`, "GET");
  assert.equal(bounded.limit, 1);
  assert.equal(bounded.offset, 9999);
  assert.equal(Array.isArray(bounded.items), true);
  assert.equal(bounded.items.length, 0);
  assert.equal(bounded.has_more, false);
  assert.equal(bounded.next_offset, null);
  await apiExpect(`/meetings/${meeting.id}/draft-minutes/versions?limit=abc`, 400, "GET");
  await apiExpect(`/meetings/${meeting.id}/draft-minutes/versions?offset=abc`, 400, "GET");

  await apiExpect(`/meetings/${meeting.id}/draft-minutes/rollback`, 400, "POST", {});
  await apiExpect(`/meetings/${meeting.id}/draft-minutes/rollback`, 404, "POST", { version: 9999 });

  const rollback = await api(`/meetings/${meeting.id}/draft-minutes/rollback`, "POST", { version: 1 });
  assert.equal(rollback.content, "v1 baseline minutes");
  assert.equal(rollback.minutes_version, 3);

  const audit = await api(`/meetings/${meeting.id}/audit-log`, "GET");
  assert.equal(Array.isArray(audit), true);
  const rollbackEvent = audit.find((entry) => entry.event_type === "MINUTES_ROLLBACK");
  assert.equal(Boolean(rollbackEvent), true);
  assert.equal(typeof rollbackEvent.details?.from_version, "number");
  assert.equal(typeof rollbackEvent.details?.to_version, "number");
});

test("API contracts: draft minutes write endpoints enforce RBAC", async () => {
  const suffix = Date.now();
  const meeting = await api("/meetings", "POST", {
    date: "2026-03-22",
    start_time: "09:30",
    location: `contract-rbac-room-${suffix}`,
    chair_name: "Taylor",
    secretary_name: "Jordan"
  });

  const guestHeaders = {
    "x-demo-email": "viewer@acme.com",
    "Content-Type": "application/json"
  };

  await apiExpectWithHeaders(`/meetings/${meeting.id}/draft-minutes`, 403, guestHeaders, "PUT", {
    content: "guest should be forbidden",
    base_version: 0
  });
  await apiExpectWithHeaders(`/meetings/${meeting.id}/draft-minutes/rollback`, 403, guestHeaders, "POST", {
    version: 1
  });
});

test("API contracts: retention sweep deletes aged fixture audio and writes audit event", async () => {
  const tag = `contracts-${Date.now()}`;
  execSync(`SEED_TAG=${tag} ./scripts/seed_fixture_data.sh`, { stdio: "pipe" });
  await waitForApiHealth();

  try {
    await api("/settings", "PUT", {
      retentionDays: 0,
      maxFileSizeMb: 500,
      maxDurationSeconds: 14400
    });

    const sweep = await api("/retention/sweep", "POST", {});
    assert.equal(Array.isArray(sweep.deleted), true);
    assert.equal(sweep.deleted.some((entry) => entry.file_uri === "fixture-retention.wav"), true);
    const deletedMeetingIds = new Set(sweep.deleted.map((entry) => entry.meeting_id));

    const audit = await api("/meetings/system/audit-log", "GET");
    assert.equal(Array.isArray(audit), true);
    const event = audit.find((entry) => {
      if (entry.event_type !== "RETENTION_SWEEP") return false;
      if (Number(entry.details?.deleted_count) !== sweep.deleted.length) return false;
      if (!Array.isArray(entry.details?.meeting_ids)) return false;
      return entry.details.meeting_ids.every((id) => deletedMeetingIds.has(id));
    });
    assert.equal(Boolean(event), true);
    assert.equal(Number(event.details?.deleted_count) > 0, true);
    assert.equal(Number(event.details?.deleted_count), sweep.deleted.length);
    assert.equal(Array.isArray(event.details?.meeting_ids), true);
    assert.equal(event.details.meeting_ids.length > 0, true);
    for (const id of event.details.meeting_ids) {
      assert.equal(deletedMeetingIds.has(id), true, `audit meeting_id ${id} missing from deleted payload`);
    }
  } finally {
    await api("/settings", "PUT", {
      retentionDays: 60,
      maxFileSizeMb: 500,
      maxDurationSeconds: 14400
    });
  }
});
