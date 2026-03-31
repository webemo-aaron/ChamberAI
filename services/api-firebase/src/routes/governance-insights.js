import express from "express";
import { generateText } from "ai";
import { initFirestore } from "../db/firestore.js";
import { orgCollection } from "../db/orgFirestore.js";
import { requireTier } from "../middleware/requireTier.js";
import {
  DEFAULT_TEXT_GATEWAY_MODEL,
  resolveTextGenerationModel,
  resolveTextGenerationModelName
} from "../services/ai-models.js";
import {
  buildGovernanceNarrativePrompt,
  computeInsightSummary,
  detectAnomalies,
  describePredictionConfidence,
  linearRegression,
  predictNextMonths
} from "../services/governance-insights.js";

const METRICS = ["meetings_held", "motions_passed", "action_items", "ai_interactions"];
const defaultDependencies = {
  initFirestore,
  orgCollection,
  requireTier,
  generateText
};

export function createGovernanceInsightsRouter(overrides = {}) {
  const dependencies = {
    ...defaultDependencies,
    ...overrides
  };
  const router = express.Router();

  router.get("/analytics/anomalies", dependencies.requireTier("council"), async (req, res, next) => {
    try {
      const monthlyBuckets = await loadGovernanceMonthlyBuckets(req.orgId, dependencies);
      res.json(buildAnomalyResponse(monthlyBuckets));
    } catch (error) {
      next(error);
    }
  });

  router.get("/analytics/predictions", dependencies.requireTier("council"), async (req, res, next) => {
    try {
      const monthlyBuckets = await loadGovernanceMonthlyBuckets(req.orgId, dependencies);
      res.json(buildPredictionResponse(monthlyBuckets));
    } catch (error) {
      next(error);
    }
  });

  router.post("/analytics/narrative", dependencies.requireTier("council"), async (req, res, next) => {
    try {
      const monthlyBuckets = await loadGovernanceMonthlyBuckets(req.orgId, dependencies);
      res.json(await buildNarrativeResponse(monthlyBuckets, dependencies));
    } catch (error) {
      next(error);
    }
  });

  return router;
}

async function loadGovernanceMonthlyBuckets(orgId, dependencies = defaultDependencies) {
  const db = dependencies.initFirestore();
  const [meetingsSnap, motionsSnap, actionItemsSnap, kioskChatsSnap] = await Promise.all([
    dependencies.orgCollection(db, orgId, "meetings").get(),
    dependencies.orgCollection(db, orgId, "motions").get(),
    dependencies.orgCollection(db, orgId, "actionItems").get(),
    dependencies.orgCollection(db, orgId, "kiosk_chats").get()
  ]);

  const meetings = meetingsSnap.docs.map((doc) => doc.data());
  const motions = motionsSnap.docs.map((doc) => doc.data());
  const actionItems = actionItemsSnap.docs.map((doc) => doc.data());
  const kioskChats = kioskChatsSnap.docs.map((doc) => doc.data());

  const monthlyBuckets = {};

  meetings.forEach((meeting) => {
    const dateStr = meeting.date || meeting.created_at;
    if (!dateStr) return;
    const month = String(dateStr).slice(0, 7);
    ensureBucket(monthlyBuckets, month);
    monthlyBuckets[month].meetings_held += 1;
  });

  motions.forEach((motion) => {
    const meeting = meetings.find((item) => item.id === motion.meeting_id);
    if (!meeting) return;
    const month = String(meeting.date || meeting.created_at).slice(0, 7);
    ensureBucket(monthlyBuckets, month);
    monthlyBuckets[month].motions_total += 1;
    if (motion.outcome === "passed" || motion.outcome === "approved") {
      monthlyBuckets[month].motions_passed += 1;
    }
  });

  actionItems.forEach((action) => {
    const meeting = meetings.find((item) => item.id === action.meeting_id);
    if (!meeting) return;
    const month = String(meeting.date || meeting.created_at).slice(0, 7);
    ensureBucket(monthlyBuckets, month);
    monthlyBuckets[month].action_items += 1;
  });

  kioskChats.forEach((chat) => {
    if (!chat.timestamp) return;
    const month = String(chat.timestamp).slice(0, 7);
    ensureBucket(monthlyBuckets, month);
    monthlyBuckets[month].ai_interactions += 1;
  });

  return Object.values(monthlyBuckets)
    .sort((left, right) => left.period.localeCompare(right.period))
    .slice(-12);
}

function ensureBucket(monthlyBuckets, month) {
  if (!monthlyBuckets[month]) {
    monthlyBuckets[month] = {
      period: month,
      meetings_held: 0,
      motions_passed: 0,
      motions_total: 0,
      action_items: 0,
      ai_interactions: 0
    };
  }
}

function buildAnomalyPayload(monthlyBuckets) {
  const anomalies_by_metric = Object.fromEntries(
    METRICS.map((metricKey) => [metricKey, detectAnomalies(monthlyBuckets, metricKey)])
  );
  return { anomalies_by_metric };
}

function buildPredictionPayload(monthlyBuckets) {
  const latestMonth = monthlyBuckets[monthlyBuckets.length - 1]?.period ?? null;
  const predictions = Object.fromEntries(
    METRICS.map((metricKey) => {
      const ys = monthlyBuckets.map((bucket) => Number(bucket?.[metricKey] ?? 0));
      const xs = ys.map((_, index) => index);
      const regression = linearRegression(xs, ys);
      const trend =
        regression.slope > 0.1 ? "up" : regression.slope < -0.1 ? "down" : "stable";
      return [
        metricKey,
        {
          slope: roundNumber(regression.slope),
          intercept: roundNumber(regression.intercept),
          r_squared: roundNumber(regression.r_squared),
          confidence: describePredictionConfidence(regression.r_squared),
          trend,
          next_3_months: predictNextMonths(regression, xs.length - 1, 3, latestMonth)
        }
      ];
    })
  );
  return { predictions };
}

export function buildAnomalyResponse(monthlyBuckets) {
  const period = buildPeriodLabel(monthlyBuckets);
  const anomalies_by_metric = buildAnomalyPayload(monthlyBuckets).anomalies_by_metric;
  const anomalousMonths = new Set();
  const metricsWithAnomalies = [];

  for (const metricKey of METRICS) {
    const flagged = anomalies_by_metric[metricKey].filter((entry) => entry.anomaly);
    if (flagged.length > 0) {
      metricsWithAnomalies.push(metricKey);
      flagged.forEach((entry) => anomalousMonths.add(entry.month));
    }
  }

  return {
    period,
    total_months: monthlyBuckets.length,
    anomalies_by_metric: anomalies_by_metric,
    summary: {
      anomaly_count: [...new Set(
        Object.values(anomalies_by_metric)
          .flat()
          .filter((item) => item.anomaly)
          .map((item) => `${item.month}:${item.value}`)
      )].length,
      most_anomalous_months: [...anomalousMonths],
      metrics_with_anomalies: metricsWithAnomalies,
    }
  };
}

export function buildPredictionResponse(monthlyBuckets) {
  const predictionPayload = buildPredictionPayload(monthlyBuckets);
  return {
    based_on_months: monthlyBuckets.length,
    predictions: predictionPayload.predictions
  };
}

export async function buildNarrativeResponse(monthlyBuckets, dependencies = defaultDependencies) {
  const anomalyPayload = buildAnomalyPayload(monthlyBuckets);
  const predictionPayload = buildPredictionPayload(monthlyBuckets);
  const summary = computeInsightSummary(monthlyBuckets);

  if (process.env.AI_GENERATION_ENABLED !== "true") {
    return {
      narrative: "AI narrative generation is disabled. Governance insights are available from anomaly and prediction endpoints.",
      generated_at: new Date().toISOString(),
      model: resolveTextGenerationModelName(),
      data_summary: {
        anomaly_count: summary.anomaly_count,
        improving_metrics: summary.improving_metrics,
        declining_metrics: summary.declining_metrics,
        stable_metrics: summary.stable_metrics
      }
    };
  }

  const model = resolveTextGenerationModel();
  const prompt = buildGovernanceNarrativePrompt(
    anomalyPayload.anomalies_by_metric,
    predictionPayload.predictions,
    summary
  );
  const { text } = await dependencies.generateText({
    model,
    prompt
  });

  return {
    narrative: String(text ?? "").trim(),
    generated_at: new Date().toISOString(),
    model: resolveTextGenerationModelName(),
    data_summary: {
      anomaly_count: summary.anomaly_count,
      improving_metrics: summary.improving_metrics,
      declining_metrics: summary.declining_metrics,
      stable_metrics: summary.stable_metrics
    }
  };
}

function buildPeriodLabel(monthlyBuckets) {
  if (monthlyBuckets.length === 0) return null;
  return `${monthlyBuckets[0].period} to ${monthlyBuckets[monthlyBuckets.length - 1].period}`;
}

function roundNumber(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

const router = createGovernanceInsightsRouter();

export default router;
