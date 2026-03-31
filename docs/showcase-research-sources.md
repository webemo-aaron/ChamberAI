# Chamber Showcase Research Sources

This document captures the current chamber-led source map for building high-confidence showcase data across the target Maine communities.

## Research Model

Use sources in this order:

1. Official chamber member directory
2. Official chamber site pages
3. Municipal business or economic development pages
4. Downtown alliance or regional business association directories
5. Tourism and destination guides
6. Legacy directories only as fallback

The machine-readable source map is in [source-map.json](/mnt/devdata/repos/ChamberAI/data/showcase/source-map.json).

## High-Confidence Chamber Directory Cities

- Portland, ME
  Source: Portland Regional Chamber
  Directory: `https://web.portlandregion.com/search`
  Important note: regional directory, so Portland filtering is required.

- Augusta, ME
  Source: Kennebec Valley Chamber
  Directory: `https://www.augustamaine.com/our-members`
  Important note: coverage is spread across category pages and cb-profile pages.

- Bethel, ME
  Source: Bethel Area Chamber
  Directory: `https://business.bethelmaine.com/members`
  Important note: strongest standalone small-town chamber directory in the target set.

- York, ME
  Source: York Region Chamber
  Directory: `https://www.yorkme.org/directory/`
  Important note: regional chamber, so York-only filtering is required.

## Mixed or Indirect Directory Cities

- Bangor, ME
  Chamber source exists, but Downtown Bangor looks richer for extraction.
  Recommended supplement: `https://downtownbangor.com/business-directory/`

- Scarborough, ME
  Current chamber site is mostly informational.
  Recommended extraction path: Portland Regional Chamber directory plus municipal and legacy chamber pages.

## Regional Association Cities

- Kingfield, ME
  No standalone chamber directory found.
  Recommended primary source: Maine's Northwestern Mountains / Flagstaff Area Business Association.

- Carrabassett Valley, ME
  No standalone chamber directory found.
  Recommended primary source: Maine's Northwestern Mountains / Flagstaff Area Business Association.

## Recommended Seeding Strategy

Phase 1:

- Keep meetings and geo-intelligence seeding as the stable base layer.
- Add a source-aware business import layer that reads from the source map by city.

Phase 2:

- Build city-level raw capture files:
  - `data/showcase/raw/<city>/businesses.json`
  - `data/showcase/raw/<city>/sources.json`

Phase 3:

- Use local Codex to normalize and enrich raw directory captures into:
  - canonical business names
  - categories
  - city and geo scope tags
  - short descriptions
  - business-hub reviews and quotes
  - kiosk FAQs and outreach drafts

Phase 4:

- Extend the local/mock API or adapter layer to ingest business listings, reviews, and quotes per city.

## Practical Notes

- Regional directories must be filtered by city before import.
- Municipal and economic development pages are useful for metadata and business-support narratives, but not always complete directories.
- Regional tourism and association directories are valid primary sources for Kingfield and Carrabassett Valley because the current chamber footprint is weak or absent.
