# Showcase Seeding Plan

This plan seeds the local ChamberAI stack with realistic, city-specific showcase data for Maine chamber demonstrations.

## First Wave

- Portland, ME
- Bangor, ME
- Augusta, ME
- Scarborough, ME

## Full City Set

- Portland, ME
- Augusta, ME
- Bangor, ME
- Bethel, ME
- Kingfield, ME
- Carrabassett Valley, ME
- York, ME
- Scarborough, ME

## Current Local Scope

The current local mock API supports:

- Meetings
- Draft minutes
- Action items
- Motions
- Public summaries
- Approval workflow
- Geo profile scanning
- Geo content brief generation

The current local mock API does not yet support the full Business Hub seeding surface. This first showcase seeder therefore focuses on the strongest runnable demo path today: city-based meetings plus geo intelligence.

## Files

- Manifest: [data/showcase/cities.json](/mnt/devdata/repos/ChamberAI/data/showcase/cities.json)
- Seeder: [scripts/seed_showcase_data.js](/mnt/devdata/repos/ChamberAI/scripts/seed_showcase_data.js)

## Usage

Seed the first wave into the local mock API:

```bash
API_BASE=http://127.0.0.1:4010 node scripts/seed_showcase_data.js
```

Seed all configured cities:

```bash
API_BASE=http://127.0.0.1:4010 SHOWCASE_WAVE=all node scripts/seed_showcase_data.js
```

Seed selected cities only:

```bash
API_BASE=http://127.0.0.1:4010 SHOWCASE_CITIES="Portland, ME,Bangor, ME" node scripts/seed_showcase_data.js
```

Dry run:

```bash
DRY_RUN=true node scripts/seed_showcase_data.js
```

## Recommended Next Expansion

After validating the first-wave data in the UI:

1. Add generated city payloads for Business Hub records.
2. Extend the local API or adapter layer for business listings, reviews, and quotes.
3. Use local Codex to generate business catalogs, reviews, and kiosk FAQ packs per city.
4. Add idempotent cleanup or namespace filtering for repeated reseeds.
