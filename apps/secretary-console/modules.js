export const FEATURE_FLAGS = [
  { key: "public_summary", label: "Public Summary" },
  { key: "member_spotlight", label: "Member Spotlight" },
  { key: "referral_board", label: "Referral Board" },
  { key: "visitor_experience", label: "Visitor Experience" },
  { key: "event_collaboration", label: "Event Collaboration" },
  { key: "bre_tools", label: "Business Retention (BRE)" },
  { key: "funding_grants", label: "Funding & Grants" },
  { key: "analytics_dashboard", label: "Analytics Dashboard" },
  { key: "integrations_crm", label: "CRM Integration" },
  { key: "integrations_calendar", label: "Calendar Integration" },
  { key: "integrations_email", label: "Email Integration" }
];

export function defaultFlags() {
  return FEATURE_FLAGS.reduce((acc, flag) => {
    acc[flag.key] = false;
    return acc;
  }, {});
}
