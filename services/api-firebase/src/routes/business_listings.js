import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { orgCollection } from "../db/orgFirestore.js";
import { makeId } from "../utils/ids.js";
import { normalizeTags, requireFields } from "../utils/validation.js";
import { requireRole } from "../middleware/rbac.js";

const router = express.Router();

router.post("/business-listings", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    requireFields(req.body, ["name", "address", "city", "state", "phone", "email"]);
    if (!String(req.body.zip_code ?? req.body.zip ?? "").trim()) {
      throw new Error("Missing required field: zip_code");
    }
    const db = initFirestore();
    const requestedId = String(req.body.id ?? "").trim();
    const id = requestedId || makeId("biz");
    const businessRef = orgCollection(db, req.orgId, "businessListings").doc(id);
    const existingDoc = requestedId ? await businessRef.get() : null;
    const existingData = existingDoc?.exists ? existingDoc.data() ?? {} : {};
    const business = {
      id,
      name: req.body.name,
      category: req.body.category ?? null,
      businessType: req.body.businessType ?? existingData.businessType ?? null,
      rating: Number(req.body.rating ?? existingData.rating ?? 0),
      reviewCount: Number(req.body.reviewCount ?? req.body.review_count ?? existingData.reviewCount ?? 0),
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      zip_code: req.body.zip_code ?? req.body.zip ?? existingData.zip_code ?? null,
      phone: req.body.phone,
      email: req.body.email,
      website: req.body.website ?? null,
      description: req.body.description ?? null,
      tags: normalizeTags(req.body.tags),
      geo_scope_type: req.body.geo_scope_type ?? "city",
      geo_scope_id: req.body.geo_scope_id ?? null,
      ai_search_enabled: req.body.ai_search_enabled ?? false,
      source: req.body.source ?? existingData.source ?? null,
      created_at: existingData.created_at ?? serverTimestamp(),
      updated_at: serverTimestamp()
    };

    await businessRef.set(business, { merge: true });
    res.status(existingDoc?.exists ? 200 : 201).json(business);
  } catch (error) {
    next(error);
  }
});

router.get("/business-listings", async (req, res, next) => {
  try {
    const db = initFirestore();
    const snapshot = await orgCollection(db, req.orgId, "businessListings").get();
    let businesses = snapshot.docs.map((doc) => doc.data()).filter(Boolean);

    // Filter by geo_scope_type if provided
    if (req.query.geo_scope_type) {
      businesses = businesses.filter((b) => b.geo_scope_type === req.query.geo_scope_type);
    }

    // Filter by geo_scope_id if provided
    if (req.query.geo_scope_id) {
      const scopeId = String(req.query.geo_scope_id).toLowerCase();
      businesses = businesses.filter(
        (b) => String(b.geo_scope_id ?? "").toLowerCase() === scopeId
      );
    }

    // Filter by category if provided
    if (req.query.category) {
      businesses = businesses.filter((b) => b.category === req.query.category);
    }

    // Search by name if provided
    if (req.query.search) {
      const search = String(req.query.search).toLowerCase();
      businesses = businesses.filter(
        (b) =>
          String(b.name ?? "").toLowerCase().includes(search) ||
          String(b.city ?? "").toLowerCase().includes(search)
      );
    }

    businesses.sort((a, b) => String(b.updated_at ?? "").localeCompare(String(a.updated_at ?? "")));
    res.json(businesses);
  } catch (error) {
    next(error);
  }
});

router.get("/business-listings/:id", async (req, res, next) => {
  try {
    const db = initFirestore();
    const doc = await orgCollection(db, req.orgId, "businessListings").doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Business not found" });
    }
    res.json(doc.data());
  } catch (error) {
    next(error);
  }
});

router.put("/business-listings/:id", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const update = {
      ...req.body,
      tags: req.body.tags ? normalizeTags(req.body.tags) : undefined,
      updated_at: serverTimestamp()
    };
    await orgCollection(db, req.orgId, "businessListings").doc(req.params.id).set(update, { merge: true });
    const doc = await orgCollection(db, req.orgId, "businessListings").doc(req.params.id).get();
    res.json(doc.data());
  } catch (error) {
    next(error);
  }
});

router.delete("/business-listings/:id", requireRole("admin"), async (req, res, next) => {
  try {
    const db = initFirestore();
    await orgCollection(db, req.orgId, "businessListings").doc(req.params.id).delete();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
