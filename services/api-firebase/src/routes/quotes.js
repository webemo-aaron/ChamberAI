import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { orgCollection } from "../db/orgFirestore.js";
import { makeId } from "../utils/ids.js";
import { requireFields } from "../utils/validation.js";
import { requireRole } from "../middleware/rbac.js";

const router = express.Router();

router.get("/business-listings/:id/quotes", async (req, res, next) => {
  try {
    const db = initFirestore();
    const snapshot = await orgCollection(db, req.orgId, "businessListings")
      .doc(req.params.id)
      .collection("quotes")
      .get();
    const quotes = snapshot.docs.map((doc) => doc.data()).filter(Boolean);
    quotes.sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
    res.json(quotes);
  } catch (error) {
    next(error);
  }
});

router.post("/business-listings/:id/quotes", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    requireFields(req.body, ["title", "total_usd", "contact_name", "contact_email"]);
    const db = initFirestore();
    const quoteId = makeId("quote");
    const quote = {
      id: quoteId,
      business_id: req.params.id,
      title: req.body.title,
      description: req.body.description ?? null,
      service_class: req.body.service_class ?? "quick_win_automation",
      services: req.body.services ?? [],
      total_usd: parseFloat(req.body.total_usd),
      contact_name: req.body.contact_name,
      contact_email: req.body.contact_email,
      status: "draft",
      created_at: serverTimestamp(),
      sent_at: null
    };

    await orgCollection(db, req.orgId, "businessListings")
      .doc(req.params.id)
      .collection("quotes")
      .doc(quoteId)
      .set(quote);
    res.status(201).json(quote);
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
    res.json(doc.data());
  } catch (error) {
    next(error);
  }
});

export default router;
