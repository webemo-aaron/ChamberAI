import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { orgCollection } from "../db/orgFirestore.js";
import { makeId } from "../utils/ids.js";
import { requireFields } from "../utils/validation.js";
import { requireRole } from "../middleware/rbac.js";

const router = express.Router();

function normalizeTimestampValue(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  if (typeof value._seconds === "number") {
    return new Date(value._seconds * 1000).toISOString();
  }
  return value;
}

function normalizeQuoteRecord(record = {}) {
  const serviceNeeded = record.serviceNeeded ?? record.title ?? "Requested Service";
  const createdAt = normalizeTimestampValue(record.createdAt ?? record.created_at ?? null);
  const respondedAt = normalizeTimestampValue(record.respondedAt ?? record.sent_at ?? null);
  const total = record.total ?? record.total_usd ?? null;

  return {
    ...record,
    title: record.title ?? serviceNeeded,
    serviceNeeded,
    total,
    total_usd: record.total_usd ?? total,
    createdAt,
    created_at: record.created_at ?? createdAt,
    respondedAt,
    response: record.response ?? null
  };
}

router.get("/business-listings/:id/quotes", async (req, res, next) => {
  try {
    const db = initFirestore();
    const snapshot = await orgCollection(db, req.orgId, "businessListings")
      .doc(req.params.id)
      .collection("quotes")
      .get();
    const quotes = snapshot.docs.map((doc) => normalizeQuoteRecord(doc.data())).filter(Boolean);
    quotes.sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
    res.json(quotes);
  } catch (error) {
    next(error);
  }
});

router.post("/business-listings/:id/quotes", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    requireFields(req.body, ["title", "total_usd", "contact_name", "contact_email"]);
    const db = initFirestore();
    const requestedId = String(req.body.id ?? "").trim();
    const quoteId = requestedId || makeId("quote");
    const quoteRef = orgCollection(db, req.orgId, "businessListings")
      .doc(req.params.id)
      .collection("quotes")
      .doc(quoteId);
    const existingDoc = requestedId ? await quoteRef.get() : null;
    const existingData = existingDoc?.exists ? existingDoc.data() ?? {} : {};
    const title = req.body.title ?? req.body.serviceNeeded;
    const createdAt = req.body.createdAt ?? req.body.created_at ?? new Date().toISOString();
    const totalUsd = parseFloat(req.body.total_usd ?? req.body.total ?? 0);
    const quote = {
      id: quoteId,
      business_id: req.params.id,
      title,
      serviceNeeded: req.body.serviceNeeded ?? title,
      description: req.body.description ?? null,
      service_class: req.body.service_class ?? "quick_win_automation",
      services: req.body.services ?? [],
      total_usd: totalUsd,
      total: totalUsd,
      budget: req.body.budget ?? existingData.budget ?? null,
      timeline: req.body.timeline ?? existingData.timeline ?? null,
      contact_name: req.body.contact_name,
      contact_email: req.body.contact_email,
      status: req.body.status ?? existingData.status ?? "draft",
      createdAt: createdAt,
      created_at: existingData.created_at ?? createdAt,
      respondedAt: req.body.respondedAt ?? existingData.respondedAt ?? null,
      response: req.body.response ?? existingData.response ?? null,
      sent_at: req.body.sent_at ?? existingData.sent_at ?? null,
      updated_at: serverTimestamp()
    };

    await quoteRef.set(quote, { merge: true });
    res.status(existingDoc?.exists ? 200 : 201).json(quote);
  } catch (error) {
    next(error);
  }
});

router.put("/business-listings/:id/quotes/:quoteId", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const update = {
      ...req.body,
      total_usd: req.body.total_usd ? parseFloat(req.body.total_usd) : undefined,
      sent_at: req.body.status === "sent" ? serverTimestamp() : undefined,
      updated_at: serverTimestamp()
    };
    await orgCollection(db, req.orgId, "businessListings")
      .doc(req.params.id)
      .collection("quotes")
      .doc(req.params.quoteId)
      .set(update, { merge: true });
    const doc = await orgCollection(db, req.orgId, "businessListings")
      .doc(req.params.id)
      .collection("quotes")
      .doc(req.params.quoteId)
      .get();
    res.json(normalizeQuoteRecord(doc.data()));
  } catch (error) {
    next(error);
  }
});

export default router;
