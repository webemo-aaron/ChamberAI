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
  return { status: res.statusCode, body, headers: res.headers };
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

test("API smoke: geo profile scan and content brief generation", async () => {
  const { handler } = createServer();

  const meetingRes = await invoke(handler, "/meetings", {
    method: "POST",
    body: JSON.stringify({
      date: "2026-02-28",
      start_time: "08:30",
      location: "Bethel",
      tags: "tourism,member"
    })
  });
  assert.equal(meetingRes.status, 201);

  const scanRes = await invoke(handler, "/geo-profiles/scan", {
    method: "POST",
    body: JSON.stringify({
      scopeType: "city",
      scopeId: "Bethel",
      existingDetails: ["Downtown restaurants", "Seasonal tourism traffic"]
    })
  });
  assert.equal(scanRes.status, 200);
  assert.equal(scanRes.body.scope_type, "city");
  assert.equal(scanRes.body.scope_id, "Bethel");
  assert.ok(typeof scanRes.body.ai_readiness_score === "number");

  const briefRes = await invoke(handler, "/geo-content-briefs/generate", {
    method: "POST",
    body: JSON.stringify({
      scopeType: "city",
      scopeId: "Bethel"
    })
  });
  assert.equal(briefRes.status, 200);
  assert.equal(briefRes.body.scope_type, "city");
  assert.ok(Array.isArray(briefRes.body.top_use_cases));
  assert.ok(briefRes.body.top_use_cases.length > 0);

  const listRes = await invoke(handler, "/geo-content-briefs?scopeType=city&scopeId=Bethel", {
    method: "GET"
  });
  assert.equal(listRes.status, 200);
  assert.ok(Array.isArray(listRes.body.items));
  assert.ok(listRes.body.items.length >= 1);
  assert.equal(typeof listRes.body.total, "number");

  const pagedRes = await invoke(handler, "/geo-content-briefs?scopeType=city&scopeId=Bethel&limit=1&offset=0", {
    method: "GET"
  });
  assert.equal(pagedRes.status, 200);
  assert.equal(pagedRes.body.limit, 1);
  assert.ok(Array.isArray(pagedRes.body.items));
  assert.ok(pagedRes.body.items.length <= 1);
});

test("API smoke: business listings endpoints support local business hub flows", async () => {
  const { handler } = createServer();

  const listRes = await invoke(handler, "/business-listings", { method: "GET" });
  assert.equal(listRes.status, 200);
  assert.ok(Array.isArray(listRes.body.data));
  assert.ok(listRes.body.data.length >= 1);

  const businessId = listRes.body.data[0].id;

  const detailRes = await invoke(handler, `/business-listings/${businessId}`, { method: "GET" });
  assert.equal(detailRes.status, 200);
  assert.equal(detailRes.body.id, businessId);

  const reviewsRes = await invoke(handler, `/business-listings/${businessId}/reviews`, { method: "GET" });
  assert.equal(reviewsRes.status, 200);
  assert.ok(Array.isArray(reviewsRes.body.data));

  const responseRes = await invoke(handler, `/business-listings/${businessId}/reviews/${reviewsRes.body.data[0].id}/draft-response`, {
    method: "POST",
    body: JSON.stringify({ response: "Thanks for the feedback." })
  });
  assert.equal(responseRes.status, 200);
  assert.equal(responseRes.body.response_status, "draft");

  const quotesRes = await invoke(handler, `/business-listings/${businessId}/quotes`, { method: "GET" });
  assert.equal(quotesRes.status, 200);
  assert.ok(Array.isArray(quotesRes.body.data));

  const quoteCreateRes = await invoke(handler, `/business-listings/${businessId}/quotes`, {
    method: "POST",
    body: JSON.stringify({
      title: "Automation Discovery Sprint",
      service_class: "quick_win_automation",
      total_usd: 2400,
      contact_name: "Jordan Smith",
      contact_email: "jordan@example.com"
    })
  });
  assert.equal(quoteCreateRes.status, 201);
  assert.equal(quoteCreateRes.body.status, "draft");

  const quoteUpdateRes = await invoke(handler, `/business-listings/${businessId}/quotes/${quoteCreateRes.body.id}`, {
    method: "PUT",
    body: JSON.stringify({ status: "sent" })
  });
  assert.equal(quoteUpdateRes.status, 200);
  assert.equal(quoteUpdateRes.body.status, "sent");

  const createBusinessRes = await invoke(handler, "/business-listings", {
    method: "POST",
    body: JSON.stringify({
      id: "biz_import_1",
      name: "Imported Chamber Business",
      category: "Professional Services",
      businessType: "service_provider",
      description: "Imported from showcase data.",
      city: "Portland",
      state: "ME",
      geo_scope_type: "city",
      geo_scope_id: "Portland",
      ai_search_enabled: true
    })
  });
  assert.equal(createBusinessRes.status, 201);
  assert.equal(createBusinessRes.body.id, "biz_import_1");

  const importedDetailRes = await invoke(handler, "/business-listings/biz_import_1", { method: "GET" });
  assert.equal(importedDetailRes.status, 200);
  assert.equal(importedDetailRes.body.name, "Imported Chamber Business");

  const updateBusinessRes = await invoke(handler, "/business-listings", {
    method: "POST",
    body: JSON.stringify({
      id: "biz_import_1",
      name: "Imported Chamber Business",
      category: "Professional Services",
      businessType: "service_provider",
      description: "Imported from showcase data with a refreshed description.",
      city: "Portland",
      state: "ME",
      geo_scope_type: "city",
      geo_scope_id: "Portland",
      ai_search_enabled: true,
      source: {
        sync_run_id: "sync_portland_2",
        iteration: 2
      }
    })
  });
  assert.equal(updateBusinessRes.status, 201);
  assert.equal(updateBusinessRes.body.version, 2);

  const versionsRes = await invoke(handler, "/business-listings/biz_import_1/versions", { method: "GET" });
  assert.equal(versionsRes.status, 200);
  assert.equal(versionsRes.body.data.length, 2);
  assert.equal(versionsRes.body.data.at(-1).version, 2);

  const importedReviewRes = await invoke(handler, "/business-listings/biz_import_1/reviews", {
    method: "POST",
    body: JSON.stringify({
      id: "review_biz_import_1_seed_1",
      platform: "Google",
      rating: 5,
      reviewer_name: "Jordan Smith",
      review_text: "Imported review text.",
      createdAt: "2026-03-10T15:00:00.000Z"
    })
  });
  assert.equal(importedReviewRes.status, 201);
  assert.equal(importedReviewRes.body.id, "review_biz_import_1_seed_1");
  assert.equal(importedReviewRes.body.author, "Jordan Smith");

  const importedReviewsListRes = await invoke(handler, "/business-listings/biz_import_1/reviews", {
    method: "GET"
  });
  assert.equal(importedReviewsListRes.status, 200);
  assert.equal(
    importedReviewsListRes.body.data.filter((review) => review.id === "review_biz_import_1_seed_1").length,
    1
  );

  const importedQuoteRes = await invoke(handler, "/business-listings/biz_import_1/quotes", {
    method: "POST",
    body: JSON.stringify({
      id: "quote_biz_import_1_seed_1",
      title: "Workflow Sprint",
      serviceNeeded: "Workflow Sprint",
      total_usd: 2400,
      contact_name: "Jordan Smith",
      contact_email: "jordan@example.com",
      budget: "$2,000-$3,000",
      timeline: "Within 30 days",
      status: "pending"
    })
  });
  assert.equal(importedQuoteRes.status, 201);
  assert.equal(importedQuoteRes.body.id, "quote_biz_import_1_seed_1");
  assert.equal(importedQuoteRes.body.serviceNeeded, "Workflow Sprint");

  const importedQuoteUpdateRes = await invoke(handler, "/business-listings/biz_import_1/quotes", {
    method: "POST",
    body: JSON.stringify({
      id: "quote_biz_import_1_seed_1",
      title: "Workflow Sprint",
      serviceNeeded: "Workflow Sprint",
      total_usd: 2600,
      contact_name: "Jordan Smith",
      contact_email: "jordan@example.com",
      budget: "$2,500-$3,500",
      timeline: "Within 30 days",
      status: "pending"
    })
  });
  assert.equal(importedQuoteUpdateRes.status, 200);
  assert.equal(importedQuoteUpdateRes.body.total_usd, 2600);

  const importedQuotesListRes = await invoke(handler, "/business-listings/biz_import_1/quotes", {
    method: "GET"
  });
  assert.equal(importedQuotesListRes.status, 200);
  assert.equal(
    importedQuotesListRes.body.data.filter((quote) => quote.id === "quote_biz_import_1_seed_1").length,
    1
  );

  const syncRunsRes = await invoke(handler, "/business-sync-runs", { method: "GET" });
  assert.equal(syncRunsRes.status, 200);
  assert.ok(Array.isArray(syncRunsRes.body.data));
  assert.ok(syncRunsRes.body.data.some((run) => run.id === "sync_portland_2"));
});

test("API smoke: options requests expose CORS headers required by the secretary console", async () => {
  const { handler } = createServer();

  const optionsRes = await invoke(handler, "/business-listings", {
    method: "OPTIONS"
  });

  assert.equal(optionsRes.status, 204);
  assert.equal(optionsRes.body, null);
  assert.equal(
    optionsRes.headers["Access-Control-Allow-Headers"],
    "Content-Type, Authorization, x-demo-email, X-Org-Id"
  );
  assert.equal(
    optionsRes.headers["Access-Control-Allow-Methods"],
    "GET,POST,PUT,DELETE,OPTIONS"
  );
});
