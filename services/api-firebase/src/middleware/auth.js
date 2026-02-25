import admin from "firebase-admin";
import { initFirebaseAdminApp, initFirestore } from "../db/firestore.js";
import { normalizeEmail, parseEnvInviteAllowedSenders } from "../services/invite_email.js";

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
      return next();
    }
    try {
      initFirebaseAdminApp();
      const decoded = await admin.auth().verifyIdToken(token);
      const email = normalizeEmail(decoded.email ?? demoEmail);
      const roleFromToken = decoded.role ?? "secretary";
      const enforceMembership = process.env.FIREBASE_REQUIRE_MEMBERSHIP !== "false";
      const bootstrapAdmins = parseEnvInviteAllowedSenders(process.env.AUTH_BOOTSTRAP_ADMINS);

      if (enforceMembership) {
        const db = initFirestore();
        const membershipDoc = await db.collection("memberships").doc(email).get();
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
          return next();
        }
        if (bootstrapAdmins.includes(email)) {
          req.user = {
            uid: decoded.uid,
            email,
            role: "admin"
          };
          return next();
        }
        return res.status(403).json({ error: "User is not authorized for this chamber." });
      }
      req.user = {
        uid: decoded.uid,
        email,
        role: roleFromToken
      };
      return next();
    } catch (error) {
      return res.status(401).json({ error: "Invalid auth token" });
    }
  }

  req.user = { role: "secretary", email: demoEmail };
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
