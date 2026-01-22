import admin from "firebase-admin";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const demoEmail = req.headers["x-demo-email"] ?? "guest@local";

  if (!authHeader.startsWith("Bearer ")) {
    req.user = { role: "guest", email: demoEmail };
    return next();
  }

  const token = authHeader.replace("Bearer ", "");

  if (process.env.FIREBASE_AUTH_ENABLED === "true") {
    try {
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
