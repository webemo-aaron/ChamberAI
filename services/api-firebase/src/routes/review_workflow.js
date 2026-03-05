import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { makeId } from "../utils/ids.js";
import { requireFields } from "../utils/validation.js";
import { requireRole } from "../middleware/rbac.js";
import { maybeEnhanceGeoBrief } from "../services/ai_generation.js";

const router = express.Router();

router.get("/business-listings/:id/reviews", async (req, res, next) => {
  try {
    const db = initFirestore();
    const snapshot = await db
      .collection("businessListings")
      .doc(req.params.id)
      .collection("reviews")
      .get();
    const reviews = snapshot.docs.map((doc) => doc.data()).filter(Boolean);
    reviews.sort((a, b) => String(b.review_date ?? "").localeCompare(String(a.review_date ?? "")));
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

router.post("/business-listings/:id/reviews", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    requireFields(req.body, ["platform", "rating", "reviewer_name", "review_text"]);
    const db = initFirestore();
    const reviewId = makeId("review");
    const review = {
      id: reviewId,
      business_id: req.params.id,
      platform: req.body.platform,
      rating: parseInt(req.body.rating, 10),
      reviewer_name: req.body.reviewer_name,
      review_text: req.body.review_text,
      review_date: req.body.review_date ?? new Date().toISOString(),
      response_draft: null,
      response_text: null,
      response_status: "draft",
      created_at: serverTimestamp()
    };

    await db
      .collection("businessListings")
      .doc(req.params.id)
      .collection("reviews")
      .doc(reviewId)
      .set(review);
    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
});

router.put("/business-listings/:id/reviews/:reviewId", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const update = {
      ...req.body,
      updated_at: serverTimestamp()
    };
    await db
      .collection("businessListings")
      .doc(req.params.id)
      .collection("reviews")
      .doc(req.params.reviewId)
      .set(update, { merge: true });
    const doc = await db
      .collection("businessListings")
      .doc(req.params.id)
      .collection("reviews")
      .doc(req.params.reviewId)
      .get();
    res.json(doc.data());
  } catch (error) {
    next(error);
  }
});

router.post(
  "/business-listings/:id/reviews/:reviewId/draft-response",
  requireRole("admin", "secretary"),
  async (req, res, next) => {
    try {
      const db = initFirestore();
      const bizId = req.params.id;
      const reviewId = req.params.reviewId;

      // Fetch the review to get context
      const reviewDoc = await db
        .collection("businessListings")
        .doc(bizId)
        .collection("reviews")
        .doc(reviewId)
        .get();

      if (!reviewDoc.exists) {
        return res.status(404).json({ error: "Review not found" });
      }

      const review = reviewDoc.data();
      const businessDoc = await db.collection("businessListings").doc(bizId).get();
      const business = businessDoc.data();

      // Use maybeEnhanceGeoBrief pattern for AI generation
      // Pass review context to be enhanced with business context
      const context = {
        business_name: business.name,
        business_category: business.category,
        review_text: review.review_text,
        review_rating: review.rating,
        reviewer_name: review.reviewer_name
      };

      const responseDraft = await maybeEnhanceGeoBrief(
        `Draft a professional business response to this review:\n\n` +
        `Business: ${context.business_name} (${context.business_category})\n` +
        `Rating: ${context.review_rating}/5 stars\n` +
        `Reviewer: ${context.reviewer_name}\n` +
        `Review: "${context.review_text}"\n\n` +
        `Write a brief, professional 1-2 sentence response acknowledging the feedback.`
      );

      // Update review with draft response
      const update = {
        response_draft: responseDraft,
        response_status: "draft"
      };

      await db
        .collection("businessListings")
        .doc(bizId)
        .collection("reviews")
        .doc(reviewId)
        .set(update, { merge: true });

      const updatedDoc = await db
        .collection("businessListings")
        .doc(bizId)
        .collection("reviews")
        .doc(reviewId)
        .get();

      res.json(updatedDoc.data());
    } catch (error) {
      next(error);
    }
  }
);

export default router;
