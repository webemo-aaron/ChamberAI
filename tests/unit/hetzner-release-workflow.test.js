import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

test("Hetzner release workflow scripts and defaults are wired into the hybrid deployment", () => {
  const packageJson = JSON.parse(read("package.json"));
  const envExample = read(".env.hybrid.example");
  const releaseScript = read("scripts/hetzner_release.sh");
  const preflightScript = read("scripts/hetzner_preflight.sh");
  const rollbackScript = read("scripts/hetzner_rollback.sh");
  const deployScript = read("scripts/deploy_hybrid_vps.sh");
  const imageVerifyScript = read("scripts/verify_api_image_integrity.sh");
  const verifyShowcaseScript = read("scripts/verify_showcase_data.sh");
  const auditScript = read("scripts/audit_showcase_data.mjs");
  const syncScript = read("scripts/sync_hetzner_release_workspace.sh");
  const syncManifest = read("scripts/lib/hetzner_release_sync_manifest.txt");
  const remoteDeployScript = read("scripts/remote_deploy.sh");
  const runbook = read("docs/HETZNER_MCP_OPERATIONS.md");

  assert.equal(packageJson.scripts["hetzner:preflight"], "./scripts/hetzner_preflight.sh .env.hybrid");
  assert.equal(packageJson.scripts["hetzner:release"], "./scripts/hetzner_release.sh .env.hybrid");
  assert.equal(packageJson.scripts["hetzner:rollback"], "./scripts/hetzner_rollback.sh .env.hybrid");

  assert.match(envExample, /HCLOUD_SERVER_ID=/);
  assert.match(envExample, /HCLOUD_FIREWALL_NAME=/);
  assert.match(envExample, /HCLOUD_SNAPSHOT_RETENTION=/);
  assert.match(envExample, /DEPLOY_MIN_DISK_FREE_MB=/);
  assert.match(envExample, /DEPLOY_MIN_MEMORY_FREE_MB=/);
  assert.match(envExample, /DEPLOY_STABILIZATION_SECONDS=/);

  assert.match(preflightScript, /hcloud server describe/);
  assert.match(preflightScript, /hcloud firewall describe/);
  assert.match(preflightScript, /DEPLOY_MIN_DISK_FREE_MB/);
  assert.match(preflightScript, /DEPLOY_MIN_MEMORY_FREE_MB/);

  assert.match(releaseScript, /backup_hybrid_data\.sh/);
  assert.match(releaseScript, /hetzner_snapshot\.sh/);
  assert.match(releaseScript, /deploy_hybrid_vps\.sh/);
  assert.match(releaseScript, /verify_hybrid_stack\.sh/);
  assert.match(releaseScript, /verify_showcase_data\.sh/);
  assert.match(releaseScript, /Showcase data verification failed/);
  assert.match(releaseScript, /DEPLOY_STABILIZATION_SECONDS/);

  // Verify showcase data verification is positioned after hybrid stack check
  const verifyHybridIndex = releaseScript.indexOf("verify_hybrid_stack.sh");
  const verifyShowcaseIndex = releaseScript.indexOf("verify_showcase_data.sh");
  assert(
    verifyHybridIndex < verifyShowcaseIndex,
    "showcase verification should come after hybrid stack verification"
  );

  assert.match(verifyShowcaseScript, /audit_showcase_data\.mjs/);
  assert.match(verifyShowcaseScript, /API_BASE/);
  assert.match(verifyShowcaseScript, /SHOWCASE_NAMESPACE/);
  assert.match(verifyShowcaseScript, /timeout.*audit/);

  assert.match(auditScript, /fetchJson.*\/geo-profiles/);
  assert.match(auditScript, /fetchJson.*\/geo-content-briefs/);
  assert.match(auditScript, /unexpected business: \$\{business\.id\}/);
  assert.match(auditScript, /process\.exit\(1\)/);

  assert.match(deployScript, /docker compose .* build --no-cache api/);
  assert.match(deployScript, /Build remaining hybrid stack images/);
  assert.match(deployScript, /verify_api_image_integrity\.sh/);
  assert.match(deployScript, /docker compose .* up -d/);
  assert.match(imageVerifyScript, /buildGeoProfile/);
  assert.match(imageVerifyScript, /buildGeoContentBrief/);
  assert.match(imageVerifyScript, /Missing default export in geo route module/);
  assert.match(syncScript, /Remote app dir: \$\{REMOTE_APP_DIR\}/);
  assert.match(syncScript, /tar czf -/);
  assert.match(syncManifest, /services\/api-firebase\/src/);
  assert.match(syncManifest, /apps\/secretary-console/);
  assert.match(syncManifest, /scripts\/sync_hetzner_release_workspace\.sh/);
  assert.match(syncManifest, /scripts\/remote_deploy\.sh/);
  assert.match(remoteDeployScript, /\/opt\/ChamberAI/);

  assert.match(rollbackScript, /restore_hybrid_data\.sh/);
  assert.match(rollbackScript, /ROLLBACK_MODE/);
  assert.match(rollbackScript, /snapshot/);

  assert.match(runbook, /MCP-first/);
  assert.match(runbook, /sync_hetzner_release_workspace\.sh/);
  assert.match(runbook, /preflight/);
  assert.match(runbook, /rollback/);
  assert.match(runbook, /snapshot/);
});
