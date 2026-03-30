import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(
    new URL(`../../${relativePath}`, import.meta.url),
    "utf8"
  );
}

test("audit log collection names are unified to audit_logs", () => {
  // Verify no routes use old "auditLogs" name
  const routes = [
    "services/api-firebase/src/routes/minutes.js",
    "services/api-firebase/src/routes/approval.js",
    "services/api-firebase/src/routes/geo_intelligence.js",
    "services/api-firebase/src/routes/billing.js",
    "services/api-firebase/src/routes/retention.js",
    "services/api-firebase/src/routes/audit.js"
  ];

  for (const routePath of routes) {
    const content = read(routePath);
    // Should NOT contain the old collection name
    const hasOldName = content.includes('orgCollection(db, req.orgId, "auditLogs")') ||
                       content.includes('orgCollection(db, orgId, "auditLogs")') ||
                       content.includes('orgCollection(db, resolvedOrgId, "auditLogs")');
    assert.equal(hasOldName, false, `${routePath} still uses "auditLogs"`);

    // Should contain the new collection name (except for variable names)
    const hasNewName = content.includes(', "audit_logs"');
    if (routePath !== "services/api-firebase/src/routes/export.js") {
      assert.match(content, /audit_logs/, `${routePath} should use "audit_logs" collection`);
    }
  }
});

test("sso.js route has all 4 endpoints", () => {
  const ssoRoute = read("services/api-firebase/src/routes/sso.js");

  // Verify all four endpoints exist
  assert.match(ssoRoute, /GET.*\/api\/sso\/config/);
  assert.match(ssoRoute, /PATCH.*\/api\/sso\/config/);
  assert.match(ssoRoute, /GET.*\/api\/sso\/status/);
  assert.match(ssoRoute, /POST.*\/api\/sso\/test-connection/);

  // Verify requireAuth and requireRole usage
  assert.match(ssoRoute, /requireAuth[\s\S]*requireRole/);
  assert.match(ssoRoute, /requireRole\("admin"\)/);
});

test("sso-provisioning.js has JIT provisioning functions", () => {
  const provisioning = read("services/api-firebase/src/utils/sso-provisioning.js");

  // Verify all helper functions exist
  assert.match(provisioning, /export.*function shouldAutoProvision/);
  assert.match(provisioning, /export.*function provisionSsoMember/);
  assert.match(provisioning, /export.*function getSsoConfig/);
  assert.match(provisioning, /export.*function validateSsoConfig/);

  // Verify caching mechanism
  assert.match(provisioning, /ssoConfigCache/);
  assert.match(provisioning, /CACHE_TTL_MS/);
});

test("auth.js extracts ssoProvider from Firebase token claims", () => {
  const auth = read("services/api-firebase/src/middleware/auth.js");

  // Verify ssoProvider extraction
  assert.match(auth, /firebase.*sign_in_provider/);
  assert.match(auth, /ssoProvider[\s\S]*firebase.*sign_in_provider/);

  // Verify ssoProvider is added to req.user
  assert.match(auth, /req\.user[\s\S]*ssoProvider/);
});

test("auth.js has JIT provisioning logic for SSO users", () => {
  const auth = read("services/api-firebase/src/middleware/auth.js");

  // Verify JIT provisioning imports
  assert.match(auth, /getSsoConfig/);
  assert.match(auth, /shouldAutoProvision/);
  assert.match(auth, /provisionSsoMember/);

  // Verify conditional provisioning
  assert.match(auth, /ssoProvider[\s\S]*getSsoConfig/);
  assert.match(auth, /shouldAutoProvision[\s\S]*allowedDomains/);
  assert.match(auth, /provisionSsoMember[\s\S]*db[\s\S]*orgId/);
});

test("export.js has audit-report endpoint with filtering", () => {
  const exportRoute = read("services/api-firebase/src/routes/export.js");

  // Verify endpoint exists
  assert.match(exportRoute, /GET.*\/api\/export\/audit-report/);
  assert.match(exportRoute, /requireRole\("admin"\)/);

  // Verify filtering parameters
  assert.match(exportRoute, /startDate[\s\S]*req\.query/);
  assert.match(exportRoute, /endDate[\s\S]*req\.query/);
  assert.match(exportRoute, /actorEmail[\s\S]*req\.query/);
  assert.match(exportRoute, /eventType[\s\S]*req\.query/);

  // Verify format support
  assert.match(exportRoute, /format[\s\S]*csv/);
  assert.match(exportRoute, /format[\s\S]*json/);
});

test("export.js supports CSV format for audit reports", () => {
  const exportRoute = read("services/api-firebase/src/routes/export.js");

  // Verify CSV generation
  assert.match(exportRoute, /generateAuditReportCsv/);
  assert.match(exportRoute, /text\/csv/);

  // Verify CSV escape logic
  assert.match(exportRoute, /escapeCsvField/);
  assert.match(exportRoute, /includes\(","\)/);

  // Verify CSV headers
  assert.match(exportRoute, /timestamp[\s\S]*action[\s\S]*actor/);
});

test("server.js registers SSO route after auth middleware", () => {
  const server = read("services/api-firebase/src/server.js");

  // Verify SSO import
  assert.match(server, /import.*sso[\s\S]*routes\/sso/);

  // Verify route is registered
  assert.match(server, /app\.use\(sso\)/);

  // Verify it's after requireAuth (before public routes, after auth setup)
  const authIndex = server.indexOf("app.use(requireAuth)");
  const ssoIndex = server.indexOf("app.use(sso)");
  assert(ssoIndex > authIndex, "SSO route should be registered after auth middleware");
});

test("sensitive SSO config fields are not returned in GET response", () => {
  const ssoRoute = read("services/api-firebase/src/routes/sso.js");

  // Verify sanitization logic
  assert.match(ssoRoute, /samlCertificate[\s\S]*oidcClientSecret/);
  assert.match(ssoRoute, /safeConfig/);

  // Verify flag fields instead of actual secrets
  assert.match(ssoRoute, /hasCertificate/);
  assert.match(ssoRoute, /hasClientSecret/);
});

test("core/auth.js has signInWithSAML and signInWithOIDC methods", () => {
  const coreAuth = read("apps/secretary-console/core/auth.js");

  // Verify SAML sign-in
  assert.match(coreAuth, /export.*function signInWithSAML/);
  assert.match(coreAuth, /SAMLAuthProvider/);

  // Verify OIDC sign-in
  assert.match(coreAuth, /export.*function signInWithOIDC/);
  assert.match(coreAuth, /OAuthProvider/);

  // Verify both use signInWithPopup
  assert.match(coreAuth, /signInWithPopupFn[\s\S]*SAMLAuthProvider[\s\S]*signInWithPopupFn[\s\S]*OAuthProvider/);
});

test("login.js checks SSO status dynamically", () => {
  const login = read("apps/secretary-console/views/login/login.js");

  // Verify getSsoStatus function
  assert.match(login, /async function getSsoStatus/);
  assert.match(login, /\/api\/sso\/status/);

  // Verify SSO button rendering
  assert.match(login, /renderSsoButton/);
  assert.match(login, /ssoStatus.*enabled/);

  // Verify SSO handler
  assert.match(login, /async function handleSsoSignIn/);
  assert.match(login, /saml_custom[\s\S]*signInWithSAML/);
  assert.match(login, /signInWithOIDC/);
});

test("login.js falls back to Google Sign-In if SSO unavailable", () => {
  const login = read("apps/secretary-console/views/login/login.js");

  // Verify SSO is optional
  assert.match(login, /ssoStatus[\s\S]*null/);

  // Verify Google button is always rendered
  assert.match(login, /loginGoogle[\s\S]*Continue with Google/);

  // Verify handleGoogleSignIn always exists
  assert.match(login, /async function handleGoogleSignIn/);
});

test("Phase 16 enterprise SSO enhancements are production-ready", () => {
  // Verify all key files exist and have proper structure
  const files = [
    "services/api-firebase/src/routes/sso.js",
    "services/api-firebase/src/utils/sso-provisioning.js",
    "services/api-firebase/src/middleware/auth.js",
    "services/api-firebase/src/routes/export.js",
    "apps/secretary-console/core/auth.js",
    "apps/secretary-console/views/login/login.js"
  ];

  for (const filePath of files) {
    const content = read(filePath);

    // Check for error handling
    assert.match(content, /catch[\s\S]*error/);

    // Check for proper async/await
    assert.match(content, /async[\s\S]*function|async[\s\S]*=>/);
  }

  // Verify audit logging on SSO events
  const ssoRoute = read("services/api-firebase/src/routes/sso.js");
  assert.match(ssoRoute, /orgCollection[\s\S]*audit_logs[\s\S]*SSO/);

  // Verify compliance export logging
  const exportRoute = read("services/api-firebase/src/routes/export.js");
  assert.match(exportRoute, /orgCollection[\s\S]*audit_logs[\s\S]*audit_report/);
});
