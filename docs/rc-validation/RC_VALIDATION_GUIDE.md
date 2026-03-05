# ChamberAI RC Validation Guide

**Target Release**: v1.0.0 (Free Tier Open Source)
**Status**: Ready for Comprehensive Validation
**Current Commit**: `d644161` - Harden accessibility and stabilize critical e2e release gate
**Date**: 2026-03-04

---

## Overview

This guide provides step-by-step instructions to validate ChamberAI for release candidate (RC) status. The validation confirms:

✅ All systems production-ready
✅ All tests passing
✅ Rollback procedures verified
✅ Documentation accurate
✅ No security issues
✅ Evidence bundle generated and checksummed

---

## Phase 1: Environment Setup (5 mins)

### 1.1 Verify Prerequisites
```bash
# Check Node.js version (need v18+)
node --version

# Check Docker & Docker Compose
docker --version
docker-compose --version

# Verify Java for Firebase emulator
java -version

# Verify npm dependencies are installed
npm ls firebase 2>/dev/null | head -5
```

### 1.2 Prepare Workspace
```bash
# Create artifacts directory for evidence
mkdir -p artifacts/{release-gate,rollback-drill,release-evidence}

# Ensure git is clean (no uncommitted changes)
git status

# Stash any uncommitted changes if needed
# git stash
```

### 1.3 Check Current Version
```bash
# View current version in package.json
grep '"version"' package.json

# Check CHANGELOG for latest entry
head -20 CHANGELOG.md
```

---

## Phase 2: Pre-Release Checks (10 mins)

### 2.1 Dependencies Security Audit
```bash
# Check for vulnerable dependencies
npm audit

# If issues found, document in artifacts/security-audit-findings.txt
```

**Expected Result**: ✅ No high/critical vulnerabilities
**If Issues**: Document exceptions and remediation plan

---

### 2.2 Secrets & Credentials Check
```bash
# Verify no secrets committed
bash scripts/check_no_secrets.sh

# Manual spot check for common patterns
grep -r "FIREBASE_KEY\|API_KEY\|SECRET\|PASSWORD" \
  --include="*.js" \
  --include="*.ts" \
  services/ \
  tests/ | grep -v ".example" | grep -v "test" | head -10
```

**Expected Result**: ✅ No findings or only test fixtures
**If Issues**: Remove secrets immediately and update `.gitignore`

---

### 2.3 Docker Image Verification
```bash
# Build API and Worker Docker images
docker build -t chamberofcommerceai-api:rc services/api-firebase/
docker build -t chamberofcommerceai-worker:rc services/worker-firebase/

# Check image sizes
docker images | grep chamberofcommerceai

# Verify images exist
docker inspect chamberofcommerceai-api:rc >/dev/null && echo "✅ API image OK"
docker inspect chamberofcommerceai-worker:rc >/dev/null && echo "✅ Worker image OK"
```

**Expected Result**: ✅ Both images ~439MB and buildable
**If Issues**: Check Dockerfile build logs

---

## Phase 3: Test Suite Validation (30-45 mins)

### 3.1 Unit Tests
```bash
# Run all unit tests with coverage
npm run test:unit:coverage

# Expected: All tests passing
# Acceptable: 85%+ coverage
```

**Expected Result**: ✅ All unit tests passing
**Artifacts**: Coverage report generated
**If Issues**: Fix failing tests before proceeding

---

### 3.2 Contract Tests (API Compliance)
```bash
# Run API contract tests
npm run test:contracts

# These validate API responses match expected schemas
```

**Expected Result**: ✅ All contract tests passing
**If Issues**: API schema mismatch requires remediation

---

### 3.3 E2E Critical Path Tests
```bash
# Run only critical path tests (quick validation)
npm run test:e2e:critical

# Should test core workflows: create meeting -> draft -> approve
```

**Expected Result**: ✅ All critical tests passing
**If Issues**: Check for timing issues, increase waits if needed

---

### 3.4 Full E2E Test Suite
```bash
# Run complete E2E test suite
npm run test:e2e

# This validates entire user workflows
# Expected: 35+ tests, aim for 100% pass rate
```

**Expected Result**: ✅ 95%+ of tests passing (0 critical failures)
**Known Issues**: Document any intermittent/flaky tests
**If Issues**: Investigate and either fix or document as known limitation

---

### 3.5 Console Warning Regression Check
```bash
# Track console warnings/errors in E2E tests
npm run test:console-guard-trend

# This generates warning trend report
npm run test:console-guard-regression

# Verify no regression from baseline
```

**Expected Result**: ✅ No new console errors introduced
**Artifacts**: `artifacts/console-guard-warning-trend.json`

---

## Phase 4: Release Gate Automation (10 mins)

### 4.1 Run Release Gate
```bash
# Execute comprehensive release gate
npm run test:release-gate

# This runs:
# - Health checks
# - Config validation
# - Dependency checks
# - Test quality thresholds
# - Metrics thresholds
```

**Expected Result**: ✅ Release gate PASS
**Artifacts**: `artifacts/release-gate-report.txt`
**If Issues**: Review report and fix issues

---

### 4.2 Verify Release Gate Report
```bash
# View the release gate report
cat artifacts/release-gate-report.txt

# Confirm all checks marked PASS
grep -c "PASS" artifacts/release-gate-report.txt
```

**Expected Result**: ✅ All checks PASS
**Key Metrics**:
- Memory available: >1GB
- Disk space: >5GB
- Test coverage: >85%
- Security audit: Clean
- No breaking changes

---

## Phase 5: Rollback Drill Validation (20 mins)

### 5.1 Run Rollback Drill
```bash
# Execute rollback procedure x3
npm run test:rollback-drill

# This validates:
# - Can stop services cleanly
# - Can revert to previous state
# - Can restart successfully
# - Critical workflows still work
```

**Expected Result**: ✅ All 3 rollback drills PASS
**Artifacts**: `artifacts/rollback-drill-report.txt`
**Time**: ~20 minutes (runs 3x)

---

### 5.2 Check Rollback Critical Gate
```bash
# Verify no critical failures in rollback
npm run test:rollback-critical-gate

# This ensures rollback procedures are safe
```

**Expected Result**: ✅ No critical failures in rollback report
**If Issues**: Must fix before release

---

### 5.3 Check Rollback Warning Threshold
```bash
# Verify warning count acceptable
npm run test:rollback-warning-threshold

# Warnings OK if <5 per drill cycle
```

**Expected Result**: ✅ Warning count within threshold
**Artifacts**: Count stored in report

---

## Phase 6: Docker Compose Validation (10 mins)

### 6.1 Boot Full Stack
```bash
# Start all services with Docker Compose
docker-compose up -d

# Wait for services to initialize (~30 seconds)
sleep 30

# Verify all services running
docker-compose ps
```

**Expected Status**:
```
SERVICE                    STATUS
chamberofcommerceai-api    Up (healthy)
chamberofcommerceai-worker Up (healthy)
firebase-emulator          Up
```

---

### 6.2 Health Check Endpoints
```bash
# API health
curl -s http://localhost:4001/health | jq '.'

# Worker health
curl -s http://localhost:4002/health | jq '.'

# Expected: {"ok": true}
```

**Expected Result**: ✅ Both endpoints return 200 with {ok: true}

---

### 6.3 Basic Workflow Test
```bash
# Create a test meeting
curl -X POST http://localhost:4001/meetings \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-03-04",
    "time": "14:00",
    "location": "Zoom",
    "chair": "Test User",
    "secretary": "Test Secretary"
  }'

# Expected: 201 Created with meeting ID
```

---

### 6.4 Verify Local Stack
```bash
# Full stack verification script
bash scripts/verify_local_stack.sh

# This tests all critical endpoints
```

**Expected Result**: ✅ All verifications pass

---

### 6.5 Cleanup
```bash
# Stop all services
docker-compose down

# Verify cleanup
docker-compose ps
```

---

## Phase 7: Release Evidence Bundle (10 mins)

### 7.1 Build Evidence Bundle
```bash
# Generate complete release evidence
bash scripts/build_release_evidence.sh

# This collects:
# - Release gate report
# - Rollback drill report
# - Test coverage data
# - Security audit results
# - CI/CD logs
# - Metrics baseline
```

**Expected Result**: ✅ `artifacts/release-evidence/` directory populated
**Artifacts Created**:
- `release-gate-report.txt`
- `rollback-drill-report.txt`
- `metrics-baseline.json`
- `test-coverage-summary.json`
- `security-audit.json`

---

### 7.2 Verify Evidence Integrity
```bash
# Verify all evidence files present and valid
bash scripts/verify_release_evidence.sh

# Should confirm all artifacts checksummed
```

**Expected Result**: ✅ All evidence files verified

---

### 7.3 Package Evidence Archive
```bash
# Create compressed archive
tar -czf artifacts/release-evidence.tar.gz \
  -C artifacts release-evidence

# Verify archive
ls -lh artifacts/release-evidence.tar.gz

# Expected: 50-200MB depending on logs
```

---

### 7.4 Verify Archive Integrity
```bash
# Calculate and verify checksum
npm run test:verify-release-archive

# Creates SHA256 checksum for release notes
```

**Expected Result**: ✅ Archive checksum verified
**Save**: Checksum string for release notes

---

## Phase 8: Documentation Audit (15 mins)

### 8.1 Core Documentation
```bash
# Verify all documentation exists and is current
ls -1 docs/ | grep -E "DEPLOYMENT|ARCHITECTURE|API|ROLLBACK"

# Expected files:
# - docs/DEPLOYMENT.md
# - docs/ARCHITECTURE.md
# - docs/api-firebase.md
# - docs/ROLLBACK.md
# - docs/USER_GUIDE.md
```

---

### 8.2 README Accuracy
```bash
# Review README
head -50 README.md

# Verify:
# - Features list matches current implementation
# - Installation instructions accurate
# - Quick start works
# - Links functional
```

---

### 8.3 Contributing Guide
```bash
# Verify CONTRIBUTING.md exists
test -f CONTRIBUTING.md && echo "✅ CONTRIBUTING.md exists"

# Verify CODE_OF_CONDUCT.md exists
test -f CODE_OF_CONDUCT.md && echo "✅ CODE_OF_CONDUCT.md exists"

# Verify LICENSE file exists
test -f LICENSE && echo "✅ LICENSE exists"
```

---

### 8.4 Security Policy
```bash
# Verify SECURITY.md exists and is current
test -f SECURITY.md && echo "✅ SECURITY.md exists"

# Review for:
# - Responsible disclosure policy
# - Contact information
# - Known vulnerabilities (if any)
```

---

### 8.5 CHANGELOG Currency
```bash
# Verify CHANGELOG is updated
head -30 CHANGELOG.md

# Confirm latest entry has:
# - Version number
# - Release date
# - Feature list
# - Breaking changes (if any)
```

---

## Phase 9: Git & Versioning (5 mins)

### 9.1 Version Check
```bash
# Current version in package.json
VERSION=$(grep '"version"' package.json | cut -d'"' -f4)
echo "Current version: $VERSION"

# Determine next version (semantic versioning)
# Current: 0.2.17-rc1
# Next RC: 0.2.17 or 0.3.0
```

---

### 9.2 Commit History
```bash
# Review commits since last release
git log --oneline -20

# Verify:
# - All commits related to features/fixes
# - No accidental commits
# - Commit messages descriptive
```

---

### 9.3 Git Tags
```bash
# List recent tags
git tag -l | tail -10

# Verify tag naming: v0.2.17 or v1.0.0
```

---

## Phase 10: Final Pre-Release Checklist

Before publishing, verify all items:

- [ ] **Phase 1**: Environment setup complete
- [ ] **Phase 2**: Pre-release checks pass (security, secrets, docker)
- [ ] **Phase 3**: Test suite passing (unit, contracts, E2E >95%)
- [ ] **Phase 4**: Release gate PASS
- [ ] **Phase 5**: Rollback drills x3 PASS, critical gate PASS, warnings <5
- [ ] **Phase 6**: Docker Compose boots cleanly, health checks OK
- [ ] **Phase 7**: Evidence bundle created, archived, checksummed
- [ ] **Phase 8**: Documentation complete and accurate
- [ ] **Phase 9**: Git history clean, versioning correct
- [ ] **Review**: No critical issues identified
- [ ] **Approval**: Ready for public release

---

## Phase 11: Release Publication (Optional - Manual)

### 11.1 Create Git Tag
```bash
# Decide version: v1.0.0 for first open-source release
TAG="v1.0.0"

# Create annotated tag
git tag -a $TAG -m "Release v1.0.0: ChamberOfCommerceAI Free Tier"

# Push tag (requires push permissions)
git push origin $TAG
```

---

### 11.2 Generate Release Notes
```bash
# Create comprehensive release notes
bash scripts/release_notes.sh > RELEASE_NOTES_v1.0.0.md

# Include:
# - Feature summary
# - Breaking changes (if any)
# - Installation instructions
# - Known issues
# - Evidence bundle checksum
# - Thanks to contributors
```

---

### 11.3 Publish GitHub Release
```bash
# Using GitHub CLI (if installed)
gh release create v1.0.0 \
  --title "ChamberOfCommerceAI v1.0.0 - Free Tier" \
  --notes-file RELEASE_NOTES_v1.0.0.md \
  artifacts/release-evidence.tar.gz

# Or manually via GitHub web UI:
# 1. Navigate to Releases
# 2. Draft new release
# 3. Set version to v1.0.0
# 4. Add release notes
# 5. Upload release-evidence.tar.gz
# 6. Publish
```

---

## Success Indicators

**Green Light Indicators** ✅
- All unit tests passing
- E2E critical path 100% passing
- E2E full suite >95% passing
- Release gate: PASS
- Rollback drills: PASS (x3)
- Docker Compose: All services healthy
- No security vulnerabilities
- No hardcoded secrets
- Documentation complete
- Evidence bundle created and verified

**Yellow Flags** ⚠️
- E2E suite 80-95% passing (acceptable with known flaky tests documented)
- Minor warnings in rollback drill (<5)
- Non-critical documentation gaps (minor typos)
- Low-severity security findings (with remediation plan)

**Red Light Indicators** 🛑 (Block Release)
- Any critical E2E failure
- Release gate: FAIL
- Rollback critical gate: FAIL
- Docker images don't build
- Hardcoded secrets found
- High/critical security vulnerabilities
- Core documentation missing

---

## Troubleshooting

### E2E Tests Failing
```bash
# Re-run failed test with headed mode
npm run test:e2e:headed -- --grep "test-name"

# Debug specific test
npm run test:e2e:debug -- --grep "test-name"

# Check Firebase emulator status
lsof -i :8080 -i :9099 -i :9199
```

### Docker Compose Issues
```bash
# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# Reset state
bash scripts/reset_test_state.sh
docker-compose down
docker-compose up -d
```

### Port Conflicts
```bash
# Find process using port
lsof -i :4001
lsof -i :4002

# Kill process
kill -9 <PID>
```

### Firebase Emulator Issues
```bash
# Kill any zombie emulator processes
pkill -f "firebase emulators"

# Clear emulator data
rm -rf ~/.firebase

# Restart
firebase emulators:start --project cam-aim-dev
```

---

## Timeline Estimate

| Phase | Time | Notes |
|-------|------|-------|
| Phase 1 | 5 min | Setup |
| Phase 2 | 10 min | Audits |
| Phase 3 | 45 min | Tests (includes E2E) |
| Phase 4 | 10 min | Release gate |
| Phase 5 | 20 min | Rollback drills x3 |
| Phase 6 | 10 min | Docker validation |
| Phase 7 | 10 min | Evidence bundle |
| Phase 8 | 15 min | Docs audit |
| Phase 9 | 5 min | Git/versioning |
| Phase 10 | 10 min | Final checklist |
| **Total** | **~2-2.5 hours** | Full validation |

---

## Next Steps

1. **Execute Phase 1-10** using this guide
2. **Document any issues** in `RC_VALIDATION_RESULTS.md`
3. **Resolve red-light issues** before proceeding to release
4. **Yellow-flag items** require documentation but don't block release
5. **Archive evidence** in secure location
6. **Publish release** when all green lights achieved

---

## Questions?

Refer to:
- `docs/RELEASE_CHECKLIST.md` - Official release checklist
- `docs/ROLLBACK.md` - Rollback procedures
- `docs/DEPLOYMENT.md` - Deployment guide
- `CONTRIBUTING.md` - Contributing guidelines
- `SECURITY.md` - Security policy

