import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { requireRole } from "../middleware/rbac.js";
import {
  normalizeScopeType,
  normalizeScopeId,
  makeGeoDocId,
  buildGeoProfile,
  buildGeoContentBrief
} from "../services/geo_intelligence.js";

const router = express.Router();

router.get("/geo-profiles", async (req, res, next) => {
  try {
    const scopeType = String(req.query.scopeType ?? "").trim();
    const scopeId = normalizeScopeId(req.query.scopeId);
    const { limit, offset } = parsePagination(req.query);
    const db = initFirestore();
    const snapshot = await db.collection("geoProfiles").get();
    let profiles = snapshot.docs.map((doc) => doc.data()).filter(Boolean);

    if (scopeType) {
      const normalizedType = normalizeScopeType(scopeType);
      profiles = profiles.filter((profile) => profile.scope_type === normalizedType);
    }
    if (scopeId) {
      profiles = profiles.filter((profile) => String(profile.scope_id ?? "").toLowerCase() === scopeId.toLowerCase());
    }

    profiles.sort((a, b) => String(b.updated_at ?? "").localeCompare(String(a.updated_at ?? "")));
    const items = profiles.slice(offset, offset + limit);
    res.json({
      items,
      offset,
      limit,
      next_offset: offset + items.length,
      has_more: offset + items.length < profiles.length,
      total: profiles.length
    });
  } catch (error) {
    next(error);
  }
});

router.post("/geo-profiles/scan", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const scopeType = normalizeScopeType(req.body.scopeType);
    const scopeId = normalizeScopeId(req.body.scopeId);
    if (!scopeId) {
      return res.status(400).json({ error: "scopeId is required." });
    }

    const db = initFirestore();
    const [meetingsSnap, existingProfileDoc] = await Promise.all([
      db.collection("meetings").get(),
      db.collection("geoProfiles").doc(makeGeoDocId(scopeType, scopeId)).get()
    ]);
    const meetings = meetingsSnap.docs.map((doc) => doc.data()).filter(Boolean);

    const profile = buildGeoProfile({
      id: existingProfileDoc.exists ? existingProfileDoc.data()?.id : undefined,
      scopeType,
      scopeId,
      scopeLabel: req.body.scopeLabel,
      existingDetails: req.body.existingDetails,
      meetings,
      nowIso: new Date().toISOString()
    });

    const docId = makeGeoDocId(scopeType, scopeId);
    await db.collection("geoProfiles").doc(docId).set(profile, { merge: true });
    await db.collection("auditLogs").add({
      meeting_id: "system",
      event_type: "GEO_PROFILE_REFRESHED",
      details: {
        scope_type: profile.scope_type,
        scope_id: profile.scope_id
      },
      timestamp: serverTimestamp()
    });
    const metrics = req.app?.locals?.metrics;
    if (metrics?.geo_events) {
      metrics.geo_events.profile_refreshed = (metrics.geo_events.profile_refreshed ?? 0) + 1;
    }
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

router.get("/geo-content-briefs", async (req, res, next) => {
  try {
    const scopeType = String(req.query.scopeType ?? "").trim();
    const scopeId = normalizeScopeId(req.query.scopeId);
    const { limit, offset } = parsePagination(req.query);
    const db = initFirestore();
    const snapshot = await db.collection("geoContentBriefs").get();
    let briefs = snapshot.docs.map((doc) => doc.data()).filter(Boolean);

    if (scopeType) {
      const normalizedType = normalizeScopeType(scopeType);
      briefs = briefs.filter((brief) => brief.scope_type === normalizedType);
    }
    if (scopeId) {
      briefs = briefs.filter((brief) => String(brief.scope_id ?? "").toLowerCase() === scopeId.toLowerCase());
    }

    briefs.sort((a, b) => String(b.generated_at ?? "").localeCompare(String(a.generated_at ?? "")));
    const items = briefs.slice(offset, offset + limit);
    res.json({
      items,
      offset,
      limit,
      next_offset: offset + items.length,
      has_more: offset + items.length < briefs.length,
      total: briefs.length
    });
  } catch (error) {
    next(error);
  }
});

router.post("/geo-content-briefs/generate", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const scopeType = normalizeScopeType(req.body.scopeType);
    const scopeId = normalizeScopeId(req.body.scopeId);
    if (!scopeId) {
      return res.status(400).json({ error: "scopeId is required." });
    }

    const db = initFirestore();
    const profileDocId = makeGeoDocId(scopeType, scopeId);
    let profileDoc = await db.collection("geoProfiles").doc(profileDocId).get();

    if (!profileDoc.exists) {
      const meetingsSnap = await db.collection("meetings").get();
      const meetings = meetingsSnap.docs.map((doc) => doc.data()).filter(Boolean);
      const profile = buildGeoProfile({
        scopeType,
        scopeId,
        scopeLabel: req.body.scopeLabel,
        existingDetails: req.body.existingDetails,
        meetings,
        nowIso: new Date().toISOString()
      });
      await db.collection("geoProfiles").doc(profileDocId).set(profile, { merge: true });
      profileDoc = await db.collection("geoProfiles").doc(profileDocId).get();
    }

    const profile = profileDoc.data();
    const brief = buildGeoContentBrief({
      profile,
      nowIso: new Date().toISOString()
    });

    await db.collection("geoContentBriefs").doc(brief.id).set(brief);
    await db.collection("auditLogs").add({
      meeting_id: "system",
      event_type: "GEO_CONTENT_GENERATED",
      details: {
        scope_type: brief.scope_type,
        scope_id: brief.scope_id,
        geo_profile_id: brief.geo_profile_id
      },
      timestamp: serverTimestamp()
    });
    const metrics = req.app?.locals?.metrics;
    if (metrics?.geo_events) {
      metrics.geo_events.content_generated = (metrics.geo_events.content_generated ?? 0) + 1;
    }
    res.json(brief);
  } catch (error) {
    next(error);
  }
});

export default router;

function parsePagination(query) {
  const limit = clampInt(query.limit, 25, 1, 100);
  const offset = clampInt(query.offset, 0, 0, Number.MAX_SAFE_INTEGER);
  return { limit, offset };
}

function clampInt(value, fallback, min, max) {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}
