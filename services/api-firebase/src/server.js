import "./load-env.js";
import express from "express";
import cors from "cors";
import meetings from "./routes/meetings.js";
import audio from "./routes/audio.js";
import actionItems from "./routes/action_items.js";
import motions from "./routes/motions.js";
import minutes from "./routes/minutes.js";
import processing from "./routes/processing.js";
import audit from "./routes/audit.js";
import settings from "./routes/settings.js";
import publicSummary from "./routes/public_summary.js";
import approval from "./routes/approval.js";
import retention from "./routes/retention.js";
import search from "./routes/search.js";
import invitations from "./routes/invitations.js";
import integrations from "./routes/integrations.js";
import geoIntelligence from "./routes/geo_intelligence.js";
import aiSearch from "./routes/ai_search.js";
import businessListings from "./routes/business_listings.js";
import reviewWorkflow from "./routes/review_workflow.js";
import quotes from "./routes/quotes.js";
import billing from "./routes/billing.js";
import billingStatus from "./routes/billing-status.js";
import analytics from "./routes/analytics.js";
import governanceInsights from "./routes/governance-insights.js";
import organizations from "./routes/organizations.js";
import products from "./routes/products.js";
import kiosk from "./routes/kiosk.js";
import exportData from "./routes/export.js";
import notifications from "./routes/notifications.js";
import sso from "./routes/sso.js";
import { requireAuth } from "./middleware/auth.js";
import { requireTier } from "./middleware/requireTier.js";
import { initFirestore } from "./db/firestore.js";
import { orgCollection } from "./db/orgFirestore.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

// Initialize Sentry error tracking (production)
let Sentry = null;
if (process.env.SENTRY_DSN) {
  try {
    // Dynamic import to keep Sentry optional
    const sentryModule = await import("@sentry/node");
    Sentry = sentryModule.default;
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV ?? "development",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0
    });
    app.use(Sentry.Handlers.requestHandler());
  } catch (error) {
    console.warn("Sentry initialization skipped (DSN provided but module unavailable)");
  }
}

const metrics = {
  startedAt: Date.now(),
  requests_total: 0,
  errors_total: 0,
  by_status: {},
  by_route: {},  // Per-route tracking: { "GET /api/meetings": { count, errors, total_ms } }
  geo_events: {
    profile_refreshed: 0,
    content_generated: 0
  },
  business: {
    kiosk_conversations: 0,
    meetings_created: 0,
    exports_requested: 0
  }
};

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
app.locals.metrics = metrics;

app.use((req, res, next) => {
  const started = Date.now();
  metrics.requests_total += 1;
  res.on("finish", () => {
    const status = String(res.statusCode);
    const duration = Date.now() - started;
    metrics.by_status[status] = (metrics.by_status[status] ?? 0) + 1;
    if (res.statusCode >= 500) metrics.errors_total += 1;

    // Track per-route metrics
    const routeKey = `${req.method} ${req.path}`;
    if (!metrics.by_route[routeKey]) {
      metrics.by_route[routeKey] = { count: 0, errors: 0, total_ms: 0 };
    }
    metrics.by_route[routeKey].count += 1;
    metrics.by_route[routeKey].total_ms += duration;
    if (res.statusCode >= 500) metrics.by_route[routeKey].errors += 1;

    console.log(
      JSON.stringify({
        level: "info",
        service: "api",
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration_ms: duration
      })
    );
  });
  next();
});

app.get("/health", (req, res) => res.json({ ok: true }));
app.get("/metrics", (req, res) => {
  res.json({
    ...metrics,
    uptime_seconds: Math.floor((Date.now() - metrics.startedAt) / 1000)
  });
});

// Business metrics endpoint (requires auth + council tier)
app.get("/metrics/business", requireAuth, requireTier("council"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const orgId = req.orgId;

    // Query recent data (last 30 days)
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const [meetingsSnap, kioskChatsSnap, actionItemsSnap, membersSnap] = await Promise.all([
      orgCollection(db, orgId, "meetings")
        .where("created_at", ">=", cutoff)
        .get(),
      orgCollection(db, orgId, "kiosk_chats")
        .where("timestamp", ">=", cutoff)
        .get(),
      orgCollection(db, orgId, "actionItems")
        .where("updated_at", ">=", cutoff)
        .get(),
      orgCollection(db, orgId, "memberships").get()
    ]);

    const meetings = meetingsSnap.docs.map((d) => d.data());
    const kioskChats = kioskChatsSnap.docs.map((d) => d.data());
    const actionItems = actionItemsSnap.docs.map((d) => d.data());
    const members = membersSnap.docs.map((d) => d.data());

    // Compute KPIs
    const uniqueKioskUsers = new Set(kioskChats.map((c) => c.userId)).size;
    const completedActions = actionItems.filter((a) => a.status === "COMPLETED").length;
    const overallMeetingAttendance =
      meetings.length > 0
        ? meetings.reduce((sum, m) => sum + (m.attendance_count ?? 0), 0) / meetings.length
        : 0;

    res.json({
      period: "30_days",
      meetings_held: meetings.length,
      meetings_avg_attendance: Math.round(overallMeetingAttendance * 10) / 10,
      active_members: members.length,
      kiosk_conversations: kioskChats.length,
      unique_kiosk_users: uniqueKioskUsers,
      kiosk_engagement_rate: members.length > 0 ? ((uniqueKioskUsers / members.length) * 100).toFixed(1) : 0,
      action_items_created: actionItems.length,
      action_items_completed: completedActions,
      action_item_completion_rate:
        actionItems.length > 0 ? ((completedActions / actionItems.length) * 100).toFixed(1) : 0
    });
  } catch (error) {
    next(error);
  }
});

// Public AI Search endpoints (before requireAuth)
app.use(aiSearch);

// Billing webhook (public, before requireAuth, MUST be before JSON parsing)
app.use(billing);

// Billing status endpoints (public validation/proof endpoints)
app.use(billingStatus);

// JSON parsing AFTER webhook (webhook needs raw body for signature verification)
app.use(express.json({ limit: "5mb" }));

// Organizations management (POST is public for signup, GET/PATCH require auth)
app.use(organizations);

app.use(requireAuth);
app.use(meetings);
app.use(audio);
app.use(actionItems);
app.use(motions);
app.use(minutes);
app.use(processing);
app.use(audit);
app.use(settings);
app.use(publicSummary);
app.use(approval);
app.use(retention);
app.use(search);
app.use(invitations);
app.use(integrations);
app.use(geoIntelligence);
app.use(businessListings);
app.use(reviewWorkflow);
app.use(quotes);
app.use(analytics);
app.use(governanceInsights);
app.use(products);
app.use(kiosk);
app.use(exportData);
app.use(notifications);
app.use(sso);

app.use((err, req, res, next) => {
  metrics.errors_total += 1;
  console.error(JSON.stringify({ level: "error", service: "api", path: req.path, message: err.message ?? "Server error" }));
  const status = err.status ?? 500;
  res.status(status).json({ error: err.message ?? "Server error" });
});

// Default to 0.0.0.0 for Docker/Cloud Run, but allow HOST override for tests.
app.listen(port, host, () => {
  console.log(`API listening on http://${host}:${port}`);
});
