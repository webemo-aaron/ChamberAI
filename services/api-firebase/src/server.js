import "dotenv/config";
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
import { requireAuth } from "./middleware/auth.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const metrics = {
  startedAt: Date.now(),
  requests_total: 0,
  errors_total: 0,
  by_status: {}
};

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
app.use(express.json({ limit: "5mb" }));

app.use((req, res, next) => {
  const started = Date.now();
  metrics.requests_total += 1;
  res.on("finish", () => {
    const status = String(res.statusCode);
    metrics.by_status[status] = (metrics.by_status[status] ?? 0) + 1;
    if (res.statusCode >= 500) metrics.errors_total += 1;
    console.log(
      JSON.stringify({
        level: "info",
        service: "api",
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration_ms: Date.now() - started
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

app.use((err, req, res, next) => {
  metrics.errors_total += 1;
  console.error(JSON.stringify({ level: "error", service: "api", path: req.path, message: err.message ?? "Server error" }));
  const status = err.status ?? 500;
  res.status(status).json({ error: err.message ?? "Server error" });
});

// Listen on 0.0.0.0 for Docker/Cloud Run compatibility
app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on http://0.0.0.0:${port}`);
});
