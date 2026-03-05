import express from "express";
import { initFirestore } from "../db/firestore.js";

const router = express.Router();

// Public endpoint: AI-search-enabled business profiles
// Returns structured JSON for AI search indexing
router.get("/ai-search/business-profiles", async (req, res, next) => {
  try {
    const db = initFirestore();
    const snapshot = await db.collection("businessListings").get();
    const businesses = snapshot.docs.map((doc) => doc.data()).filter(Boolean);

    // Filter only AI-search-enabled businesses
    const aiSearchListings = businesses
      .filter((b) => b.ai_search_enabled === true)
      .map((b) => ({
        id: b.id,
        name: b.name,
        category: b.category,
        address: b.address,
        city: b.city,
        state: b.state,
        zip_code: b.zip_code,
        phone: b.phone,
        email: b.email,
        website: b.website,
        description: b.description,
        tags: b.tags,
        geo_scope_type: b.geo_scope_type,
        geo_scope_id: b.geo_scope_id
      }));

    res.json(aiSearchListings);
  } catch (error) {
    next(error);
  }
});

// Public endpoint: Geo-scoped content briefs
// Returns structured content for AI search contextualization
router.get("/ai-search/local-intelligence", async (req, res, next) => {
  try {
    const scopeType = String(req.query.scopeType ?? "").trim();
    const scopeId = String(req.query.scopeId ?? "").trim().toLowerCase();

    const db = initFirestore();
    const snapshot = await db.collection("geoContentBriefs").get();
    let briefs = snapshot.docs.map((doc) => doc.data()).filter(Boolean);

    // Filter by scope if provided
    if (scopeType) {
      briefs = briefs.filter((b) => b.scope_type === scopeType);
    }
    if (scopeId) {
      briefs = briefs.filter((b) => String(b.scope_id ?? "").toLowerCase() === scopeId);
    }

    res.json(briefs);
  } catch (error) {
    next(error);
  }
});

// Public endpoint: JSON-LD LocalBusiness schema
// Returns structured data for search engine optimization
router.get("/ai-search/schema.json", async (req, res, next) => {
  try {
    const db = initFirestore();
    const snapshot = await db.collection("businessListings").get();
    const businesses = snapshot.docs.map((doc) => doc.data()).filter(Boolean);

    // Filter AI-search-enabled and build JSON-LD
    const jsonLdItems = businesses
      .filter((b) => b.ai_search_enabled === true)
      .map((b) => ({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: b.name,
        description: b.description,
        url: b.website,
        telephone: b.phone,
        email: b.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: b.address,
          addressLocality: b.city,
          addressRegion: b.state,
          postalCode: b.zip_code,
          addressCountry: "US"
        }
      }));

    res.json({
      "@context": "https://schema.org",
      "@graph": jsonLdItems
    });
  } catch (error) {
    next(error);
  }
});

export default router;
