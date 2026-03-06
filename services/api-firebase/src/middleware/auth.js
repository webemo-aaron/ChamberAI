import admin from "firebase-admin";
import { initFirebaseAdminApp, initFirestore } from "../db/firestore.js";
import { normalizeEmail, parseEnvInviteAllowedSenders } from "../services/invite_email.js";
import { orgCollection } from "../db/orgFirestore.js";

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
        role: mocked.role ?? "secretary"
      };
      req.orgId = mocked.orgId ?? process.env.DEFAULT_ORG_ID ?? "default";
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
    const orgId = decoded.orgId ?? process.env.DEFAULT_ORG_ID ?? "default";
    const email = normalizeEmail(decoded.email ?? demoEmail);
    const roleFromToken = decoded.role ?? "secretary";
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
            role: membership.role ?? roleFromToken
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
          role: "admin"
        };
        req.orgId = orgId;
        return next();
      }
      return res.status(403).json({ error: "User is not authorized for this chamber." });
    }
    req.user = {
      uid: decoded.uid,
      email,
      role: roleFromToken
    };
    req.orgId = orgId;
    return next();
  }

  // Dev fallback: no Firebase auth enabled
  req.user = { role: "secretary", email: demoEmail };
  req.orgId = process.env.DEFAULT_ORG_ID ?? "default";
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
