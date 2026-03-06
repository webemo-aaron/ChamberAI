/**
 * Products API - AI-Directed Product Management
 *
 * Endpoints for managing products/offerings with automatic Stripe integration.
 * When products are created, prices are automatically generated in Stripe
 * for immediate monetization.
 */

import express from "express";
import { initFirestore } from "../db/firestore.js";
import { orgCollection } from "../db/orgFirestore.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import {
  createStripeProduct,
  createStripeProducts,
  updateStripeProduct,
  addProductPrice,
  listAIProducts,
  archiveStripeProduct,
  syncProductsToStripe,
  getProductAnalytics
} from "../services/stripe-product-manager.js";

const router = express.Router();

/**
 * POST /products
 * Create a new product with automatic Stripe integration
 * Requires: requireAuth + admin role
 */
router.post("/products", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const { name, description, monthlyPrice, tier = "custom", category = "addon", metadata = {} } = req.body;

    if (!name || monthlyPrice === undefined) {
      return res.status(400).json({ error: "name and monthlyPrice required" });
    }

    // Create in Stripe first
    const stripeResult = await createStripeProduct({
      name,
      description,
      priceAmount: Math.round(monthlyPrice * 100),
      tier,
      category,
      metadata: {
        orgId: req.orgId,
        ...metadata
      }
    });

    if (!stripeResult.success) {
      return res.status(400).json({ error: stripeResult.error });
    }

    // Store product metadata locally
    const productRef = await orgCollection(db, req.orgId, "products").add({
      name,
      description,
      monthlyPrice,
      tier,
      category,
      stripeProductId: stripeResult.productId,
      stripePriceId: stripeResult.priceId,
      status: "active",
      created_at: new Date().toISOString(),
      created_by: req.user?.email || "system",
      metadata
    });

    res.status(201).json({
      productId: productRef.id,
      stripeProductId: stripeResult.productId,
      stripePriceId: stripeResult.priceId,
      product: {
        name,
        description,
        monthlyPrice,
        tier,
        category,
        status: "active"
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /products
 * List all products for organization
 */
router.get("/products", requireAuth, async (req, res, next) => {
  try {
    const db = initFirestore();
    const productsRef = orgCollection(db, req.orgId, "products");
    const snapshot = await productsRef.where("status", "==", "active").get();

    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /products/:productId
 * Get product details with analytics
 */
router.get("/products/:productId", requireAuth, async (req, res, next) => {
  try {
    const db = initFirestore();
    const { productId } = req.params;

    const productDoc = await orgCollection(db, req.orgId, "products")
      .doc(productId)
      .get();

    if (!productDoc.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const productData = productDoc.data();

    // Get Stripe analytics
    const analytics = productData.stripeProductId
      ? await getProductAnalytics(productData.stripeProductId)
      : { success: false };

    res.json({
      id: productId,
      ...productData,
      analytics: analytics.success ? analytics : null
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /products/:productId
 * Update product (name, description, metadata)
 */
router.patch("/products/:productId", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const { productId } = req.params;
    const { name, description, metadata } = req.body;

    const productRef = orgCollection(db, req.orgId, "products").doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const productData = productDoc.data();

    // Update in Stripe if product ID exists
    if (productData.stripeProductId && (name || description || metadata)) {
      const stripeResult = await updateStripeProduct(productData.stripeProductId, {
        name: name || productData.name,
        description: description || productData.description,
        metadata: metadata || productData.metadata
      });

      if (!stripeResult.success) {
        return res.status(400).json({ error: stripeResult.error });
      }
    }

    // Update locally
    await productRef.update({
      ...(name && { name }),
      ...(description && { description }),
      ...(metadata && { metadata }),
      updated_at: new Date().toISOString(),
      updated_by: req.user?.email || "system"
    });

    res.json({ status: "updated", productId });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /products/:productId/prices
 * Add additional price tier to product (e.g., annual billing)
 */
router.post("/products/:productId/prices", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const { productId } = req.params;
    const { amount, interval = "month" } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "amount required" });
    }

    const productDoc = await orgCollection(db, req.orgId, "products")
      .doc(productId)
      .get();

    if (!productDoc.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const productData = productDoc.data();

    // Create price in Stripe
    const priceResult = await addProductPrice(productData.stripeProductId, {
      amount: Math.round(amount * 100),
      interval,
      metadata: { orgId: req.orgId }
    });

    if (!priceResult.success) {
      return res.status(400).json({ error: priceResult.error });
    }

    // Store price locally
    await orgCollection(db, req.orgId, "productPrices").add({
      productId,
      stripeProductId: productData.stripeProductId,
      stripePriceId: priceResult.priceId,
      amount,
      interval,
      status: "active",
      created_at: new Date().toISOString()
    });

    res.status(201).json({
      stripePriceId: priceResult.priceId,
      amount,
      interval,
      status: "active"
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /products/:productId
 * Archive product (soft delete)
 */
router.delete("/products/:productId", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const { productId } = req.params;

    const productRef = orgCollection(db, req.orgId, "products").doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const productData = productDoc.data();

    // Archive in Stripe
    if (productData.stripeProductId) {
      const stripeResult = await archiveStripeProduct(productData.stripeProductId);
      if (!stripeResult.success) {
        return res.status(400).json({ error: stripeResult.error });
      }
    }

    // Mark as archived locally
    await productRef.update({
      status: "archived",
      archived_at: new Date().toISOString(),
      archived_by: req.user?.email || "system"
    });

    res.json({ status: "archived", productId });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /products/batch/create
 * Create multiple products at once (batch operation)
 * Admin only
 */
router.post("/products/batch/create", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "products array required" });
    }

    // Validate products
    const validated = products.map(p => ({
      name: p.name,
      description: p.description,
      priceAmount: Math.round(p.monthlyPrice * 100),
      tier: p.tier || "custom",
      category: p.category || "addon",
      metadata: { orgId: req.orgId, ...p.metadata }
    }));

    // Create in Stripe
    const stripeResults = await createStripeProducts(validated);

    // Store locally
    const localResults = [];
    for (const result of stripeResults.successful) {
      const productRef = await orgCollection(db, req.orgId, "products").add({
        name: products[stripeResults.successful.indexOf(result)].name,
        description: products[stripeResults.successful.indexOf(result)].description,
        monthlyPrice: result.metadata.monthlyPrice,
        tier: result.metadata.tier,
        category: result.metadata.category,
        stripeProductId: result.productId,
        stripePriceId: result.priceId,
        status: "active",
        created_at: new Date().toISOString(),
        created_by: req.user?.email || "system"
      });

      localResults.push({
        localId: productRef.id,
        stripeProductId: result.productId
      });
    }

    res.status(201).json({
      created: stripeResults.summary.created,
      failed: stripeResults.summary.failed,
      results: localResults,
      errors: stripeResults.failed
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /products/sync
 * Sync all local products to Stripe
 * Admin only
 */
router.post("/products/sync", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const productsRef = orgCollection(db, req.orgId, "products");
    const snapshot = await productsRef.where("status", "==", "active").get();

    const localProducts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sync with Stripe
    const syncResults = await syncProductsToStripe(localProducts);

    // Update local records with Stripe IDs
    for (const created of syncResults.created) {
      await productsRef.doc(created.localId).update({
        stripeProductId: created.stripeProductId,
        stripePriceId: created.stripePriceId,
        synced_at: new Date().toISOString()
      });
    }

    res.json({
      synced: syncResults.synced.length,
      created: syncResults.created.length,
      errors: syncResults.errors.length,
      details: {
        synced: syncResults.synced,
        created: syncResults.created,
        errors: syncResults.errors
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /products/stripe/all
 * List all AI-created products in Stripe (admin view)
 */
router.get("/products/stripe/all", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const result = await listAIProducts();

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    const productsWithAnalytics = await Promise.all(
      result.products.map(async product => {
        const analytics = await getProductAnalytics(product.id);
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          active: product.active,
          metadata: product.metadata,
          analytics: analytics.success ? analytics : null
        };
      })
    );

    res.json({
      count: result.count,
      products: productsWithAnalytics
    });
  } catch (error) {
    next(error);
  }
});

export default router;
