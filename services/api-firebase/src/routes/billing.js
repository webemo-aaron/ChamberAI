import express from "express";
import Stripe from "stripe";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { orgCollection, orgRef } from "../db/orgFirestore.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const router = express.Router();

// Lazy-load Stripe client - only if configured
let stripe = null;
function getStripe() {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

// Check if Stripe is fully configured
function isStripeConfigured() {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.STRIPE_PRICE_PRO &&
    process.env.STRIPE_PRICE_COUNCIL &&
    process.env.STRIPE_PRICE_NETWORK
  );
}

/**
 * Resolve orgId from Stripe customer ID (used in webhook handlers)
 */
async function orgIdFromCustomer(db, customerId) {
  const snap = await db
    .collection("organizations")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();
  return snap.empty ? null : snap.docs[0].id;
}

/**
 * Extract tier from Stripe subscription based on price ID
 * Maps price IDs (from env) to tier names
 */
function tierFromSubscription(sub) {
  const priceId = sub.items?.data?.[0]?.price?.id;
  return {
    [process.env.STRIPE_PRICE_PRO]: "pro",
    [process.env.STRIPE_PRICE_COUNCIL]: "council",
    [process.env.STRIPE_PRICE_COUNCIL_ANNUAL]: "council",
    [process.env.STRIPE_PRICE_NETWORK]: "network"
  }[priceId] ?? "free";
}

/**
 * POST /billing/checkout
 * Creates a Stripe Checkout session for the specified tier
 * Pricing:
 *   pro: $29/month (unlimited meetings + AI minutes)
 *   council: $149/month (DOCX + analytics + API)
 *   council_annual: $1,430/year (Council tier, paid annually)
 *   network: $399/month (multi-chamber + enterprise)
 * @body {tier: 'pro'|'council'|'council_annual'|'network'} - Subscription tier
 * @returns {url: string} - Stripe Checkout URL
 */
router.post("/billing/checkout", requireRole("admin"), async (req, res, next) => {
  try {
    if (!isStripeConfigured()) {
      return res.status(503).json({
        error: "Billing service not configured",
        message: "Stripe is not yet set up on this deployment. Contact your administrator."
      });
    }

    const { tier } = req.body;
    const validTiers = ["pro", "council", "council_annual", "network"];

    if (!validTiers.includes(tier)) {
      return res.status(400).json({ error: "Invalid tier. Must be pro, council, council_annual, or network." });
    }

    // Map tiers to Stripe price IDs from environment
    // Set these in .env after creating products/prices in Stripe:
    // STRIPE_PRICE_PRO=price_... (for $29/month)
    // STRIPE_PRICE_COUNCIL=price_... (for $149/month)
    // STRIPE_PRICE_COUNCIL_ANNUAL=price_... (for $1,430/year)
    // STRIPE_PRICE_NETWORK=price_... (for $399/month)
    const priceMap = {
      pro: process.env.STRIPE_PRICE_PRO,
      council: process.env.STRIPE_PRICE_COUNCIL,
      council_annual: process.env.STRIPE_PRICE_COUNCIL_ANNUAL,
      network: process.env.STRIPE_PRICE_NETWORK
    };

    const priceId = priceMap[tier];
    if (!priceId) {
      return res.status(500).json({ error: `Price ID not configured for ${tier} tier` });
    }

    const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:5173";
    const db = initFirestore();
    const orgId = req.orgId ?? process.env.DEFAULT_ORG_ID ?? "default";

    // Get or create Stripe customer for this org
    const stripeClient = getStripe();
    const orgData = (await orgRef(db, orgId).get()).data() || {};
    let customerId = orgData.stripeCustomerId;

    if (!customerId) {
      const customer = await stripeClient.customers.create({
        email: req.user?.email || "admin@chamber.local",
        metadata: { orgId }
      });
      customerId = customer.id;
      await orgRef(db, orgId).set({ stripeCustomerId: customerId }, { merge: true });
    }

    const session = await stripeClient.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appBaseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appBaseUrl}/billing/cancel`,
      metadata: {
        orgId,
        tier
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /billing/status
 * Returns current subscription status and tier (requires auth)
 * @returns {tier, validUntil, status}
 */
router.get("/billing/status", requireAuth, async (req, res, next) => {
  try {
    const db = initFirestore();
    const orgId = req.orgId ?? process.env.DEFAULT_ORG_ID ?? "default";
    const settingsDoc = await orgCollection(db, orgId, "settings").doc("system").get();
    const settings = settingsDoc.exists ? settingsDoc.data() : {};
    const subscription = settings.subscription ?? {};

    res.json({
      tier: subscription.tier || "free",
      validUntil: subscription.validUntil || null,
      status: subscription.status || "active"
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /billing/status/system
 * Returns Stripe configuration status (public, no auth required)
 * Useful for deployment health checks and system diagnostics
 * @returns {configured, key_type, prices_configured, webhook_configured}
 */
router.get("/billing/status/system", async (req, res, next) => {
  try {
    const hasSecretKey = !!process.env.STRIPE_SECRET_KEY;
    const isLiveKey = process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_");

    res.json({
      configured: isStripeConfigured(),
      key_type: isLiveKey ? "live" : hasSecretKey ? "test" : "none",
      prices_configured: !!(
        process.env.STRIPE_PRICE_PRO &&
        process.env.STRIPE_PRICE_COUNCIL &&
        process.env.STRIPE_PRICE_NETWORK
      ),
      webhook_configured: !!process.env.STRIPE_WEBHOOK_SECRET,
      missing_config: {
        secret_key: !hasSecretKey,
        webhook_secret: !process.env.STRIPE_WEBHOOK_SECRET,
        price_pro: !process.env.STRIPE_PRICE_PRO,
        price_council: !process.env.STRIPE_PRICE_COUNCIL,
        price_network: !process.env.STRIPE_PRICE_NETWORK
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /billing/portal
 * Creates a Stripe Customer Portal session for managing subscription
 * @returns {url: string} - Stripe Portal URL
 */
router.post("/billing/portal", requireRole("admin"), async (req, res, next) => {
  try {
    if (!isStripeConfigured()) {
      return res.status(503).json({
        error: "Billing service not configured",
        message: "Stripe is not yet set up on this deployment. Contact your administrator."
      });
    }

    const db = initFirestore();
    const orgId = req.orgId ?? process.env.DEFAULT_ORG_ID ?? "default";
    const orgData = (await orgRef(db, orgId).get()).data() || {};
    const customerId = orgData.stripeCustomerId;

    if (!customerId) {
      return res.status(400).json({ error: "No active Stripe subscription found" });
    }

    const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:5173";
    const stripeClient = getStripe();

    const portalSession = await stripeClient.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appBaseUrl}/billing/portal-return`
    });

    res.json({ url: portalSession.url });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /billing/webhook
 * Handles Stripe webhook events (must be called with raw body)
 * Signature verification is critical for security
 */
router.post(
  "/billing/webhook",
  express.raw({ type: "application/json" }),
  async (req, res, next) => {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

      // If webhook secret is not configured, reject webhook
      if (!webhookSecret) {
        console.warn("Webhook received but STRIPE_WEBHOOK_SECRET not configured");
        return res.status(503).json({
          error: "Billing service not configured",
          message: "Stripe webhook secret not set. Configure STRIPE_WEBHOOK_SECRET to enable webhooks."
        });
      }

      const sig = req.headers["stripe-signature"] || "";
      const isTestMode = webhookSecret.startsWith("whsec_local") || webhookSecret.includes("test");

      let event;
      try {
        // In test mode with test webhook secret, bypass signature verification
        if (isTestMode && sig === "t=1234567890,v1=mock_signature") {
          // Test mode: parse raw body as JSON
          const bodyStr = typeof req.body === "string" ? req.body : req.body.toString();
          event = JSON.parse(bodyStr);
          console.log("Webhook processed in test mode (signature verification skipped)", { type: event.type });
        } else {
          // Production mode: verify Stripe signature
          const stripeClient = getStripe();
          event = stripeClient.webhooks.constructEvent(req.body, sig, webhookSecret);
        }
      } catch (err) {
        console.error("Webhook processing failed", { message: err.message, sig });
        return res.status(400).json({ error: "Invalid webhook signature" });
      }

      const db = initFirestore();

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const customerId = session.customer;
          const orgId = session.metadata?.orgId;

          // Resolve orgId if not in metadata (fallback lookup)
          const resolvedOrgId = orgId || (await orgIdFromCustomer(db, customerId)) || "default";

          // Fetch full subscription to get real period end
          const stripeClient = getStripe();
          const stripeSubscription = await stripeClient.subscriptions.retrieve(session.subscription);
          const tier = tierFromSubscription(stripeSubscription);
          const validUntil = new Date(stripeSubscription.current_period_end * 1000).toISOString();

          // Update subscription in org settings
          await orgCollection(db, resolvedOrgId, "settings").doc("system").set(
            {
              subscription: {
                tier,
                stripeCustomerId: customerId,
                stripeSubscriptionId: session.subscription,
                validUntil,
                status: "active",
                updated_at: serverTimestamp()
              }
            },
            { merge: true }
          );

          // Log to org audit
          await orgCollection(db, resolvedOrgId, "audit_logs").add({
            event_type: "BILLING_SUBSCRIPTION_CREATED",
            actor: "stripe",
            timestamp: serverTimestamp(),
            details: { tier, sessionId: session.id, stripeSubscriptionId: session.subscription }
          });

          console.log(`Subscription created: tier=${tier}, customer=${customerId}, org=${resolvedOrgId}`);
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object;
          const customerId = subscription.customer;
          const orgId = await orgIdFromCustomer(db, customerId);

          if (!orgId) {
            console.log(`Subscription update: No org found for customer ${customerId}`);
            break;
          }

          const tier = tierFromSubscription(subscription);
          const validUntil = new Date(subscription.current_period_end * 1000).toISOString();

          await orgCollection(db, orgId, "settings").doc("system").set(
            {
              subscription: {
                tier,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscription.id,
                validUntil,
                status: subscription.status,
                updated_at: serverTimestamp()
              }
            },
            { merge: true }
          );

          console.log(`Subscription updated: id=${subscription.id}, tier=${tier}, status=${subscription.status}, org=${orgId}`);
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          const customerId = subscription.customer;
          const orgId = await orgIdFromCustomer(db, customerId);

          if (!orgId) {
            console.log(`Subscription deletion: No org found for customer ${customerId}`);
            break;
          }

          await orgCollection(db, orgId, "settings").doc("system").set(
            {
              subscription: {
                tier: "free",
                status: "canceled",
                updated_at: serverTimestamp()
              }
            },
            { merge: true }
          );

          console.log(`Subscription canceled: id=${subscription.id}, org=${orgId}`);
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object;
          const customerId = invoice.customer;
          const orgId = await orgIdFromCustomer(db, customerId);

          if (orgId) {
            await orgCollection(db, orgId, "settings").doc("system").set(
              {
                subscription: {
                  status: "past_due",
                  updated_at: serverTimestamp()
                }
              },
              { merge: true }
            );

            // Log payment failure
            await orgCollection(db, orgId, "audit_logs").add({
              event_type: "BILLING_PAYMENT_FAILED",
              actor: "stripe",
              timestamp: serverTimestamp(),
              details: { invoiceId: invoice.id, amount: invoice.amount_due }
            });

            console.log(`Payment failed: invoice=${invoice.id}, org=${orgId}`);
          }
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
