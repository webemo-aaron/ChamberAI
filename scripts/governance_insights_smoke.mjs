import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const API_BASE = process.env.API_BASE ?? "http://127.0.0.1:4000";
const ORG_ID = process.env.GOVERNANCE_SMOKE_ORG_ID ?? process.env.DEFAULT_ORG_ID ?? "";
const DEMO_EMAIL = process.env.GOVERNANCE_SMOKE_EMAIL ?? "admin@acme.com";
const CHECK_AI = process.env.GOVERNANCE_SMOKE_CHECK_AI === "true";
const FIREBASE_AUTH_MODE = process.env.GOVERNANCE_SMOKE_FIREBASE_AUTH === "true";
const FIREBASE_SERVICE_ACCOUNT_PATH =
  process.env.GOVERNANCE_SMOKE_FIREBASE_SERVICE_ACCOUNT_PATH ?? "";
const FIREBASE_WEB_API_KEY =
  process.env.GOVERNANCE_SMOKE_FIREBASE_WEB_API_KEY ??
  process.env.FIREBASE_WEB_API_KEY ??
  "";
const FIREBASE_ROLE = process.env.GOVERNANCE_SMOKE_ROLE ?? "admin";
const AUTH_TOKEN = await resolveAuthToken();

const headers = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  "x-demo-email": DEMO_EMAIL,
  "Content-Type": "application/json"
};

if (ORG_ID) {
  headers["X-Org-Id"] = ORG_ID;
}

const result = {
  api_base: API_BASE,
  org_id: ORG_ID || null,
  ai_enabled_check: CHECK_AI,
  anomalies: null,
  predictions: null,
  narrative: null
};

result.anomalies = await fetchJson("/analytics/anomalies");
assertAnomalies(result.anomalies);

result.predictions = await fetchJson("/analytics/predictions");
assertPredictions(result.predictions);

if (CHECK_AI) {
  result.narrative = await fetchJson("/analytics/narrative", "POST", {});
  assertNarrative(result.narrative);
}

console.log(JSON.stringify(result, null, 2));

async function resolveAuthToken() {
  if (!FIREBASE_AUTH_MODE) {
    return process.env.GOVERNANCE_SMOKE_TOKEN ?? process.env.AUTH_TOKEN ?? "demo-token";
  }

  if (!FIREBASE_SERVICE_ACCOUNT_PATH) {
    throw new Error(
      "GOVERNANCE_SMOKE_FIREBASE_SERVICE_ACCOUNT_PATH is required when GOVERNANCE_SMOKE_FIREBASE_AUTH=true."
    );
  }

  if (!FIREBASE_WEB_API_KEY) {
    throw new Error(
      "GOVERNANCE_SMOKE_FIREBASE_WEB_API_KEY is required when GOVERNANCE_SMOKE_FIREBASE_AUTH=true."
    );
  }

  const serviceRequire = createRequire(
    new URL("../services/api-firebase/package.json", import.meta.url)
  );
  const adminModule = serviceRequire("firebase-admin");
  const admin = adminModule.default ?? adminModule;
  const serviceAccount = JSON.parse(readFileSync(FIREBASE_SERVICE_ACCOUNT_PATH, "utf8"));

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
  }

  if (ORG_ID) {
    await admin
      .firestore()
      .doc(`organizations/${ORG_ID}/memberships/${DEMO_EMAIL}`)
      .set(
        {
          email: DEMO_EMAIL,
          role: FIREBASE_ROLE,
          status: "active",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );
  }

  const customToken = await admin.auth().createCustomToken(DEMO_EMAIL, {
    orgId: ORG_ID || undefined,
    role: FIREBASE_ROLE
  });

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_WEB_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token: customToken,
        returnSecureToken: true
      })
    }
  );

  const payload = await response.json();
  if (!response.ok || !payload.idToken) {
    throw new Error(
      `Firebase custom token exchange failed with ${response.status}: ${JSON.stringify(payload)}`
    );
  }

  return payload.idToken;
}

async function fetchJson(pathname, method = "GET", body) {
  const response = await fetch(`${API_BASE}${pathname}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new Error(`Invalid JSON from ${pathname}: ${text}`);
    }
  }

  if (!response.ok) {
    throw new Error(`${method} ${pathname} failed with ${response.status}: ${text}`);
  }

  return data;
}

function assertAnomalies(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Anomalies payload missing.");
  }
  if (typeof payload.total_months !== "number") {
    throw new Error("Anomalies payload missing total_months.");
  }
  if (!payload.anomalies_by_metric || typeof payload.anomalies_by_metric !== "object") {
    throw new Error("Anomalies payload missing anomalies_by_metric.");
  }
  if (!payload.summary || typeof payload.summary.anomaly_count !== "number") {
    throw new Error("Anomalies payload missing summary.anomaly_count.");
  }
}

function assertPredictions(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Predictions payload missing.");
  }
  if (typeof payload.based_on_months !== "number") {
    throw new Error("Predictions payload missing based_on_months.");
  }
  const meetingsHeld = payload.predictions?.meetings_held;
  if (!meetingsHeld) {
    throw new Error("Predictions payload missing meetings_held metric.");
  }
  if (typeof meetingsHeld.slope !== "number") {
    throw new Error("Predictions payload missing slope.");
  }
  if (typeof meetingsHeld.r_squared !== "number") {
    throw new Error("Predictions payload missing r_squared.");
  }
  if (!Array.isArray(meetingsHeld.next_3_months) || meetingsHeld.next_3_months.length !== 3) {
    throw new Error("Predictions payload missing 3 forecast months.");
  }
}

function assertNarrative(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Narrative payload missing.");
  }
  if (typeof payload.narrative !== "string" || payload.narrative.trim().length === 0) {
    throw new Error("Narrative payload missing narrative text.");
  }
  if (typeof payload.generated_at !== "string") {
    throw new Error("Narrative payload missing generated_at.");
  }
  if (typeof payload.model !== "string") {
    throw new Error("Narrative payload missing model.");
  }
}
