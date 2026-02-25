import admin from "firebase-admin";
import { initFirebaseAdminApp } from "../db/firestore.js";

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
      req.user = {
        uid: decoded.uid,
        email: decoded.email ?? demoEmail,
        role: decoded.role ?? "secretary"
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
