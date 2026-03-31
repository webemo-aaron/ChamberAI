import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EventEmitter } from "node:events";
import http from "node:http";
import { Duplex } from "node:stream";
import express from "../../services/api-firebase/node_modules/express/index.js";
import {
  annotateTrendAnomalies,
  computeInsightSummary,
  detectAnomalies,
  linearRegression,
  predictNextMonths
} from "../../services/api-firebase/src/services/governance-insights.js";
import {
  DEFAULT_GEMINI_TEXT_MODEL,
  DEFAULT_TEXT_GATEWAY_MODEL,
  resolveTextGenerationModel,
  resolveTextGenerationModelName
} from "../../services/api-firebase/src/services/ai-models.js";
import {
  buildAnomalyResponse,
  buildNarrativeResponse,
  buildPredictionResponse,
  createGovernanceInsightsRouter
} from "../../services/api-firebase/src/routes/governance-insights.js";

function read(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

class MockRequest extends EventEmitter {
  constructor({ method, url, headers }) {
    super();
    this.method = method;
    this.url = url;
    this.headers = headers ?? { host: "localhost" };
    this.orgId = "org-test";
    process.nextTick(() => this.emit("end"));
  }
}

class MockResponse extends EventEmitter {
  constructor() {
    super();
    this.statusCode = 200;
    this.headers = {};
    this.body = "";
    this.locals = {};
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  setHeader(name, value) {
    this.headers[String(name).toLowerCase()] = value;
  }

  getHeader(name) {
    return this.headers[String(name).toLowerCase()];
  }

  removeHeader(name) {
    delete this.headers[String(name).toLowerCase()];
  }

  json(payload) {
    this.setHeader("content-type", "application/json");
    this.body = JSON.stringify(payload);
    this.emit("finish");
    return this;
  }

  end(chunk = "") {
    this.body += chunk;
    this.emit("finish");
    return this;
  }
}

async function invokeRouter(router, path, method = "GET") {
  const req = new MockRequest({ method, url: path });
  const res = new MockResponse();
  const finished = new Promise((resolve, reject) => {
    res.once("finish", resolve);
    res.once("error", reject);
  });

  router.handle(req, res, (error) => {
    if (error) {
      res.emit("error", error);
      return;
    }
    if (!res.body) {
      res.status(404).json({ error: "not_found" });
    }
  });

  await finished;
  return {
    status: res.statusCode,
    body: res.body ? JSON.parse(res.body) : null
  };
}

async function invokeApp(app, path, method = "GET") {
  const chunks = [];
  const socket = new Duplex({
    read() {},
    write(chunk, encoding, callback) {
      chunks.push(Buffer.from(chunk));
      callback();
    }
  });
  socket.remoteAddress = "127.0.0.1";
  socket.writable = true;
  socket.readable = true;

  const req = new http.IncomingMessage(socket);
  req.method = method;
  req.url = path;
  req.headers = { host: "localhost" };

  const res = new http.ServerResponse(req);
  res.assignSocket(socket);

  const finished = new Promise((resolve, reject) => {
    res.once("finish", resolve);
    res.once("error", reject);
  });

  app.handle(req, res, (error) => {
    if (error) {
      rejectResponse(error, res);
      return;
    }
    if (!res.writableEnded) {
      res.statusCode = 404;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: "not_found" }));
    }
  });

  await finished;
  const raw = Buffer.concat(chunks).toString("utf8");
  const bodyStart = raw.indexOf("\r\n\r\n");
  const bodyText = bodyStart === -1 ? raw : raw.slice(bodyStart + 4);
  return {
    status: res.statusCode,
    body: bodyText ? JSON.parse(bodyText) : null
  };
}

function rejectResponse(error, res) {
  process.nextTick(() => res.emit("error", error));
}

function createOrgCollectionStub(fixtures) {
  return (db, orgId, collectionName) => ({
    get: async () => ({
      docs: (fixtures[collectionName] ?? []).map((value) => ({
        data: () => value
      }))
    })
  });
}

test("governance insights service exposes anomaly, regression, prediction, prompt, and summary helpers", () => {
  const source = read("services/api-firebase/src/services/governance-insights.js");

  assert.match(source, /export function detectAnomalies\(monthlyBuckets, metricKey\)/);
  assert.match(source, /export function linearRegression\(xs, ys\)/);
  assert.match(source, /export function predictNextMonths\(regression, currentIndex, n, latestMonth\)/);
  assert.match(source, /export function buildGovernanceNarrativePrompt\(anomalies, predictions, summary\)/);
  assert.match(source, /export function computeInsightSummary\(monthlyBuckets\)/);
});

test("governance insights service uses z-score anomaly thresholding", () => {
  const source = read("services/api-firebase/src/services/governance-insights.js");

  assert.match(source, /const zScore = stdDev > 0 \? \(value - mean\) \/ stdDev : 0/);
  assert.match(
    source,
    /anomaly: stdDev > 0 && Math\.abs\(zScore\) > (?:2(?:\.0)?|DEFAULT_ANOMALY_THRESHOLD)/
  );
});

test("governance insights service returns regression slope and r-squared", () => {
  const source = read("services/api-firebase/src/services/governance-insights.js");

  assert.match(source, /return \{\s*slope,\s*intercept,\s*r_squared,\s*\}/s);
});

test("governance insights route registers anomalies endpoint with council tier", () => {
  const source = read("services/api-firebase/src/routes/governance-insights.js");

  assert.match(
    source,
    /router\.get\("\/analytics\/anomalies", (?:requireTier|dependencies\.requireTier)\("council"\), async \(req, res, next\) => \{/
  );
});

test("governance insights route registers predictions endpoint with council tier", () => {
  const source = read("services/api-firebase/src/routes/governance-insights.js");

  assert.match(
    source,
    /router\.get\("\/analytics\/predictions", (?:requireTier|dependencies\.requireTier)\("council"\), async \(req, res, next\) => \{/
  );
});

test("governance insights route registers narrative endpoint with council tier", () => {
  const source = read("services/api-firebase/src/routes/governance-insights.js");

  assert.match(
    source,
    /router\.post\("\/analytics\/narrative", (?:requireTier|dependencies\.requireTier)\("council"\), async \(req, res, next\) => \{/
  );
});

test("governance insights route uses generateText for AI narrative generation", () => {
  const source = read("services/api-firebase/src/routes/governance-insights.js");

  assert.match(source, /import \{ generateText \} from "ai";/);
  assert.match(source, /const \{ text \} = await (?:generateText|dependencies\.generateText)\(\{/);
});

test("governance insights route gracefully falls back when AI is disabled", () => {
  const source = read("services/api-firebase/src/routes/governance-insights.js");

  assert.match(source, /if \(process\.env\.AI_GENERATION_ENABLED !== "true"\) \{/);
  assert.match(source, /narrative: "AI narrative generation is disabled\. Governance insights are available from anomaly and prediction endpoints\."/);
});

test("governance insights route returns anomaly summary structure", () => {
  const source = read("services/api-firebase/src/routes/governance-insights.js");

  assert.match(source, /anomalies_by_metric:/);
  assert.match(source, /anomaly_count:/);
  assert.match(source, /most_anomalous_months:/);
  assert.match(source, /metrics_with_anomalies:/);
});

test("governance insights route returns prediction slope r-squared and next 3 months", () => {
  const source = read("services/api-firebase/src/routes/governance-insights.js");

  assert.match(source, /slope:/);
  assert.match(source, /r_squared:/);
  assert.match(source, /confidence:/);
  assert.match(source, /next_3_months:/);
});

test("analytics governance trends response annotates months with anomaly flags", () => {
  const source = read("services/api-firebase/src/routes/analytics.js");

  assert.match(source, /import \{ annotateTrendAnomalies \} from "\.\.\/services\/governance-insights\.js";/);
  assert.match(source, /const trends = annotateTrendAnomalies\(/);
  assert.match(source, /anomaly: false/);
});

test("server registers governance insights route", () => {
  const source = read("services/api-firebase/src/server.js");

  assert.match(source, /import governanceInsights from "\.\/routes\/governance-insights\.js";/);
  assert.match(source, /app\.use\(governanceInsights\);/);
});

test("governance insights route builds a narrative prompt from anomalies predictions and summary", () => {
  const source = read("services/api-firebase/src/routes/governance-insights.js");

  assert.match(
    source,
    /buildGovernanceNarrativePrompt\(\s*anomalyPayload\.anomalies_by_metric,\s*predictionPayload\.predictions,\s*summary\s*\)/s
  );
});

test("AI model resolution prefers Gemini when GEMINI_API_KEY is present", () => {
  const previousGeminiKey = process.env.GEMINI_API_KEY;
  const previousModel = process.env.AI_TEXT_MODEL;

  process.env.GEMINI_API_KEY = "test-gemini-key";
  process.env.AI_TEXT_MODEL = "";

  const resolved = resolveTextGenerationModel();

  assert.equal(resolveTextGenerationModelName(), DEFAULT_GEMINI_TEXT_MODEL);
  assert.equal(typeof resolved?.modelId, "string");
  assert.equal(resolved.modelId, DEFAULT_GEMINI_TEXT_MODEL);

  if (previousGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = previousGeminiKey;
  if (previousModel === undefined) delete process.env.AI_TEXT_MODEL;
  else process.env.AI_TEXT_MODEL = previousModel;
});

test("AI model resolution falls back to gateway model name when Gemini is unavailable", () => {
  const previousGeminiKey = process.env.GEMINI_API_KEY;
  const previousModel = process.env.AI_TEXT_MODEL;

  delete process.env.GEMINI_API_KEY;
  process.env.AI_TEXT_MODEL = "";

  assert.equal(resolveTextGenerationModel(), DEFAULT_TEXT_GATEWAY_MODEL);
  assert.equal(resolveTextGenerationModelName(), DEFAULT_TEXT_GATEWAY_MODEL);

  if (previousGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = previousGeminiKey;
  if (previousModel === undefined) delete process.env.AI_TEXT_MODEL;
  else process.env.AI_TEXT_MODEL = previousModel;
});

test("AI model resolver maps GEMINI_API_KEY into the Google provider config", () => {
  const source = read("services/api-firebase/src/services/ai-models.js");

  assert.match(source, /process\.env\.GOOGLE_GENERATIVE_AI_API_KEY/);
  assert.match(source, /process\.env\.GEMINI_API_KEY/);
  assert.match(source, /createGoogleGenerativeAI\(\s*\{\s*apiKey:\s*resolveGeminiApiKey\(\)\s*\}\s*\)\(modelName\)/s);
});

test("detectAnomalies flags a strong outlier month with z-score metadata", () => {
  const monthlyBuckets = [
    { period: "2025-01", meetings_held: 2 },
    { period: "2025-02", meetings_held: 2 },
    { period: "2025-03", meetings_held: 2 },
    { period: "2025-04", meetings_held: 2 },
    { period: "2025-05", meetings_held: 2 },
    { period: "2025-06", meetings_held: 20 }
  ];

  const result = detectAnomalies(monthlyBuckets, "meetings_held");
  const june = result.find((entry) => entry.month === "2025-06");

  assert.equal(result.length, 6);
  assert.equal(june?.anomaly, true);
  assert.ok(Math.abs(june?.z_score ?? 0) > 2);
});

test("linearRegression and predictNextMonths project an increasing series", () => {
  const regression = linearRegression([0, 1, 2, 3], [2, 4, 6, 8]);
  const forecast = predictNextMonths(regression, 3, 3, "2026-03");

  assert.equal(regression.slope, 2);
  assert.equal(regression.intercept, 2);
  assert.equal(regression.r_squared, 1);
  assert.deepEqual(forecast, [
    { month: "2026-04", month_offset: 1, predicted: 10 },
    { month: "2026-05", month_offset: 2, predicted: 12 },
    { month: "2026-06", month_offset: 3, predicted: 14 }
  ]);
});

test("computeInsightSummary identifies improving metrics and anomalous months", () => {
  const monthlyBuckets = [
    { period: "2025-01", meetings_held: 1, motions_passed: 1, action_items: 2, ai_interactions: 2 },
    { period: "2025-02", meetings_held: 1, motions_passed: 2, action_items: 2, ai_interactions: 3 },
    { period: "2025-03", meetings_held: 1, motions_passed: 3, action_items: 2, ai_interactions: 4 },
    { period: "2025-04", meetings_held: 1, motions_passed: 4, action_items: 2, ai_interactions: 5 },
    { period: "2025-05", meetings_held: 1, motions_passed: 5, action_items: 2, ai_interactions: 6 },
    { period: "2025-06", meetings_held: 10, motions_passed: 6, action_items: 2, ai_interactions: 7 }
  ];

  const summary = computeInsightSummary(monthlyBuckets);

  assert.equal(summary.mostAnomalousMonth, "2025-06");
  assert.ok(summary.improving_metrics.includes("motions_passed"));
  assert.ok(summary.trendingUp.includes("ai_interactions"));
});

test("annotateTrendAnomalies adds top-level anomaly flags to bucket output", () => {
  const monthlyBuckets = [
    { period: "2025-01", meetings_held: 2, motions_passed: 1, action_items: 1, ai_interactions: 5 },
    { period: "2025-02", meetings_held: 2, motions_passed: 1, action_items: 1, ai_interactions: 5 },
    { period: "2025-03", meetings_held: 2, motions_passed: 1, action_items: 1, ai_interactions: 5 },
    { period: "2025-04", meetings_held: 2, motions_passed: 1, action_items: 1, ai_interactions: 5 },
    { period: "2025-05", meetings_held: 2, motions_passed: 1, action_items: 1, ai_interactions: 5 },
    { period: "2025-06", meetings_held: 20, motions_passed: 1, action_items: 1, ai_interactions: 5 }
  ];

  const result = annotateTrendAnomalies(monthlyBuckets);

  assert.equal(result.length, 6);
  assert.equal(result[5].anomaly, true);
  assert.equal(result[5].anomaly_details.meetings_held.anomaly, true);
});

test("buildAnomalyResponse returns period summary and flagged metrics", () => {
  const monthlyBuckets = [
    { period: "2025-01", meetings_held: 2, motions_passed: 1, action_items: 1, ai_interactions: 4 },
    { period: "2025-02", meetings_held: 2, motions_passed: 1, action_items: 1, ai_interactions: 4 },
    { period: "2025-03", meetings_held: 2, motions_passed: 1, action_items: 1, ai_interactions: 4 },
    { period: "2025-04", meetings_held: 2, motions_passed: 1, action_items: 1, ai_interactions: 4 },
    { period: "2025-05", meetings_held: 2, motions_passed: 1, action_items: 1, ai_interactions: 4 },
    { period: "2025-06", meetings_held: 20, motions_passed: 1, action_items: 1, ai_interactions: 4 }
  ];

  const payload = buildAnomalyResponse(monthlyBuckets);

  assert.equal(payload.period, "2025-01 to 2025-06");
  assert.equal(payload.total_months, 6);
  assert.ok(payload.summary.anomaly_count >= 1);
  assert.ok(payload.summary.metrics_with_anomalies.includes("meetings_held"));
  assert.ok(payload.summary.most_anomalous_months.includes("2025-06"));
});

test("buildPredictionResponse returns forecasts and confidence labels", () => {
  const monthlyBuckets = [
    { period: "2025-10", meetings_held: 1, motions_passed: 1, action_items: 5, ai_interactions: 1 },
    { period: "2025-11", meetings_held: 2, motions_passed: 2, action_items: 5, ai_interactions: 2 },
    { period: "2025-12", meetings_held: 3, motions_passed: 3, action_items: 5, ai_interactions: 3 },
    { period: "2026-01", meetings_held: 4, motions_passed: 4, action_items: 5, ai_interactions: 4 }
  ];

  const payload = buildPredictionResponse(monthlyBuckets);

  assert.equal(payload.based_on_months, 4);
  assert.equal(payload.predictions.meetings_held.confidence, "high");
  assert.equal(payload.predictions.meetings_held.next_3_months[0].month, "2026-02");
  assert.equal(payload.predictions.meetings_held.next_3_months[2].month, "2026-04");
});

test("buildNarrativeResponse returns fallback payload when AI is disabled", async () => {
  const monthlyBuckets = [
    { period: "2026-01", meetings_held: 1, motions_passed: 1, action_items: 2, ai_interactions: 3 },
    { period: "2026-02", meetings_held: 1, motions_passed: 2, action_items: 2, ai_interactions: 4 },
    { period: "2026-03", meetings_held: 6, motions_passed: 3, action_items: 2, ai_interactions: 5 }
  ];

  const original = process.env.AI_GENERATION_ENABLED;
  process.env.AI_GENERATION_ENABLED = "false";

  try {
    const payload = await buildNarrativeResponse(monthlyBuckets);

    assert.match(payload.narrative, /AI narrative generation is disabled/);
    assert.equal(typeof payload.generated_at, "string");
    assert.ok(Array.isArray(payload.data_summary.improving_metrics));
  } finally {
    process.env.AI_GENERATION_ENABLED = original;
  }
});

test("buildNarrativeResponse uses injected generateText when AI is enabled", async () => {
  const monthlyBuckets = [
    { period: "2026-01", meetings_held: 1, motions_passed: 1, action_items: 2, ai_interactions: 3 },
    { period: "2026-02", meetings_held: 2, motions_passed: 2, action_items: 2, ai_interactions: 4 },
    { period: "2026-03", meetings_held: 3, motions_passed: 3, action_items: 2, ai_interactions: 5 }
  ];

  const originalEnabled = process.env.AI_GENERATION_ENABLED;
  const originalModel = process.env.AI_TEXT_MODEL;
  process.env.AI_GENERATION_ENABLED = "true";
  process.env.AI_TEXT_MODEL = "test-model";

  try {
    let capturedPrompt = null;
    const payload = await buildNarrativeResponse(monthlyBuckets, {
      generateText: async ({ model, prompt }) => {
        assert.equal(model, "test-model");
        capturedPrompt = prompt;
        return { text: "Generated governance narrative." };
      }
    });

    assert.equal(payload.narrative, "Generated governance narrative.");
    assert.equal(payload.model, "test-model");
    assert.match(capturedPrompt ?? "", /Predictions by metric:/);
    assert.match(capturedPrompt ?? "", /Governance summary:/);
  } finally {
    process.env.AI_GENERATION_ENABLED = originalEnabled;
    process.env.AI_TEXT_MODEL = originalModel;
  }
});

test("createGovernanceInsightsRouter serves anomalies with stubbed data", async () => {
  const router = createGovernanceInsightsRouter({
    initFirestore: () => ({ ok: true }),
    orgCollection: createOrgCollectionStub({
      meetings: [
        { id: "m1", date: "2025-01-10" },
        { id: "m2", date: "2025-02-10" },
        { id: "m3", date: "2025-03-10" },
        { id: "m4", date: "2025-04-10" },
        { id: "m5", date: "2025-05-10" },
        { id: "m6", date: "2025-06-10" },
        { id: "m7", date: "2025-06-18" },
        { id: "m8", date: "2025-06-20" },
        { id: "m9", date: "2025-06-22" },
        { id: "m10", date: "2025-06-25" },
        { id: "m11", date: "2025-06-27" },
        { id: "m12", date: "2025-06-29" },
        { id: "m13", date: "2025-06-30" },
        { id: "m14", date: "2025-06-30" },
        { id: "m15", date: "2025-06-30" },
        { id: "m16", date: "2025-06-30" },
        { id: "m17", date: "2025-06-30" },
        { id: "m18", date: "2025-06-30" },
        { id: "m19", date: "2025-06-30" },
        { id: "m20", date: "2025-06-30" },
        { id: "m21", date: "2025-06-30" },
        { id: "m22", date: "2025-06-30" },
        { id: "m23", date: "2025-06-30" },
        { id: "m24", date: "2025-06-30" },
        { id: "m25", date: "2025-06-30" }
      ],
      motions: [],
      actionItems: [],
      kiosk_chats: []
    }),
    requireTier: () => (req, res, next) => next()
  });

  const response = await invokeRouter(router, "/analytics/anomalies");

  assert.equal(response.status, 200);
  assert.equal(response.body.total_months, 6);
  assert.equal(response.body.summary.metrics_with_anomalies.includes("meetings_held"), true);
});

test("createGovernanceInsightsRouter serves predictions with stubbed data", async () => {
  const router = createGovernanceInsightsRouter({
    initFirestore: () => ({ ok: true }),
    orgCollection: createOrgCollectionStub({
      meetings: [
        { id: "m1", date: "2025-10-01" },
        { id: "m2", date: "2025-11-01" },
        { id: "m3", date: "2025-11-15" },
        { id: "m4", date: "2025-12-01" },
        { id: "m5", date: "2025-12-15" },
        { id: "m6", date: "2025-12-20" },
        { id: "m7", date: "2026-01-01" },
        { id: "m8", date: "2026-01-10" },
        { id: "m9", date: "2026-01-20" },
        { id: "m10", date: "2026-01-25" }
      ],
      motions: [],
      actionItems: [],
      kiosk_chats: []
    }),
    requireTier: () => (req, res, next) => next()
  });

  const response = await invokeRouter(router, "/analytics/predictions");

  assert.equal(response.status, 200);
  assert.equal(response.body.predictions.meetings_held.confidence, "high");
  assert.equal(response.body.predictions.meetings_held.next_3_months[0].month, "2026-02");
});

test("createGovernanceInsightsRouter serves narrative fallback with stubbed data", async () => {
  const original = process.env.AI_GENERATION_ENABLED;
  process.env.AI_GENERATION_ENABLED = "false";

  try {
    const router = createGovernanceInsightsRouter({
      initFirestore: () => ({ ok: true }),
      orgCollection: createOrgCollectionStub({
        meetings: [{ id: "m1", date: "2026-01-01" }],
        motions: [],
        actionItems: [],
        kiosk_chats: []
      }),
      requireTier: () => (req, res, next) => next()
    });

    const response = await invokeRouter(router, "/analytics/narrative", "POST");

    assert.equal(response.status, 200);
    assert.match(response.body.narrative, /AI narrative generation is disabled/);
  } finally {
    process.env.AI_GENERATION_ENABLED = original;
  }
});

test("createGovernanceInsightsRouter serves AI narrative with injected model client", async () => {
  const originalEnabled = process.env.AI_GENERATION_ENABLED;
  process.env.AI_GENERATION_ENABLED = "true";

  try {
    const router = createGovernanceInsightsRouter({
      initFirestore: () => ({ ok: true }),
      orgCollection: createOrgCollectionStub({
        meetings: [
          { id: "m1", date: "2026-01-01" },
          { id: "m2", date: "2026-02-01" },
          { id: "m3", date: "2026-03-01" }
        ],
        motions: [],
        actionItems: [],
        kiosk_chats: []
      }),
      requireTier: () => (req, res, next) => next(),
      generateText: async () => ({ text: "AI route narrative." })
    });

    const response = await invokeRouter(router, "/analytics/narrative", "POST");

    assert.equal(response.status, 200);
    assert.equal(response.body.narrative, "AI route narrative.");
  } finally {
    process.env.AI_GENERATION_ENABLED = originalEnabled;
  }
});

test("express app integration serves governance predictions over HTTP", async () => {
  const app = express();
  app.use((req, res, next) => {
    req.orgId = "org-http";
    next();
  });
  app.use(
    createGovernanceInsightsRouter({
      initFirestore: () => ({ ok: true }),
      orgCollection: createOrgCollectionStub({
        meetings: [
          { id: "m1", date: "2025-10-01" },
          { id: "m2", date: "2025-11-01" },
          { id: "m3", date: "2025-11-15" },
          { id: "m4", date: "2025-12-01" },
          { id: "m5", date: "2025-12-15" },
          { id: "m6", date: "2025-12-20" },
          { id: "m7", date: "2026-01-01" },
          { id: "m8", date: "2026-01-10" },
          { id: "m9", date: "2026-01-20" },
          { id: "m10", date: "2026-01-25" }
        ],
        motions: [],
        actionItems: [],
        kiosk_chats: []
      }),
      requireTier: () => (req, res, next) => next()
    })
  );

  const response = await invokeApp(app, "/analytics/predictions");

  assert.equal(response.status, 200);
  assert.equal(response.body.based_on_months, 4);
  assert.equal(response.body.predictions.meetings_held.next_3_months[0].month, "2026-02");
});

test("express app integration preserves payment-required tier errors", async () => {
  const app = express();
  app.use((req, res, next) => {
    req.orgId = "org-http";
    next();
  });
  app.use(
    createGovernanceInsightsRouter({
      initFirestore: () => ({ ok: true }),
      orgCollection: createOrgCollectionStub({
        meetings: [],
        motions: [],
        actionItems: [],
        kiosk_chats: []
      }),
      requireTier: (requiredTier) => (req, res) =>
        res.status(402).json({
          error: "Payment required",
          tier_required: requiredTier,
          current_tier: "pro"
        })
    })
  );

  const response = await invokeApp(app, "/analytics/anomalies");

  assert.equal(response.status, 402);
  assert.equal(response.body.tier_required, "council");
  assert.equal(response.body.current_tier, "pro");
});
