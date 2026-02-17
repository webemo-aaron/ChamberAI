# ChamberOfCommerceAI

![Build](https://img.shields.io/github/actions/workflow/status/mahoosuc-solutions/ChamberOfCommerceAI/ci.yml)
![License](https://img.shields.io/github/license/mahoosuc-solutions/ChamberOfCommerceAI)
![Issues](https://img.shields.io/github/issues/mahoosuc-solutions/ChamberOfCommerceAI)

ChamberOfCommerceAI is a Secretary Console that helps teams run meetings, capture minutes, and track
follow-ups. The self-hosted (free) tier runs locally with the Firebase Emulator Suite and
can be switched to real Firebase services for production.

Docs index: `docs/INDEX.md`

GitHub Pages: https://webemo-aaron.github.io/ChamberAI/

Pilot intake: https://forms.gle/REPLACE_WITH_PILOT_INTAKE

## Features

- Meeting creation and management
- Minutes drafting and approval flow
- Motions tracking
- Action items and CSV export
- Public summary generation and publishing
- Audit log and retention sweep
- Settings management and feature flags

## Free vs Paid

**Free (self-hosted)**

- Run locally via Docker Compose
- Firebase Emulator Suite by default
- Core meeting, minutes, and action-item workflows

**Paid (SaaS)**

- Hosted version with managed infrastructure
- Enhanced AI processing and automation
- Advanced analytics and integrations

## Status

- Feature audit and definition of done: `FEATURE_AUDIT_AND_DEFINITION_OF_DONE.md`

## Release Checklist (Free Tier)

- Checklist: `docs/RELEASE_CHECKLIST.md`
- Deployment guide: `docs/DEPLOYMENT.md`

## Quick Start (Docker Compose)

```bash
# Clone and start
npm install

docker-compose up -d

# Console UI: http://localhost:5173
# API Health: http://localhost:4001/health
# Firebase UI: http://localhost:4000
```

Stop services:

```bash
docker-compose down
```

## Documentation

- Deployment: `docs/DEPLOYMENT.md`
- Docs index: `docs/INDEX.md`
- Architecture: `docs/ARCHITECTURE.md`
- API (mock): `docs/api.md`
- API (Firebase): `docs/api-firebase.md`
- Worker (Firebase): `docs/worker-firebase.md`
- Governance: `docs/governance-policy.md`
- Roadmap: `docs/roadmap.md`
- Changelog: `CHANGELOG.md`
- Support: `SUPPORT.md`
- Outreach one-pager: `docs/mission-vision.md`
- Landing page outline: `docs/landing-page-outline.md`
- Community posts: `docs/community-posts.md`
- Subscriptions (PayPal): `docs/SUBSCRIPTIONS.md`

## Development

```bash
# Terminal 1
npm run dev:firebase

# Terminal 2
npm run dev:api

# Terminal 3
npm run dev:console
```

## Testing

```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# Full test suite
npm test
```

## Contributing

See `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`.

## Security

See `SECURITY.md` for reporting guidelines.

## License

MIT. See `LICENSE`.
