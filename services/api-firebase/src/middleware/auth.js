import admin from "firebase-admin";
import { initFirebaseAdminApp, initFirestore, serverTimestamp } from "../db/firestore.js";
import { normalizeEmail, parseEnvInviteAllowedSenders } from "../services/invite_email.js";
import { orgCollection, resolveOrgId } from "../db/orgFirestore.js";
import {
  getSsoConfig,
  shouldAutoProvision,
  provisionSsoMember
} from "../utils/sso-provisioning.js";

/**
 * Resolve orgId from subdomain slug
 * Looks up subdomains/{slug} → { orgId }
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} host - Host header (e.g., "portland.chamberai.com")
 * @returns {Promise<string|null>} - orgId or null if not found
 */
async function resolveOrgFromSubdomain(db, host) {
  const slug = host?.split(".")[0];
  if (!slug || slug === "www" || slug === "localhost") {
    return null;
  }
  try {
    const doc = await db.collection("subdomains").doc(slug).get();
    return doc.exists ? doc.data()?.orgId : null;
  } catch (error) {
    console.error("Subdomain lookup failed:", error.message);
    return null;
  }
}

/**
 * Middleware for unauthenticated routes (public kiosk)
 * Resolves orgId from subdomain, sets req.publicOrgId
 */
export async function resolvePublicOrg(req, res, next) {
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const db = initFirestore();
  const orgId = await resolveOrgFromSubdomain(db, host);
  req.publicOrgId = orgId; // may be null
  next();
}

/**
 * Middleware to enforce org isolation
 * Ensures authenticated requests cannot access orgs other than their own
 * Call after requireAuth to protect routes
 */
export function enforceOrgIsolation(req, res, next) {
  if (!req.orgId || !req.user) {
    return next(); // Public endpoint
  }

  // Check if request targets a specific org that differs from the user's org
  const requestOrgId = req.params.orgId || req.query.orgId;
  if (requestOrgId && requestOrgId !== req.orgId) {
    return res.status(403).json({
      error: "Not authorized for this organization",
      message: "Your authentication token is for a different organization"
    });
  }

  next();
}

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const demoEmail = req.headers["x-demo-email"] ?? "guest@local";

  if (!authHeader.startsWith("Bearer ")) {
    req.user = { role: "guest", email: demoEmail };
    return next();
  }

  const token = authHeader.replace("Bearer ", "");

  if (process.env.FIREBASE_AUTH_ENABLED === "true") {
    const mockedUsers = parseMockedUsers(process.env.FIREBASE_AUTH_MOCK_TOKENS);
    if (mockedUsers && mockedUsers[token]) {
      const mocked = mockedUsers[token];
      req.user = {
        uid: mocked.uid ?? "mocked-user",
        email: mocked.email ?? demoEmail,
        role: mocked.role ?? "secretary",
        tier: mocked.tier ?? null
      };
      req.orgId = resolveOrgId(mocked.orgId);
      return next();
    }
    let decoded;
    try {
      initFirebaseAdminApp();
      decoded = await admin.auth().verifyIdToken(token);
    } catch (error) {
      console.error("Firebase token verification failed", {
        code: error?.code ?? null,
        message: error?.message ?? null
      });
      return res.status(401).json({ error: "Invalid auth token", code: error?.code ?? undefined });
    }

    // Extract orgId from custom claims, fallback to DEFAULT_ORG_ID env var
    const orgId = resolveOrgId(decoded.orgId);
    const email = normalizeEmail(decoded.email ?? demoEmail);
    const roleFromToken = decoded.role ?? "secretary";
    const ssoProvider = decoded.firebase?.sign_in_provider || null;
    const enforceMembership = process.env.FIREBASE_REQUIRE_MEMBERSHIP !== "false";
    const bootstrapAdmins = parseEnvInviteAllowedSenders(process.env.AUTH_BOOTSTRAP_ADMINS);

    if (enforceMembership) {
      try {
        const db = initFirestore();
        const membershipDoc = await orgCollection(db, orgId, "memberships").doc(email).get();
        if (membershipDoc.exists) {
          const membership = membershipDoc.data() ?? {};
          const status = String(membership.status ?? "active");
          if (status !== "active") {
            return res.status(403).json({ error: "User account is disabled." });
          }
          req.user = {
            uid: decoded.uid,
            email,
            role: membership.role ?? roleFromToken,
            ssoProvider
          };
          req.orgId = orgId;
          return next();
        }
      } catch (error) {
        console.error("Membership lookup failed", {
          code: error?.code ?? null,
          message: error?.message ?? null
        });
        return res.status(500).json({ error: "Membership lookup failed." });
      }

      if (bootstrapAdmins.includes(email)) {
        req.user = {
          uid: decoded.uid,
          email,
          role: "admin",
          ssoProvider
        };
        req.orgId = orgId;
        return next();
      }

      // JIT provisioning for SSO users with allowed domains
      if (ssoProvider) {
        try {
          const db = initFirestore();
          const ssoConfig = await getSsoConfig(db, orgId);

          if (ssoConfig?.enabled && shouldAutoProvision(email, ssoConfig.allowedDomains)) {
            const role = ssoConfig.autoProvisionRole ?? "viewer";
            await provisionSsoMember(db, orgId, email, role, ssoProvider);

            req.user = {
              uid: decoded.uid,
              email,
              role,
              ssoProvider
            };
            req.orgId = orgId;
            return next();
          }
        } catch (error) {
          console.error("JIT provisioning failed", {
            code: error?.code ?? null,
            message: error?.message ?? null
          });
        }
      }

      return res.status(403).json({ error: "User is not authorized for this chamber." });
    }
    req.user = {
      uid: decoded.uid,
      email,
      role: roleFromToken,
      ssoProvider
    };
    req.orgId = orgId;
    return next();
  }

  // Dev fallback: no Firebase auth enabled
  req.user = { role: "secretary", email: demoEmail };
  req.orgId = resolveOrgId();
  return next();
}

function parseMockedUsers(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
