import express from "express";
import Stripe from "stripe";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { orgCollection, orgRef } from "../db/orgFirestore.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

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
    [process.env.STRIPE_PRICE_NETWORK]: "network"
  }[priceId] ?? "free";
}

/**
 * POST /billing/checkout
 * Creates a Stripe Checkout session for the specified tier
 * Pricing:
 *   pro: $9/month (unlimited meetings + AI minutes)
 *   council: $149/month (DOCX + analytics + API)
 *   network: $399/month (multi-chamber + enterprise)
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
    // Set these in .env after creating products/prices in Stripe:
    // STRIPE_PRICE_PRO=price_... (for $9/month)
    // STRIPE_PRICE_COUNCIL=price_... (for $149/month)
    // STRIPE_PRICE_NETWORK=price_... (for $399/month)
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
    const db = initFirestore();
    const orgId = req.orgId ?? process.env.DEFAULT_ORG_ID ?? "default";

    // Get or create Stripe customer for this org
    const orgData = (await orgRef(db, orgId).get()).data() || {};
    let customerId = orgData.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user?.email || "admin@chamber.local",
        metadata: { orgId }
      });
      customerId = customer.id;
      await orgRef(db, orgId).set({ stripeCustomerId: customerId }, { merge: true });
    }

    const session = await stripe.checkout.sessions.create({
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
 * POST /billing/portal
 * Creates a Stripe Customer Portal session for managing subscription
 * @returns {url: string} - Stripe Portal URL
 */
router.post("/billing/portal", requireRole("admin"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const orgId = req.orgId ?? process.env.DEFAULT_ORG_ID ?? "default";
    const orgData = (await orgRef(db, orgId).get()).data() || {};
    const customerId = orgData.stripeCustomerId;

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
          const customerId = session.customer;
          const orgId = session.metadata?.orgId;

          // Resolve orgId if not in metadata (fallback lookup)
          const resolvedOrgId = orgId || (await orgIdFromCustomer(db, customerId)) || "default";

          // Fetch full subscription to get real period end
          const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
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
          await orgCollection(db, resolvedOrgId, "auditLogs").add({
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
            await orgCollection(db, orgId, "auditLogs").add({
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
