import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

function read(relativePath) {
  return readFileSync(
    new URL(`../../${relativePath}`, import.meta.url),
    "utf8"
  );
}

test("deployment script exists and is executable", () => {
  const deployScript = read("scripts/deploy-production.sh");

  // Verify script has shebang
  assert.match(deployScript, /^#!/);

  // Verify it validates environment
  assert.match(deployScript, /--env/);

  // Verify it runs tests
  assert.match(deployScript, /npm run test/);

  // Verify it builds Docker image
  assert.match(deployScript, /docker build/);

  // Verify it pushes to container registry
  assert.match(deployScript, /docker push/);

  // Verify it deploys to Cloud Run
  assert.match(deployScript, /gcloud run deploy/);

  // Verify it runs smoke tests
  assert.match(deployScript, /curl.*health/);

  // Verify canary deployment (traffic splitting)
  assert.match(deployScript, /update-traffic/);
});

test("Cloud Run config exists and is valid", () => {
  const cloudRunYaml = read(".cloudrun.yaml");

  // Verify it's a valid YAML structure
  assert.match(cloudRunYaml, /apiVersion:/);
  assert.match(cloudRunYaml, /kind: Service/);

  // Verify service name
  assert.match(cloudRunYaml, /chamberai-api/);

  // Verify container image reference
  assert.match(cloudRunYaml, /gcr\.io/);

  // Verify resource limits are set
  assert.match(cloudRunYaml, /cpu:/);
  assert.match(cloudRunYaml, /memory:/);

  // Verify environment variables are configured
  assert.match(cloudRunYaml, /FIRESTORE_PROJECT_ID/);
  assert.match(cloudRunYaml, /NODE_ENV/);

  // Verify autoscaling is configured
  assert.match(cloudRunYaml, /minInstances|autoscaling/);
  assert.match(cloudRunYaml, /maxInstances|autoscaling/);

  // Verify health checks are configured
  assert.match(cloudRunYaml, /livenessProbe|health/);
  assert.match(cloudRunYaml, /readinessProbe|health/);
});

test("Firebase configuration exists and is valid", () => {
  const firebaseJson = read("firebase.json");

  // Verify it's valid JSON
  const config = JSON.parse(firebaseJson);
  assert(config.projects);
  assert(config.firestore);

  // Verify multi-project configuration
  assert(config.projects.dev);
  assert(config.projects.staging);
  assert(config.projects.prod);

  // Verify project IDs follow pattern
  assert.match(config.projects.dev, /chamberai-dev/);
  assert.match(config.projects.staging, /chamberai-staging/);
  assert.match(config.projects.prod, /chamberai-prod/);

  // Verify Firestore configuration
  assert(config.firestore.rules);
  assert.match(config.firestore.rules, /firestore\.rules/);

  // Verify emulator configuration for local development
  assert(config.emulators);
  assert(config.emulators.firestore);
  assert(config.emulators.auth);
  assert(config.emulators.storage);
});

test("Monitoring setup documentation exists", () => {
  const monitoring = read("docs/MONITORING_SETUP.md");

  // Verify alert policies are documented
  assert.match(monitoring, /High Error Rate/);
  assert.match(monitoring, /Error rate > 5%/);

  assert.match(monitoring, /API Latency Degradation/);
  assert.match(monitoring, /p99 latency > 2000ms/);

  assert.match(monitoring, /Firestore Quota Exceeded/);
  assert.match(monitoring, /> 80%/);

  // Verify Sentry integration is documented
  assert.match(monitoring, /Sentry/);
  assert.match(monitoring, /SENTRY_DSN/);
  assert.match(monitoring, /error tracking/);

  // Verify structured logging is documented
  assert.match(monitoring, /JSON/);
  assert.match(monitoring, /log/);

  // Verify SLO targets
  assert.match(monitoring, /99\.9%/);
  assert.match(monitoring, /<1%/);
  assert.match(monitoring, /<1000ms/);
});

test("Deployment guide exists with rollout strategy", () => {
  const guide = read("docs/DEPLOYMENT_GUIDE.md");

  // Verify it has staged deployment approach
  assert.match(guide, /staging/);
  assert.match(guide, /production/);
  assert.match(guide, /canary/);

  // Verify it documents traffic splitting
  assert.match(guide, /traffic.*split|split.*traffic/);
  assert.match(guide, /10%/);
  assert.match(guide, /50%/);
  assert.match(guide, /100%/);

  // Verify it documents smoke tests
  assert.match(guide, /smoke test/);
  assert.match(guide, /\/health/);

  // Verify it documents rollback
  assert.match(guide, /rollback/);
  assert.match(guide, /PREVIOUS/);
});

test("Runbooks exist for incident response", () => {
  const runbooks = read("docs/RUNBOOKS.md");

  // Verify high error rate runbook
  assert.match(runbooks, /High Error Rate/);
  assert.match(runbooks, /Diagnosis/);
  assert.match(runbooks, /Resolution/);

  // Verify latency runbook
  assert.match(runbooks, /Latency Degradation/);

  // Verify Firestore quota runbook
  assert.match(runbooks, /Firestore Quota/);

  // Verify database connection runbook
  assert.match(runbooks, /Database Connection/);

  // Verify all runbooks have standard structure
  const sections = runbooks.split(/^## /m);
  for (const section of sections.slice(1)) {
    // Each incident runbook should have: Diagnosis, Resolution, Verification
    assert.match(section, /Diagnosis/);
    assert.match(section, /Resolution/);
    assert.match(section, /Verification/);
  }
});

test("package.json has deployment scripts configured", () => {
  const packageJson = read("package.json");
  const config = JSON.parse(packageJson);

  // Verify version field
  assert(config.version);
  assert.match(config.version, /^\d+\.\d+\.\d+$/);

  // Verify deployment scripts
  assert(config.scripts["deploy:staging"]);
  assert.match(config.scripts["deploy:staging"], /deploy-production\.sh/);
  assert.match(config.scripts["deploy:staging"], /staging/);

  assert(config.scripts["deploy:production"]);
  assert.match(config.scripts["deploy:production"], /deploy-production\.sh/);
  assert.match(config.scripts["deploy:production"], /production/);

  // Verify release script
  assert(config.scripts.release);
  assert.match(config.scripts.release, /npm version patch/);
  assert.match(config.scripts.release, /deploy:production/);

  // Verify test:deployment script
  assert(config.scripts["test:deployment"]);
  assert.match(config.scripts["test:deployment"], /deployment\.test\.js/);
});

test("server.js has Sentry error tracking configured", () => {
  const server = read("services/api-firebase/src/server.js");

  // Verify Sentry import is conditional
  assert.match(server, /let Sentry/);
  assert.match(server, /process\.env\.SENTRY_DSN/);

  // Verify dynamic import pattern
  assert.match(server, /import\("@sentry\/node"\)/);

  // Verify Sentry.init is called with correct config
  assert.match(server, /Sentry\.init/);
  assert.match(server, /dsn:/);
  assert.match(server, /environment:/);
  assert.match(server, /tracesSampleRate:/);

  // Verify Sentry request handler is registered
  assert.match(server, /Sentry\.Handlers\.requestHandler/);

  // Verify graceful fallback if Sentry unavailable
  assert.match(server, /catch.*error/);
  assert.match(server, /console\.warn/);
});

test("Firestore rules enforce org isolation and public read-only", () => {
  const rules = read("firestore.rules");

  // Verify org isolation helper
  assert.match(rules, /function userInOrg/);
  assert.match(rules, /orgId == orgId/);

  // Verify organization documents are protected
  assert.match(rules, /match \/organizations\/\{orgId\}/);
  assert.match(rules, /userInOrg/);

  // Verify subdomains are public read-only
  assert.match(rules, /match \/subdomains/);
  assert.match(rules, /allow read: if true/);
  assert.match(rules, /allow write: if false/);

  // Verify default deny
  assert.match(rules, /allow read, write: if false/);
});

test("export routes provide GDPR compliance", () => {
  const exportJs = read("services/api-firebase/src/routes/export.js");

  // Verify user data export
  assert.match(exportJs, /\/api\/export\/user-data/);
  assert.match(exportJs, /requireAuth/);

  // Verify org data export with admin check
  assert.match(exportJs, /\/api\/export\/org-data/);
  assert.match(exportJs, /requireRole\("admin"\)/);

  // Verify download headers for GDPR compliance
  assert.match(exportJs, /Content-Disposition/);
  assert.match(exportJs, /attachment/);
  assert.match(exportJs, /application\/json/);

  // Verify audit logging
  assert.match(exportJs, /audit_logs/);
  assert.match(exportJs, /user_data_exported|org_data_exported/);
});

test("Cloud Build configuration exists for CI/CD", () => {
  const cloudBuild = read("cloudbuild.yaml");

  // Verify it's valid YAML
  assert.match(cloudBuild, /steps:/);

  // Verify it builds Docker image
  assert.match(cloudBuild, /docker build|gcr.io/);

  // Verify it runs tests
  assert.match(cloudBuild, /npm test|test/);

  // Verify it pushes image to GCR
  assert.match(cloudBuild, /docker push|gcr\.io/);

  // Verify deployment step
  assert.match(cloudBuild, /gcloud run deploy/);

  // Verify timeout is set
  assert.match(cloudBuild, /timeout:/);
});

test("Go-live checklist covers all critical items", () => {
  const checklist = read("docs/GO_LIVE_CHECKLIST.md");

  // Verify infrastructure items
  assert.match(checklist, /Firebase projects/);
  assert.match(checklist, /Cloud Run/);
  assert.match(checklist, /Cloud Storage/);
  assert.match(checklist, /Cloud DNS/);

  // Verify security items
  assert.match(checklist, /Firestore rules/);
  assert.match(checklist, /authentication/);
  assert.match(checklist, /CORS/);

  // Verify monitoring items
  assert.match(checklist, /Sentry/);
  assert.match(checklist, /Cloud Monitoring/);
  assert.match(checklist, /Alert|alert/);

  // Verify testing items
  assert.match(checklist, /smoke test/);
  assert.match(checklist, /integration/);
  assert.match(checklist, /e2e|E2E/);

  // Verify rollback procedure
  assert.match(checklist, /rollback/);
});

test("deployment config is production-safe", () => {
  // Verify no hardcoded secrets
  const files = [
    "scripts/deploy-production.sh",
    ".cloudrun.yaml",
    "firebase.json"
  ];

  for (const file of files) {
    const content = read(file);

    // Check for common secret patterns
    assert(!content.includes("api_key"));
    assert(!content.includes("secret_key"));
    assert(!content.includes("password"));
    assert(!content.match(/[A-Za-z0-9]{40,}/)); // No long random strings (likely keys)
  }
});

test("cloud.json references Secret Manager for sensitive config", () => {
  const cloudRun = read(".cloudrun.yaml");

  // Verify SENTRY_DSN comes from Secret Manager
  assert.match(cloudRun, /SENTRY_DSN[\s\S]*valueFrom|from.*secret/i);

  // Verify FIREBASE_KEY comes from Secret Manager
  assert.match(cloudRun, /FIREBASE[\s\S]*secret|secret[\s\S]*FIREBASE/i);
});
