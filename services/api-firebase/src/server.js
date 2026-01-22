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
import { requireAuth } from "./middleware/auth.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
app.use(express.json({ limit: "5mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use(requireAuth);
app.use(meetings);
app.use(audio);
app.use(actionItems);
app.use(motions);
app.use(minutes);
app.use(processing);
app.use(audit);
app.use(settings);

app.use((err, req, res, next) => {
  const status = err.status ?? 500;
  res.status(status).json({ error: err.message ?? "Server error" });
});

app.listen(port, "127.0.0.1", () => {
  console.log(`API listening on http://127.0.0.1:${port}`);
});
