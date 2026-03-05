import express from "express";
import Stripe from "stripe";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { requireRole } from "../middleware/rbac.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

/**
 * POST /billing/checkout
 * Creates a Stripe Checkout session for the specified tier
 * @body {tier: 'pro'|'council'|'network'} - Subscription tier
 * @returns {url: string} - Stripe Checkout URL
 */
router.post("/billing/checkout", requireRole("admin"), async (req, res, next) => {
  try {
    const { tier } = req.body;
    const validTiers = ["pro", "council", "network"];

    if (!validTiers.includes(tier)) {
      return res.status(400).json({ error: "Invalid tier. Must be pro, council, or network." });
    }

    // Map tiers to Stripe price IDs from environment
    const priceMap = {
      pro: process.env.STRIPE_PRICE_PRO,
      council: process.env.STRIPE_PRICE_COUNCIL,
      network: process.env.STRIPE_PRICE_NETWORK
    };

    const priceId = priceMap[tier];
    if (!priceId) {
      return res.status(500).json({ error: `Price ID not configured for ${tier} tier` });
    }

    const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appBaseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appBaseUrl}/billing/cancel`,
      metadata: {
        tier,
        chamber_email: req.user?.email || "unknown"
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /billing/status
 * Returns current subscription status and tier
 * @returns {tier, validUntil, stripeCustomerId, status}
 */
router.get("/billing/status", async (req, res, next) => {
  try {
    const db = initFirestore();
    const settingsDoc = await db.collection("settings").doc("system").get();
    const settings = settingsDoc.exists ? settingsDoc.data() : {};
    const subscription = settings.subscription ?? {};

    res.json({
      tier: subscription.tier || "free",
      stripeCustomerId: subscription.stripeCustomerId || null,
      validUntil: subscription.validUntil || null,
      status: subscription.status || "active"
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
    const db = initFirestore();
    const settingsDoc = await db.collection("settings").doc("system").get();
    const settings = settingsDoc.exists ? settingsDoc.data() : {};
    const customerId = settings.subscription?.stripeCustomerId;

    if (!customerId) {
      return res.status(400).json({ error: "No active Stripe subscription found" });
    }

    const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:5173";

    const portalSession = await stripe.billingPortal.sessions.create({
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
      const sig = req.headers["stripe-signature"] || "";
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        console.error("Webhook signature verification failed", { message: err.message });
        return res.status(400).json({ error: "Invalid webhook signature" });
      }

      const db = initFirestore();

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const tier = session.metadata?.tier || "free";
          const email = session.metadata?.chamber_email || "unknown";

          // Update subscription in settings
          await db.collection("settings").doc("system").set(
            {
              subscription: {
                tier,
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription,
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
                status: "active",
                updated_at: serverTimestamp()
              }
            },
            { merge: true }
          );

          // Log to audit
          await db.collection("auditLogs").add({
            event_type: "BILLING_SUBSCRIPTION_CREATED",
            actor: email,
            timestamp: serverTimestamp(),
            details: { tier, sessionId: session.id }
          });

          console.log(`Subscription created: tier=${tier}, customer=${session.customer}`);
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object;
          const tier = subscription.metadata?.tier || "free";

          await db.collection("settings").doc("system").set(
            {
              subscription: {
                tier,
                stripeCustomerId: subscription.customer,
                stripeSubscriptionId: subscription.id,
                status: subscription.status,
                updated_at: serverTimestamp()
              }
            },
            { merge: true }
          );

          console.log(`Subscription updated: id=${subscription.id}, status=${subscription.status}`);
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object;

          await db.collection("settings").doc("system").set(
            {
              subscription: {
                tier: "free",
                status: "canceled",
                updated_at: serverTimestamp()
              }
            },
            { merge: true }
          );

          console.log(`Subscription canceled: id=${subscription.id}`);
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
