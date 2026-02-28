import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";

let bindCapabilityPromise;

async function canBindLoopbackSocket() {
  if (!bindCapabilityPromise) {
    bindCapabilityPromise = new Promise((resolve) => {
      const probe = net.createServer();
      probe.once("error", () => resolve(false));
      probe.listen(0, "127.0.0.1", () => {
        probe.close(() => resolve(true));
      });
    });
  }
  return bindCapabilityPromise;
}

async function ensureSocketCapability(t) {
  const canBind = await canBindLoopbackSocket();
  if (!canBind) {
    t.skip("Socket binding is not permitted in this environment; skipping spawned-server integration tests.");
    return false;
  }
  return true;
}

async function waitForHealthy(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function startApiForTest(port, extraEnv = {}) {
  const child = spawn("node", ["src/server.js"], {
    cwd: "services/api-firebase",
    env: {
      ...process.env,
      PORT: String(port),
      HOST: "127.0.0.1",
      FIREBASE_AUTH_ENABLED: "true",
      ...extraEnv
    },
    stdio: "pipe"
  });
  if (process.env.TEST_DEBUG_CHILD_LOGS === "true") {
    child.stdout.on("data", (chunk) => {
      process.stdout.write(`[api:${port}:stdout] ${chunk}`);
    });
    child.stderr.on("data", (chunk) => {
      process.stdout.write(`[api:${port}:stderr] ${chunk}`);
    });
  }
  return child;
}

test("Firebase auth enabled rejects invalid bearer tokens with 401", async (t) => {
  if (!(await ensureSocketCapability(t))) return;
  const port = 4110;
  const base = `http://127.0.0.1:${port}`;
  const child = startApiForTest(port);

  try {
    await waitForHealthy(`${base}/health`);

    const res = await fetch(`${base}/settings`, {
      method: "PUT",
      headers: {
        Authorization: "Bearer invalid-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ retentionDays: 45 })
    });

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, "Invalid auth token");
  } finally {
    child.kill("SIGTERM");
  }
});

test("Firebase auth mocked token maps role and allows protected settings update", async (t) => {
  if (!(await ensureSocketCapability(t))) return;
  const port = 4111;
  const base = `http://127.0.0.1:${port}`;
  const child = startApiForTest(port, {
    FIREBASE_AUTH_MOCK_TOKENS: JSON.stringify({
      "valid-mock-token": {
        uid: "mock-1",
        email: "admin@acme.com",
        role: "admin"
      }
    })
  });

  try {
    await waitForHealthy(`${base}/health`);

    const updateRes = await fetch(`${base}/settings`, {
      method: "PUT",
      headers: {
        Authorization: "Bearer valid-mock-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ retentionDays: 21 })
    });
    assert.equal(updateRes.status, 200);

    const getRes = await fetch(`${base}/settings`, {
      headers: { Authorization: "Bearer valid-mock-token" }
    });
    assert.equal(getRes.status, 200);
    const body = await getRes.json();
    assert.equal(body.retentionDays, 21);
  } finally {
    child.kill("SIGTERM");
  }
});

test("Firebase auth mock role matrix enforces protected endpoint access", async (t) => {
  if (!(await ensureSocketCapability(t))) return;
  const port = 4112;
  const base = `http://127.0.0.1:${port}`;
  const child = startApiForTest(port, {
    FIREBASE_AUTH_MOCK_TOKENS: JSON.stringify({
      "admin-token": { uid: "admin-1", email: "admin@acme.com", role: "admin" },
      "secretary-token": { uid: "sec-1", email: "sec@acme.com", role: "secretary" },
      "guest-token": { uid: "guest-1", email: "guest@acme.com", role: "guest" }
    })
  });

  try {
    await waitForHealthy(`${base}/health`);

    const meetingRes = await fetch(`${base}/meetings`, {
      method: "POST",
      headers: {
        Authorization: "Bearer admin-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        date: "2026-04-01",
        start_time: "10:00",
        location: "Auth Matrix Room",
        chair_name: "Auth Chair",
        secretary_name: "Auth Secretary"
      })
    });
    assert.equal(meetingRes.status, 201);
    const meeting = await meetingRes.json();

    const draftRes = await fetch(`${base}/meetings/${meeting.id}/draft-minutes`, {
      method: "PUT",
      headers: {
        Authorization: "Bearer admin-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ content: "v1" })
    });
    assert.equal(draftRes.status, 200);

    const adminRes = await fetch(`${base}/settings`, {
      method: "PUT",
      headers: {
        Authorization: "Bearer admin-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ retentionDays: 22 })
    });
    assert.equal(adminRes.status, 200);

    const secRes = await fetch(`${base}/settings`, {
      method: "PUT",
      headers: {
        Authorization: "Bearer secretary-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ retentionDays: 23 })
    });
    assert.equal(secRes.status, 200);

    const guestRes = await fetch(`${base}/settings`, {
      method: "PUT",
      headers: {
        Authorization: "Bearer guest-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ retentionDays: 24 })
    });
    assert.equal(guestRes.status, 403);

    const secRetention = await fetch(`${base}/retention/sweep`, {
      method: "POST",
      headers: {
        Authorization: "Bearer secretary-token",
        "Content-Type": "application/json"
      },
      body: "{}"
    });
    assert.equal(secRetention.status, 200);

    const guestRetention = await fetch(`${base}/retention/sweep`, {
      method: "POST",
      headers: {
        Authorization: "Bearer guest-token",
        "Content-Type": "application/json"
      },
      body: "{}"
    });
    assert.equal(guestRetention.status, 403);

    const secRollback = await fetch(`${base}/meetings/${meeting.id}/draft-minutes/rollback`, {
      method: "POST",
      headers: {
        Authorization: "Bearer secretary-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ version: 1 })
    });
    assert.equal(secRollback.status, 200);

    const guestRollback = await fetch(`${base}/meetings/${meeting.id}/draft-minutes/rollback`, {
      method: "POST",
      headers: {
        Authorization: "Bearer guest-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ version: 1 })
    });
    assert.equal(guestRollback.status, 403);
  } finally {
    child.kill("SIGTERM");
  }
});

test("Firebase auth mock role matrix enforces geo intelligence endpoint access", async (t) => {
  if (!(await ensureSocketCapability(t))) return;
  const port = 4113;
  const base = `http://127.0.0.1:${port}`;
  const child = startApiForTest(port, {
    FIREBASE_AUTH_MOCK_TOKENS: JSON.stringify({
      "admin-token": { uid: "admin-geo", email: "admin@acme.com", role: "admin" },
      "secretary-token": { uid: "sec-geo", email: "sec@acme.com", role: "secretary" },
      "guest-token": { uid: "guest-geo", email: "guest@acme.com", role: "guest" }
    })
  });

  try {
    await waitForHealthy(`${base}/health`);

    const meetingRes = await fetch(`${base}/meetings`, {
      method: "POST",
      headers: {
        Authorization: "Bearer admin-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        date: "2026-04-02",
        start_time: "09:00",
        location: "Bethel",
        tags: "tourism,member"
      })
    });
    assert.equal(meetingRes.status, 201);

    const guestScan = await fetch(`${base}/geo-profiles/scan`, {
      method: "POST",
      headers: {
        Authorization: "Bearer guest-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ scopeType: "city", scopeId: "Bethel" })
    });
    assert.equal(guestScan.status, 403);

    const adminScan = await fetch(`${base}/geo-profiles/scan`, {
      method: "POST",
      headers: {
        Authorization: "Bearer admin-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        scopeType: "city",
        scopeId: "Bethel",
        existingDetails: ["Downtown retail", "Seasonal traffic"]
      })
    });
    assert.equal(adminScan.status, 200);
    const profile = await adminScan.json();
    assert.equal(profile.scope_type, "city");
    assert.equal(profile.scope_id, "Bethel");

    const secGenerate = await fetch(`${base}/geo-content-briefs/generate`, {
      method: "POST",
      headers: {
        Authorization: "Bearer secretary-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ scopeType: "city", scopeId: "Bethel" })
    });
    assert.equal(secGenerate.status, 200);
    const brief = await secGenerate.json();
    assert.equal(brief.scope_type, "city");
    assert.equal(brief.scope_id, "Bethel");
    assert.ok(Array.isArray(brief.top_use_cases));
    assert.ok(brief.top_use_cases.length > 0);

    const guestGenerate = await fetch(`${base}/geo-content-briefs/generate`, {
      method: "POST",
      headers: {
        Authorization: "Bearer guest-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ scopeType: "city", scopeId: "Bethel" })
    });
    assert.equal(guestGenerate.status, 403);

    const listProfiles = await fetch(`${base}/geo-profiles?scopeType=city&scopeId=Bethel`, {
      headers: {
        Authorization: "Bearer guest-token"
      }
    });
    assert.equal(listProfiles.status, 200);
    const profiles = await listProfiles.json();
    assert.ok(Array.isArray(profiles.items));
    assert.ok(profiles.items.length >= 1);
    assert.equal(typeof profiles.total, "number");

    const listBriefs = await fetch(`${base}/geo-content-briefs?scopeType=city&scopeId=Bethel`, {
      headers: {
        Authorization: "Bearer guest-token"
      }
    });
    assert.equal(listBriefs.status, 200);
    const briefs = await listBriefs.json();
    assert.ok(Array.isArray(briefs.items));
    assert.ok(briefs.items.length >= 1);
    assert.equal(typeof briefs.total, "number");
  } finally {
    child.kill("SIGTERM");
  }
});
