import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { createServer } from "../services/api/server.js";

class MockRequest extends EventEmitter {
  constructor({ method, url, body, headers }) {
    super();
    this.method = method;
    this.url = url;
    this.headers = headers;

    process.nextTick(() => {
      if (body) {
        this.emit("data", Buffer.from(body));
      }
      this.emit("end");
    });
  }
}

class MockResponse extends EventEmitter {
  constructor() {
    super();
    this.statusCode = 200;
    this.headers = {};
    this.body = "";
  }

  writeHead(statusCode, headers) {
    this.statusCode = statusCode;
    this.headers = headers ?? {};
  }

  end(chunk) {
    if (chunk) {
      this.body += chunk;
    }
    this.emit("finish");
  }
}

async function invoke(handler, path, options = {}) {
  const payload = options.body ?? null;
  const req = new MockRequest({
    method: options.method ?? "GET",
    url: path,
    body: payload,
    headers: { host: "localhost", "content-type": "application/json" }
  });
  const res = new MockResponse();

  const finished = new Promise((resolve) => res.once("finish", resolve));
  await handler(req, res);
  await finished;

  let body = null;
  if (res.body) {
    body = JSON.parse(res.body);
  }
  return { status: res.statusCode, body };
}

test("API smoke: create meeting, upload audio, process, approve, audit, retention", async () => {
  const { handler } = createServer();

  const meetingRes = await invoke(handler, "/meetings", {
    method: "POST",
    body: JSON.stringify({
      date: "2026-01-12",
      start_time: "10:00",
      location: "Chamber Hall",
      chair_name: "Alex Chair",
      secretary_name: "Riley Secretary"
    })
  });
  assert.equal(meetingRes.status, 201);

  const meetingId = meetingRes.body.id;

  const audioRes = await invoke(handler, `/meetings/${meetingId}/audio-sources`, {
    method: "POST",
    body: JSON.stringify({
      type: "UPLOAD",
      file_uri: "meeting_good.wav",
      duration_seconds: 1200
    })
  });
  assert.equal(audioRes.status, 201);

  const processRes = await invoke(handler, `/meetings/${meetingId}/process`, { method: "POST" });
  assert.equal(processRes.status, 200);
  assert.equal(processRes.body.status, "DRAFT_READY");

  const minutesRes = await invoke(handler, `/meetings/${meetingId}/draft-minutes`, { method: "GET" });
  assert.equal(minutesRes.status, 200);
  assert.ok(minutesRes.body.content);

  const updateRes = await invoke(handler, `/meetings/${meetingId}`, {
    method: "PUT",
    body: JSON.stringify({ end_time: "11:00" })
  });
  assert.equal(updateRes.status, 200);

  const approveRes = await invoke(handler, `/meetings/${meetingId}/approve`, { method: "POST" });
  assert.equal(approveRes.status, 200);
  assert.equal(approveRes.body.status, "APPROVED");

  const auditRes = await invoke(handler, `/meetings/${meetingId}/audit-log`, { method: "GET" });
  assert.equal(auditRes.status, 200);
  assert.ok(auditRes.body.length >= 1);

  const retentionRes = await invoke(handler, "/retention/sweep", { method: "POST" });
  assert.equal(retentionRes.status, 200);
});

test("API smoke: public summary endpoints", async () => {
  const { handler } = createServer();

  const meetingRes = await invoke(handler, "/meetings", {
    method: "POST",
    body: JSON.stringify({
      date: "2026-01-23",
      start_time: "09:00",
      location: "Public Summary Hall",
      chair_name: "Alex Chair",
      secretary_name: "Riley Secretary"
    })
  });
  assert.equal(meetingRes.status, 201);
  const meetingId = meetingRes.body.id;

  const updateRes = await invoke(handler, `/meetings/${meetingId}/public-summary`, {
    method: "PUT",
    body: JSON.stringify({
      content: "Public summary content.",
      fields: { title: "Highlights" },
      checklist: {
        no_confidential: true,
        names_approved: true,
        motions_reviewed: true,
        actions_reviewed: true,
        chair_approved: true
      }
    })
  });
  assert.equal(updateRes.status, 200);

  const getRes = await invoke(handler, `/meetings/${meetingId}/public-summary`, { method: "GET" });
  assert.equal(getRes.status, 200);
  assert.equal(getRes.body.content, "Public summary content.");

  const publishRes = await invoke(handler, `/meetings/${meetingId}/public-summary/publish`, { method: "POST" });
  assert.equal(publishRes.status, 200);
  assert.ok(publishRes.body.published_at);
});
