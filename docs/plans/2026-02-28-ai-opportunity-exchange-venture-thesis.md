# Venture Thesis: AI Opportunity Exchange
**Date**: 2026-02-28  
**Status**: Design Baseline for Pilot Build

---

## Thesis Statement

The AI Opportunity Exchange is a Chamber-operated managed marketplace that connects local business demand with vetted AI implementation providers. It is designed to produce verified economic outcomes, not generic marketplace activity.

The model wins by combining:
- **Trusted curation** (Chamber vetting and governance),
- **Structured delivery** (fixed-scope project lifecycle),
- **Outcome verification** (baseline vs. post metrics), and
- **Local economic retention** (income remains in region).

This thesis extends into a broader integrated operating system for local businesses, positioning the platform as a Chamber-enhanced alternative to GoHighLevel-class products.

---

## Product Scope

### Primary users
- Demand-side: Chamber member businesses seeking productivity or growth outcomes.
- Supply-side: AI operators (agencies, consultants, solo implementers).
- Operator-side: Chamber staff managing trust, matching, and escalations.

### Integrated SMB platform modules
- CRM and contact lifecycle
- Deal pipeline and follow-up orchestration
- Messaging and campaign automation
- Appointment and calendar workflows
- Reputation and review workflows
- AI assistant workflows for sales and operations

These modules provide the baseline platform experience while the Exchange layer adds trusted local matching and outcome governance.

### Core workflow
`need posted -> readiness scored -> provider matched -> fixed-scope sprint delivered -> outcome verified -> case study published`

### Geo intelligence workflow
`geo selected (zip/city/town) -> local signals scanned -> geo profile scored -> content brief generated -> opportunities prioritized`

### Phase 1 service classes
- Appointment and inbox automation
- Lead triage and follow-up workflows
- Review-response workflow setup
- Proposal and document automation
- Internal knowledge assistant setup

Excluded in pilot:
- High-risk regulated workflows
- Unsupervised deployment in mission-critical customer paths

---

## Managed Exchange Operating Model

### Readiness bands
- `quick_win_automation`
- `workflow_redesign`
- `strategy_transformation`

Pilot acceptance rule: only `quick_win_automation` projects are eligible.

### Provider trust tiers
- `provisional`
- `verified`
- `preferred`

Tier advancement requires evidence across completion quality, delivery consistency, and outcome validation.

### Dispute escalation ladder
1. Provider remediation window
2. Chamber-mediated correction plan
3. Chamber fee arbitration according to policy

---

## Public Interfaces and Types

### Entity interfaces
```ts
interface Opportunity {
  id: string;
  chamberId: string;
  businessId: string;
  title: string;
  problemStatement: string;
  serviceClass: 'quick_win_automation' | 'workflow_redesign' | 'strategy_transformation';
  budgetMinUsd: number;
  budgetMaxUsd: number;
  desiredTimelineDays: number;
  geoScopeType: 'zip_code' | 'city' | 'town';
  geoScopeId: string;
  riskClass: 'low' | 'moderate' | 'high';
  status: 'draft' | 'open' | 'matched' | 'in_delivery' | 'completed' | 'disputed' | 'closed';
  createdAt: string;
  updatedAt: string;
}

interface ProviderProfile {
  id: string;
  chamberId: string;
  legalName: string;
  industries: string[];
  capabilities: string[];
  tier: 'provisional' | 'verified' | 'preferred';
  onTimeDeliveryRatePct: number;
  outcomeVerificationRatePct: number;
}

interface OutcomeReport {
  id: string;
  opportunityId: string;
  baseline: {
    hoursSavedPerWeek?: number;
    leadResponseTimeHours?: number;
    monthlyCostUsd?: number;
    monthlyRevenueUsd?: number;
  };
  post: {
    hoursSavedPerWeek?: number;
    leadResponseTimeHours?: number;
    monthlyCostUsd?: number;
    monthlyRevenueUsd?: number;
  };
  verifiedBy: string;
  verifiedAt: string;
}

interface GeoProfile {
  id: string;
  chamberId: string;
  scopeType: 'zip_code' | 'city' | 'town';
  scopeId: string;
  businessDensityScore: number;
  aiReadinessScore: number;
  demandGapTags: string[];
  providerSupplyTags: string[];
  updatedAt: string;
}

interface GeoContentBrief {
  id: string;
  geoProfileId: string;
  topUseCases: string[];
  opportunitySummary: string;
  outreachDraft: string;
  generatedAt: string;
}
```

### Event contracts
- `opportunity.posted`
- `match.created`
- `project.completed`
- `outcome.verified`
- `provider.tier_changed`
- `geo.profile_refreshed`
- `geo.content_generated`
- `crm.contact_created`
- `pipeline.stage_changed`
- `campaign.sent`
- `appointment.booked`

---

## Monetization

### Revenue streams
1. Chamber plan uplift for exchange access
2. Transaction fee on completed project value
3. Premium onboarding package for first implementation sprint

### Pilot pricing defaults
- Chamber platform access: fixed monthly fee
- Completed project fee: 6-10% depending on tier and policy
- Optional onboarding package: fixed project starter rate

### Expansion pricing track (integrated platform)
- Per-business platform subscription by active module bundle
- Usage-based AI workflow fees for advanced automation runs
- Managed services retainer for Chamber-led implementation programs

---

## KPI Framework

### Economic
- `local_income_created_usd`
- `provider_revenue_usd`
- `project_gmv_usd`

### Delivery
- `median_match_time_days`
- `on_time_delivery_rate_pct`
- `completion_rate_pct`

### Outcome quality
- `outcome_verification_rate_pct`
- `median_hours_saved_per_week`
- `median_response_time_improvement_pct`

### Trust
- `dispute_rate_pct`
- `repeat_business_rate_pct`
- `provider_tier_promotion_rate_pct`

### Geo relevance
- `geo_profiles_active_count`
- `geo_content_generation_coverage_pct`
- `geo_to_opportunity_conversion_rate_pct`

---

## Acceptance Criteria for Pilot Readiness

1. Standard SOW template includes scope boundary, success criteria, and data-handling clause.
2. Every project has baseline KPI capture before start.
3. Outcome report and verification exist before project closure.
4. Provider tiering and escalation policy are operational.
5. Monthly dashboard reports economic + delivery + trust metrics.
6. Every published opportunity includes `geoScopeType` and `geoScopeId`.
7. Geo content generation supports zip code, city, and town scopes.
8. At least one integrated module bundle (CRM + messaging + appointment) is live for pilot businesses.
