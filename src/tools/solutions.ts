import { z } from "zod";
import { defineTool, fail, ok } from "./tool-types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Static data — READ-MIRROR of solution/service sources.
// Source: hellocrmwebsite/src/lib/whatsappUseCases.ts — SYNCED_AT 2026-07-08
// Source: hellocrmwebsite/src/lib/managed-revops-content.ts — SYNCED_AT 2026-07-08
//   (9 market variants of the Managed RevOps service page; prose condensed,
//    all rows preserved)
// Source: hellocrmwebsite/src/app/(public)/managed-revops-<city>/page.tsx
//   (25 US city landing pages; uniform USD offer) — SYNCED_AT 2026-07-08
// ─────────────────────────────────────────────────────────────────────────────

const SYNCED_AT = "2026-07-08";

// ── WhatsApp CRM use cases ───────────────────────────────────────────────────

// Mirrors USE_CASES (5 entries) — the WhatsApp message composer use cases
// built into HelloGrowthCRM's WhatsApp messaging feature.
const WHATSAPP_USE_CASES: Array<{
  key: string;
  label: string;
  description: string;
  kind: string;
  template_preview: string;
}> = [
  {
    key: "general",
    label: "General message",
    description: "Send a free-form message",
    kind: "general",
    template_preview: "Free-form: subject and body joined as provided.",
  },
  {
    key: "follow_up",
    label: "Follow-up",
    description: "Follow up on a previous conversation",
    kind: "follow_up",
    template_preview:
      'Hi {firstName}, this is {sender} from {company}. Just following up regarding "{subject}". {body | Let me know if you have any questions.}',
  },
  {
    key: "meeting_reminder",
    label: "Meeting reminder",
    description: "Remind about an upcoming meeting",
    kind: "meeting_reminder",
    template_preview:
      "Hi {firstName}! Reminding you about our upcoming meeting — {subject}. {body} Looking forward to connecting!",
  },
  {
    key: "document",
    label: "Document request / share",
    description: "Request or share a document",
    kind: "document",
    template_preview:
      "Hi {firstName}, {sender} from {company} here. Could you please share your {documentType}? {documentNote}",
  },
  {
    key: "notification_link",
    label: "Notification with link",
    description: "Send an update with a link to review",
    kind: "notification_link",
    template_preview: "Hi {firstName}, {subject | we have an update for you}. {body} {url}",
  },
];

// ── Managed RevOps — market pages ────────────────────────────────────────────

type RevOpsTier = {
  id: string;
  name: string;
  price_label: string;
  price_currency: string;
  popular?: boolean;
  features: ReadonlyArray<string>;
};

type RevOpsMarket = {
  market: string;
  route: string;
  pricing_href: string;
  country_name: string;
  coverage_hours: string;
  compliance_line: string;
  positioning: string;
  pain_points: ReadonlyArray<string>;
  kpis: ReadonlyArray<{ label: string; value: string }>;
  weekly_sops: ReadonlyArray<string>;
  tiers: ReadonlyArray<RevOpsTier>;
  verticals: ReadonlyArray<{ vertical: string; href: string }>;
  faqs: ReadonlyArray<{ q: string; a: string }>;
};

const GLOBAL_TIERS: ReadonlyArray<RevOpsTier> = [
  {
    id: "growth-engine",
    name: "Growth Engine",
    price_label: "$1,499/mo flat",
    price_currency: "USD",
    popular: true,
    features: [
      "Named Revenue Specialist running your queue",
      "Weekly cadence: triage, route, follow-up, clean, report",
      "Same-business-day SLA on new inbound leads",
      "Email + SMS sequence execution (your templates)",
      "Pipeline cleanup & data hygiene",
      "Weekly KPI report with narrative",
      "Approval workflow for new templates / offers",
    ],
  },
  {
    id: "revops-partner",
    name: "RevOps Partner",
    price_label: "$3,999/mo flat",
    price_currency: "USD",
    features: [
      "Everything in Growth Engine, plus:",
      "Dedicated pod — Revenue Specialist + Automation Specialist",
      "Quarterly funnel review & KPI target-setting",
      "Lead scoring model tuning",
      "Workflow automation (routing, sequencing, scoring)",
      "Governance & instrumentation plan",
      "Monthly strategy call with named owner",
    ],
  },
];

// All 9 market variants from MANAGED_REVOPS_CONTENT. Prose condensed; every
// market, tier, KPI, SOP, vertical, and FAQ row preserved.
const REVOPS_MARKETS: ReadonlyArray<RevOpsMarket> = [
  {
    market: "global",
    route: "/services/managed-revops",
    pricing_href: "/pricing",
    country_name: "your region",
    coverage_hours: "Mon–Fri, 9am–6pm in your team's primary timezone",
    compliance_line: "GDPR-aware data handling, SOC 2-aligned controls, opt-out + suppression list management.",
    positioning:
      "Managed RevOps team triages inbound leads, runs follow-up cadences, cleans the pipeline, and ships a weekly KPI report — so the sales team only does work that closes deals.",
    pain_points: [
      "Inbound leads go cold within 24 hours",
      "Follow-up cadences live in someone's head",
      "Pipeline data rots between reviews",
      "RevOps hires are slow and expensive",
    ],
    kpis: [
      { label: "Time-to-First-Response", value: "< 1 hour" },
      { label: "Contact Rate", value: "85%+" },
      { label: "Meetings Booked", value: "Tracked weekly" },
      { label: "Pipeline Velocity", value: "Measured monthly" },
    ],
    weekly_sops: [
      "Mon — Inbox triage + lead routing",
      "Tue — Follow-up queue execution",
      "Wed — Pipeline hygiene + data cleanup",
      "Thu — Cadence + sequence tuning",
      "Fri — KPI report + next-week plan",
    ],
    tiers: GLOBAL_TIERS,
    verticals: [
      { vertical: "Real Estate", href: "/crm-for-real-estate" },
      { vertical: "Law Firms", href: "/crm-for-law-firms" },
      { vertical: "Financial Advisors", href: "/crm-for-financial-advisors" },
      { vertical: "Interior Designers", href: "/crm-for-interior-designers" },
      { vertical: "Coaches & Consultants", href: "/crm-for-coaches" },
      { vertical: "Home Services", href: "/crm-for-home-services" },
    ],
    faqs: [
      {
        q: "Are these virtual assistants?",
        a: "No — trained revenue operations professionals following standardized SOPs, measured on pipeline KPIs.",
      },
      {
        q: "How fast do leads get a response?",
        a: "Same-business-day SLA; target under 1 hour during business hours in your team's primary timezone.",
      },
      {
        q: "What if I need to approve outbound messages?",
        a: "You set the rules — approval workflow for new templates, offers, and legal/pricing messaging; routine follow-ups use pre-approved templates.",
      },
      {
        q: "Can I start small and expand?",
        a: "Yes — most teams start with Growth Engine, then upgrade to RevOps Partner for deeper automation and quarterly funnel reviews.",
      },
      {
        q: "Is there a minimum commitment?",
        a: "3-month engagement recommended; no long-term contracts, 30 days' notice to pause or cancel.",
      },
      {
        q: "What tools do you operate inside?",
        a: "Primarily HelloGrowthCRM, but adaptable to your existing CRM, dialer, and email platform. All actions logged and visible.",
      },
    ],
  },
  {
    market: "india",
    route: "/in/services/managed-revops",
    pricing_href: "/in/pricing",
    country_name: "India",
    coverage_hours: "Mon–Sat, 10am–7pm IST",
    compliance_line: "DPDPA-ready data handling, Indian data residency, WhatsApp Business compliance, GST-ready invoicing.",
    positioning:
      "India RevOps pod triages IndiaMART/JustDial enquiries, runs WhatsApp follow-up cadences, sends GST-ready quote chases, and ships a weekly INR report — billed in INR with GST.",
    pain_points: [
      "IndiaMART + JustDial leads drop off in hours",
      "WhatsApp follow-ups live across 6 reps' phones",
      "Quote → invoice cycle takes 4 days",
      "Branch reporting means weekly Excel files",
    ],
    kpis: [
      { label: "IndiaMART Response Time", value: "< 30 min" },
      { label: "WhatsApp Contact Rate", value: "92%+" },
      { label: "Quote → Order Cycle", value: "≤ 24 hours" },
      { label: "Branch Pipeline View", value: "Live, daily" },
    ],
    weekly_sops: [
      "Mon — IndiaMART + JustDial intake + WhatsApp routing",
      "Tue — Quote chase + Tally reconciliation",
      "Wed — Pipeline hygiene + branch deduping",
      "Thu — WhatsApp + dialer cadence tuning",
      "Fri — Branch KPI report + Monday plan",
    ],
    tiers: [
      {
        id: "growth-engine",
        name: "Growth Engine",
        price_label: "₹39,999/mo flat",
        price_currency: "INR",
        popular: true,
        features: [
          "Named India Revenue Specialist (IST coverage)",
          "IndiaMART + JustDial intake within 30 min",
          "WhatsApp Business API follow-up cadences",
          "Quote chase + Tally / Razorpay reconciliation",
          "Pipeline cleanup, branch deduping, GST/PAN backfill",
          "Weekly INR KPI report with branch-wise view",
          "Approval workflow for new WhatsApp / SMS templates",
        ],
      },
      {
        id: "revops-partner",
        name: "RevOps Partner",
        price_label: "₹1,07,999/mo flat",
        price_currency: "INR",
        features: [
          "Everything in Growth Engine, plus:",
          "Dedicated pod (Revenue + Automation Specialist)",
          "Multi-branch lead routing automation",
          "AI lead scoring tuned for IndiaMART/JustDial sources",
          "Workflow automation (WhatsApp routing, GST quote flows)",
          "Quarterly funnel review with branch managers",
          "Monthly strategy call with named pod lead",
        ],
      },
    ],
    verticals: [
      { vertical: "Real Estate (India)", href: "/crm-for-real-estate-india" },
      { vertical: "Pharma Distributors", href: "/industries/pharma-distributor" },
      { vertical: "Coaching Centres", href: "/crm-for-coaching-centres" },
      { vertical: "CA Firms", href: "/industries/ca-firm" },
      { vertical: "Manufacturing & Exports", href: "/crm-for-manufacturing-india" },
      { vertical: "Insurance Agents", href: "/crm-for-insurance-agents-india" },
    ],
    faqs: [
      { q: "Is this team based in India?", a: "Yes — IST coverage Mon–Sat, trained on IndiaMART, JustDial, 99acres, MagicBricks, Tally, Razorpay, and WhatsApp Business API." },
      { q: "Do you handle WhatsApp Business API compliance?", a: "Yes — pre-approved templates, opt-in handling, and consent records; never personal WhatsApp accounts." },
      { q: "Will pricing include GST?", a: "Billed in INR with GST-compliant invoices (your GSTIN on every invoice); input tax credit available." },
      { q: "Does this work for multi-branch businesses?", a: "Yes — multi-branch routing and consolidated branch-wise reporting built into both tiers." },
      { q: "Can you integrate with Tally / Razorpay / IndiaMART?", a: "Yes — Tally, Razorpay/Cashfree/PhonePe, and IndiaMART/JustDial/TradeIndia are wired into the standard India setup." },
      { q: "Is there a minimum commitment?", a: "3-month initial engagement recommended; no long-term contract, 30 days' notice." },
    ],
  },
  {
    market: "usa",
    route: "/usa/services/managed-revops",
    pricing_href: "/usa/pricing",
    country_name: "the United States",
    coverage_hours: "Mon–Fri, 9am–6pm ET (overlap with PT business hours)",
    compliance_line: "SOC 2 Type II controls, CCPA-aware data handling, CAN-SPAM + TCPA opt-out + suppression management.",
    positioning:
      "US RevOps team triages every inbound MQL, runs email + SMS cadences, dials with local-presence numbers, and ships a weekly forecast-accuracy report — for a third of an SDR + RevOps hire.",
    pain_points: [
      "MQL response time is killing your conversion",
      "Outreach + Apollo + Aircall = $250/seat",
      "Forecast accuracy is under 60%",
      "Senior RevOps hires take 90+ days",
    ],
    kpis: [
      { label: "Inbound Response Time", value: "< 5 min" },
      { label: "Contact Rate", value: "85%+" },
      { label: "Forecast Accuracy", value: "85%+ target" },
      { label: "Cost vs. Hire", value: "~60% less" },
    ],
    weekly_sops: [
      "Mon — MQL triage + local-presence dial",
      "Tue — Cadence execution (email + LinkedIn + SMS)",
      "Wed — Pipeline hygiene + stage discipline",
      "Thu — Forecast review + risk flag",
      "Fri — Forecast-accuracy report",
    ],
    tiers: [
      {
        id: "growth-engine",
        name: "Growth Engine",
        price_label: "$1,499/mo flat",
        price_currency: "USD",
        popular: true,
        features: [
          "Named US Revenue Specialist (ET coverage)",
          "5-minute MQL response on inbound",
          "Local-presence dialer + email + SMS cadences",
          "Pipeline cleanup & stage discipline",
          "Weekly forecast-accuracy report",
          "CAN-SPAM + TCPA suppression management",
          "Approval workflow for new outbound templates",
        ],
      },
      {
        id: "revops-partner",
        name: "RevOps Partner",
        price_label: "$3,999/mo flat",
        price_currency: "USD",
        features: [
          "Everything in Growth Engine, plus:",
          "Dedicated pod (Revenue + Automation Specialist)",
          "AI lead scoring model tuning",
          "Workflow automation (Outreach + HubSpot + Apollo)",
          "Quarterly funnel review with RevOps narrative",
          "Forecast-governance playbook & instrumentation",
          "Monthly strategy call with named pod lead",
        ],
      },
    ],
    verticals: [
      { vertical: "B2B SaaS (US)", href: "/crm-for-saas-companies" },
      { vertical: "Home Services (HVAC, roofing, plumbing)", href: "/crm-for-home-services" },
      { vertical: "Financial Advisors", href: "/crm-for-financial-advisors" },
      { vertical: "Real Estate Brokerages", href: "/crm-for-real-estate" },
      { vertical: "Staffing Agencies", href: "/crm-for-staffing-agencies" },
      { vertical: "Insurance Agencies", href: "/crm-for-insurance-agents" },
    ],
    faqs: [
      { q: "Is this team US-based?", a: "US RevOps Specialists cover ET business hours with PT overlap; trained on HubSpot, Salesforce, Outreach, Apollo, ZoomInfo, HelloGrowthCRM." },
      { q: "Are you SOC 2 + CCPA compliant?", a: "Yes — SOC 2 Type II controls, CCPA-aware handling, signed BAA available for healthcare-adjacent workloads." },
      { q: "How fast do MQLs get a response?", a: "Sub-5-minute first touch during business hours from a local-presence number; automated email + SMS out-of-hours." },
      { q: "What does the dialer cost?", a: "Local-presence dialing included in both tiers — no separate Aircall / JustCall / Dialpad bill." },
      { q: "Can you operate inside our existing CRM (HubSpot / Salesforce)?", a: "Yes — SOPs adapt to your existing CRM, dialer, and email tool; HelloGrowthCRM optional." },
      { q: "What's the commitment?", a: "3-month initial engagement recommended; no long-term contract, 30 days' notice." },
    ],
  },
  {
    market: "uk",
    route: "/uk/services/managed-revops",
    pricing_href: "/uk/pricing",
    country_name: "the United Kingdom",
    coverage_hours: "Mon–Fri, 9am–6pm GMT/BST",
    compliance_line: "UK GDPR + ICO-ready audit trails, PECR-aware email/SMS, lawful-basis tracking, DSR handling.",
    positioning:
      "UK RevOps team triages every enquiry, runs sequences across email + SMS + WhatsApp Business, keeps the pipeline ICO-ready, and ships a weekly forecast report — billed in GBP.",
    pain_points: [
      "UK GDPR audit risk lives in your CRM",
      "Inbound enquiries get one email, then nothing",
      "WhatsApp Business is underused in UK B2B",
      "Forecast meetings run on a spreadsheet",
    ],
    kpis: [
      { label: "Enquiry Response Time", value: "< 1 hour" },
      { label: "Contact Rate", value: "88%+" },
      { label: "ICO Audit Readiness", value: "100%" },
      { label: "Forecast Accuracy", value: "85%+ target" },
    ],
    weekly_sops: [
      "Mon — Enquiry triage + WhatsApp Business intake",
      "Tue — Multi-channel cadence execution",
      "Wed — Pipeline hygiene + ICO audit trail",
      "Thu — Forecast review + cadence tuning",
      "Fri — GBP KPI report + next-week plan",
    ],
    tiers: [
      {
        id: "growth-engine",
        name: "Growth Engine",
        price_label: "£1,199/mo flat",
        price_currency: "GBP",
        popular: true,
        features: [
          "Named UK Revenue Specialist (GMT/BST coverage)",
          "1-hour response on UK inbound enquiries",
          "WhatsApp Business + email + SMS cadences",
          "Pipeline cleanup + ICO audit-trail discipline",
          "Lawful-basis + consent records on every touch",
          "Weekly GBP KPI report with narrative",
          "Approval workflow for new templates / offers",
        ],
      },
      {
        id: "revops-partner",
        name: "RevOps Partner",
        price_label: "£3,199/mo flat",
        price_currency: "GBP",
        features: [
          "Everything in Growth Engine, plus:",
          "Dedicated pod (Revenue + Automation Specialist)",
          "UK lead scoring model tuning",
          "Workflow automation (routing, sequencing, DSR)",
          "Quarterly funnel review with regional view",
          "ICO instrumentation + governance playbook",
          "Monthly strategy call with named pod lead",
        ],
      },
    ],
    verticals: [
      { vertical: "UK Estate Agents", href: "/crm-for-real-estate" },
      { vertical: "UK Accounting Firms", href: "/crm-for-accounting-firms" },
      { vertical: "UK Law Firms", href: "/crm-for-law-firms" },
      { vertical: "Recruitment Agencies", href: "/crm-for-recruitment-agencies" },
      { vertical: "Mortgage Brokers", href: "/crm-for-mortgage-brokers" },
      { vertical: "Insurance Brokers", href: "/crm-for-insurance-agents" },
    ],
    faqs: [
      { q: "Is this UK GDPR + PECR compliant?", a: "Yes — lawful-basis tracking, consent records, DSR processing, PECR-aware opt-out in every engagement." },
      { q: "Do you handle WhatsApp Business for UK B2B?", a: "Yes — WhatsApp Business API with approved templates, opt-in workflow, and consent records." },
      { q: "What hours do you cover?", a: "GMT/BST business hours Mon–Fri 9am–6pm; out-of-hours inbound gets an automated PECR-compliant acknowledgement." },
      { q: "Is pricing in GBP?", a: "Yes — £1,199/mo (Growth Engine) and £3,199/mo (RevOps Partner), flat fee; VAT where applicable." },
      { q: "Can you operate inside HubSpot / Salesforce / Pipedrive?", a: "Yes — adapts to your existing CRM, dialer, and email stack; HelloGrowthCRM optional." },
      { q: "What's the commitment?", a: "3-month engagement recommended; no long-term contract, 30 days' notice." },
    ],
  },
  {
    market: "australia",
    route: "/au/services/managed-revops",
    pricing_href: "/au/pricing",
    country_name: "Australia",
    coverage_hours: "Mon–Fri, 8am–6pm AEST/AEDT (Sydney/Melbourne overlap)",
    compliance_line: "Australian Privacy Act + Spam Act compliance, NDIS audit-readiness, AU data residency on request.",
    positioning:
      "AU RevOps pod triages every enquiry, runs SMS + WhatsApp + email cadences, syncs closed deals to Xero, keeps the pipeline NDIS- and Privacy-Act-ready, and ships a weekly AUD report.",
    pain_points: [
      "Site enquiries die in hours across the country",
      "Xero + CRM live in two heads, not one system",
      "SMS is underused — Australians reply on SMS",
      "NDIS providers need audit trails, not luck",
    ],
    kpis: [
      { label: "Enquiry Response Time", value: "< 1 hour" },
      { label: "SMS Contact Rate", value: "90%+" },
      { label: "Xero Sync", value: "Same-day" },
      { label: "NDIS Audit Readiness", value: "100%" },
    ],
    weekly_sops: [
      "Mon — Enquiry triage + state-based routing",
      "Tue — SMS + WhatsApp + email cadence",
      "Wed — Pipeline hygiene + Xero sync",
      "Thu — Forecast review + cadence A/B",
      "Fri — AUD KPI report + next-week plan",
    ],
    tiers: [
      {
        id: "growth-engine",
        name: "Growth Engine",
        price_label: "A$2,299/mo flat",
        price_currency: "AUD",
        popular: true,
        features: [
          "Named Australian Revenue Specialist (AEST coverage)",
          "1-hour response on AU inbound",
          "SMS + WhatsApp + email cadences (Spam Act compliant)",
          "Xero sync for closed-won deals",
          "Pipeline cleanup + state-based routing",
          "Weekly AUD KPI report with narrative",
          "Approval workflow for new templates",
        ],
      },
      {
        id: "revops-partner",
        name: "RevOps Partner",
        price_label: "A$6,099/mo flat",
        price_currency: "AUD",
        features: [
          "Everything in Growth Engine, plus:",
          "Dedicated pod (Revenue + Automation Specialist)",
          "AU lead scoring tuned per service line",
          "Workflow automation (state routing, NDIS intake)",
          "Quarterly funnel review with state-level view",
          "NDIS audit governance playbook",
          "Monthly strategy call with named pod lead",
        ],
      },
    ],
    verticals: [
      { vertical: "Australian Builders & Trades", href: "/crm-for-builders-australia" },
      { vertical: "NDIS Providers", href: "/crm-for-ndis-providers" },
      { vertical: "AU Bookkeepers & Accountants", href: "/crm-for-bookkeepers-australia" },
      { vertical: "Pet Groomers & Pool Service", href: "/crm-for-pet-groomers-australia" },
      { vertical: "Migration Agents", href: "/crm-for-migration-agents" },
      { vertical: "Mortgage Brokers", href: "/crm-for-mortgage-brokers" },
    ],
    faqs: [
      { q: "Is this Privacy Act + Spam Act compliant?", a: "Yes — consent records, opt-out, APP handling; NDIS audit-readiness controls for registered providers." },
      { q: "Do you sync to Xero?", a: "Yes — closed-won deals push to Xero as draft invoices same business day." },
      { q: "Is the dialer Australian-numbered?", a: "Yes — AU-hosted dialer with local numbers, 1300 routing, call recording in both tiers." },
      { q: "Is pricing in AUD?", a: "Yes — A$2,299/mo and A$6,099/mo flat; GST applied to AU-registered businesses." },
      { q: "What hours do you cover?", a: "AEST/AEDT Mon–Fri 8am–6pm with state-based routing." },
      { q: "What's the commitment?", a: "3-month engagement recommended; no long-term contract, 30 days' notice." },
    ],
  },
  {
    market: "canada",
    route: "/canada/services/managed-revops",
    pricing_href: "/canada/pricing",
    country_name: "Canada",
    coverage_hours: "Mon–Fri, 9am–6pm ET (with PT overlap)",
    compliance_line: "PIPEDA-compliant data handling, CASL-aware email/SMS opt-out, bilingual (EN/FR) consent records.",
    positioning:
      "Canadian RevOps pod triages enquiries across English and French markets, runs CASL-compliant cadences, keeps the pipeline PIPEDA-ready, and ships a weekly CAD report.",
    pain_points: [
      "CASL fines start at $10M — and few teams audit",
      "Bilingual outreach needs two playbooks",
      "Pipeline lives in USD-billed HubSpot",
      "Provincial coverage is impossible solo",
    ],
    kpis: [
      { label: "Bilingual Response Time", value: "< 1 hour" },
      { label: "Contact Rate", value: "88%+" },
      { label: "CASL Compliance", value: "100%" },
      { label: "Forecast Accuracy", value: "85%+ target" },
    ],
    weekly_sops: [
      "Mon — Inbox triage + lead routing",
      "Tue — Follow-up queue execution",
      "Wed — Pipeline hygiene + data cleanup",
      "Thu — Cadence + sequence tuning",
      "Fri — KPI report + next-week plan",
    ],
    tiers: [
      {
        id: "growth-engine",
        name: "Growth Engine",
        price_label: "C$2,049/mo flat",
        price_currency: "CAD",
        popular: true,
        features: [
          "Named Canadian Revenue Specialist (EN + FR)",
          "1-hour response on Canadian inbound (EN/FR)",
          "CASL-compliant email + SMS cadences",
          "Bilingual template management (EN/FR)",
          "Pipeline cleanup + PIPEDA audit trail",
          "Weekly CAD KPI report with narrative",
          "Approval workflow for new templates",
        ],
      },
      {
        id: "revops-partner",
        name: "RevOps Partner",
        price_label: "C$5,499/mo flat",
        price_currency: "CAD",
        features: [
          "Everything in Growth Engine, plus:",
          "Dedicated pod (bilingual Revenue + Automation)",
          "Lead scoring tuned across EN/FR markets",
          "Workflow automation (province routing, FR translation)",
          "Quarterly funnel review with provincial view",
          "CASL governance + suppression-list discipline",
          "Monthly strategy call with named pod lead",
        ],
      },
    ],
    verticals: [
      { vertical: "Canadian Real Estate", href: "/crm-for-real-estate" },
      { vertical: "Mortgage Brokers", href: "/crm-for-mortgage-brokers" },
      { vertical: "HVAC & Home Services", href: "/crm-for-home-services" },
      { vertical: "Financial Advisors (Canada)", href: "/crm-for-financial-advisors" },
      { vertical: "Property Management", href: "/crm-for-property-management" },
      { vertical: "Cleaning Companies", href: "/crm-for-cleaning-companies" },
    ],
    faqs: [
      { q: "Is the team bilingual?", a: "Yes — English and French; Quebec leads get French templates, no machine translation." },
      { q: "Is this CASL + PIPEDA compliant?", a: "Yes — express consent records, opt-out within 10 business days, suppression lists, PIPEDA-aligned handling." },
      { q: "Is pricing in CAD?", a: "Yes — C$2,049/mo and C$5,499/mo billed in CAD; GST/HST as required." },
      { q: "Is the dialer Canadian-numbered?", a: "Yes — Canadian local-presence numbers across provinces, call recording and coaching included." },
      { q: "Can you operate inside HubSpot / Salesforce / Pipedrive?", a: "Yes — adapts to your existing stack; HelloGrowthCRM optional." },
      { q: "What's the commitment?", a: "3-month engagement recommended; no long-term contract, 30 days' notice." },
    ],
  },
  {
    market: "uae",
    route: "/uae/services/managed-revops",
    pricing_href: "/uae/pricing",
    country_name: "the UAE",
    coverage_hours: "Sun–Thu, 9am–6pm GST (UAE work week)",
    compliance_line: "UAE PDPL-aligned data handling, VAT-compliant invoicing, WhatsApp Business compliance, bilingual (Arabic/English) consent.",
    positioning:
      "UAE RevOps pod triages Property Finder + Bayut enquiries, runs Arabic/English WhatsApp Business cadences, syncs to VAT-compliant invoicing, and ships a weekly AED report on the Sun–Thu work week.",
    pain_points: [
      "Property Finder + Bayut leads dropped in minutes",
      "Bilingual outreach (Arabic + English) needs two playbooks",
      "VAT invoicing breaks every Friday",
      "Ramadan + Eid + DSF break linear cadences",
    ],
    kpis: [
      { label: "WhatsApp Response Time", value: "< 10 min" },
      { label: "Contact Rate", value: "90%+" },
      { label: "VAT Invoice Cycle", value: "Same day" },
      { label: "Bilingual Template Coverage", value: "100%" },
    ],
    weekly_sops: [
      "Sun — Property Finder + Bayut intake (Arabic/English)",
      "Mon — WhatsApp + dialer cadence (bilingual)",
      "Tue — VAT quote chase + free-zone routing",
      "Wed — Pipeline hygiene + PDPL audit trail",
      "Thu — AED KPI report + next-week plan",
    ],
    tiers: [
      {
        id: "growth-engine",
        name: "Growth Engine",
        price_label: "AED 5,499/mo flat",
        price_currency: "AED",
        popular: true,
        features: [
          "Named UAE Revenue Specialist (Arabic + English)",
          "10-min WhatsApp response on Property Finder / Bayut",
          "Arabic + English WhatsApp Business cadences",
          "VAT-ready quote chase + TRN-stamped invoices",
          "Free-zone multi-entity routing (JAFZA/DMCC/DAFZA)",
          "Weekly AED KPI report with narrative",
          "Approval workflow for new bilingual templates",
        ],
      },
      {
        id: "revops-partner",
        name: "RevOps Partner",
        price_label: "AED 14,699/mo flat",
        price_currency: "AED",
        features: [
          "Everything in Growth Engine, plus:",
          "Dedicated pod (Arabic + English Revenue + Automation)",
          "UAE lead scoring tuned for Property Finder/Bayut",
          "Workflow automation (free-zone routing, VAT flows)",
          "Quarterly funnel review with brokerage-level view",
          "PDPL governance + bilingual consent playbook",
          "Monthly strategy call with named pod lead",
        ],
      },
    ],
    verticals: [
      { vertical: "UAE Real Estate Brokers", href: "/crm-for-real-estate" },
      { vertical: "UAE Insurance Brokers", href: "/crm-for-insurance-agents" },
      { vertical: "Free-Zone Trading Companies", href: "/crm-for-exporters" },
      { vertical: "Jewellery Stores", href: "/crm-for-jewellery-stores" },
      { vertical: "Immigration Consultants", href: "/crm-for-immigration-consultants" },
      { vertical: "Event Planners (UAE)", href: "/crm-for-event-planners" },
    ],
    faqs: [
      { q: "Does the team work the UAE work week (Sun–Thu)?", a: "Yes — Sun–Thu 9am–6pm GST; weekend inbound gets an automated bilingual acknowledgement." },
      { q: "Do you run WhatsApp Business in Arabic and English?", a: "Yes — every cadence has Arabic-first and English-first variants on the WhatsApp Business API." },
      { q: "Is invoicing VAT-compliant?", a: "Yes — 5% UAE VAT-compliant quotes/invoices with your TRN; bilingual (AR/EN) invoices on request." },
      { q: "Do you handle free-zone multi-entity setups?", a: "Yes — JAFZA, DMCC, DAFZA, RAKEZ multi-entity flows with separate VAT, TRN, and currency handling." },
      { q: "Is pricing in AED?", a: "Yes — AED 5,499/mo and AED 14,699/mo flat, billed in AED with VAT." },
      { q: "What's the commitment?", a: "3-month engagement recommended; no long-term contract, 30 days' notice." },
    ],
  },
  {
    market: "singapore",
    route: "/singapore/services/managed-revops",
    pricing_href: "/singapore/pricing",
    country_name: "Singapore",
    coverage_hours: "Mon–Fri, 9am–6pm SGT (ASEAN-wide coverage)",
    compliance_line: "PDPA-compliant data handling, ACRA-aligned records, multi-currency (SGD/MYR/IDR/THB/VND) cadence, multi-lingual templates.",
    positioning:
      "Singapore RevOps pod runs a multi-currency ASEAN pipeline — English + Mandarin + Bahasa templates, PDPA-ready audit trails, SGT business hours, and a weekly SGD report.",
    pain_points: [
      "ASEAN pipeline lives in 5 currencies",
      "Multi-language templates don't exist yet",
      "PDPA audit + ACRA registration trails need rigor",
      "CBD professional services compete on speed",
    ],
    kpis: [
      { label: "ASEAN Response Time", value: "< 1 hour" },
      { label: "Multi-Currency Pipeline", value: "5 ASEAN FX rates" },
      { label: "PDPA Audit Readiness", value: "100%" },
      { label: "Multi-Lingual Template Coverage", value: "EN + ZH + MS" },
    ],
    weekly_sops: [
      "Mon — Inbox triage + lead routing",
      "Tue — Follow-up queue execution",
      "Wed — Pipeline hygiene + data cleanup",
      "Thu — Cadence + sequence tuning",
      "Fri — KPI report + next-week plan",
    ],
    tiers: [
      {
        id: "growth-engine",
        name: "Growth Engine",
        price_label: "S$1,999/mo flat",
        price_currency: "SGD",
        popular: true,
        features: [
          "Named Singapore Revenue Specialist (SGT coverage)",
          "1-hour response across ASEAN inbound",
          "Multi-language cadences (EN + ZH + MS templates)",
          "Multi-currency pipeline (SGD/MYR/IDR/THB/VND)",
          "Pipeline cleanup + PDPA audit trail",
          "Weekly SGD KPI report with ASEAN breakdown",
          "Approval workflow for new templates",
        ],
      },
      {
        id: "revops-partner",
        name: "RevOps Partner",
        price_label: "S$5,399/mo flat",
        price_currency: "SGD",
        features: [
          "Everything in Growth Engine, plus:",
          "Dedicated pod (Revenue + Automation Specialist)",
          "ASEAN lead scoring tuned by country",
          "Workflow automation (country routing, FX, translation)",
          "Quarterly funnel review with country-level view",
          "PDPA + ACRA governance playbook",
          "Monthly strategy call with named pod lead",
        ],
      },
    ],
    verticals: [
      { vertical: "ASEAN Exporters from SG", href: "/crm-for-exporters" },
      { vertical: "SG Real Estate", href: "/crm-for-real-estate" },
      { vertical: "Financial Advisors (SG)", href: "/crm-for-financial-advisors" },
      { vertical: "Accounting Firms (SG)", href: "/crm-for-accounting-firms" },
      { vertical: "Logistics & Freight", href: "/crm-for-logistics" },
      { vertical: "SaaS Companies (SG)", href: "/crm-for-saas-companies" },
    ],
    faqs: [
      { q: "Does the pod run multi-language cadences?", a: "Yes — English, Mandarin (Simplified), Bahasa Indonesia in every ASEAN cadence; Vietnamese and Thai on request." },
      { q: "Is this PDPA + ACRA aligned?", a: "Yes — PDPA consent records, opt-out, suppression lists, ACRA-aligned audit trails." },
      { q: "Do you handle multi-currency pipelines?", a: "Yes — SGD, MYR, IDR, THB, VND tracked live with daily FX; forecast in SGD with country breakdown." },
      { q: "Is pricing in SGD?", a: "Yes — S$1,999/mo and S$5,399/mo flat, billed in SGD; GST where required." },
      { q: "Can you operate inside HubSpot / Salesforce / Pipedrive?", a: "Yes — adapts to your existing stack; HelloGrowthCRM optional." },
      { q: "What's the commitment?", a: "3-month engagement recommended; no long-term contract, 30 days' notice." },
    ],
  },
  {
    market: "new-zealand",
    route: "/new-zealand/services/managed-revops",
    pricing_href: "/new-zealand/pricing",
    country_name: "New Zealand",
    coverage_hours: "Mon–Fri, 8am–5pm NZST/NZDT",
    compliance_line: "Privacy Act 2020 compliant, NZ data residency on request, GST-compliant invoicing, Unsolicited Electronic Messages Act-aware.",
    positioning:
      "NZ RevOps pod triages enquiries from Auckland to Invercargill, runs SMS + WhatsApp cadences for tradies and property managers, syncs to Xero, and ships a weekly NZD report.",
    pain_points: [
      "Tradies don't open email",
      "Auckland-to-Invercargill coverage is hard solo",
      "Xero + CRM sync needs human supervision",
      "Privacy Act 2020 needs audit trails, not memory",
    ],
    kpis: [
      { label: "NZ Response Time", value: "< 1 hour" },
      { label: "SMS Contact Rate", value: "92%+" },
      { label: "Xero Sync", value: "Same-day" },
      { label: "Privacy Act Audit Readiness", value: "100%" },
    ],
    weekly_sops: [
      "Mon — Inbox triage + lead routing",
      "Tue — Follow-up queue execution",
      "Wed — Pipeline hygiene + data cleanup",
      "Thu — Cadence + sequence tuning",
      "Fri — KPI report + next-week plan",
    ],
    tiers: [
      {
        id: "growth-engine",
        name: "Growth Engine",
        price_label: "NZ$2,499/mo flat",
        price_currency: "NZD",
        popular: true,
        features: [
          "Named Kiwi Revenue Specialist (NZST coverage)",
          "1-hour response on NZ inbound",
          "SMS + WhatsApp + email cadences (UEMA-aware)",
          "Xero sync for closed-won deals",
          "Pipeline cleanup + Privacy Act audit trail",
          "Weekly NZD KPI report with narrative",
          "Approval workflow for new templates",
        ],
      },
      {
        id: "revops-partner",
        name: "RevOps Partner",
        price_label: "NZ$6,649/mo flat",
        price_currency: "NZD",
        features: [
          "Everything in Growth Engine, plus:",
          "Dedicated pod (Revenue + Automation Specialist)",
          "NZ lead scoring tuned per service line",
          "Workflow automation (regional routing, SMS-first cadences)",
          "Quarterly funnel review with regional view",
          "Privacy Act 2020 governance playbook",
          "Monthly strategy call with named pod lead",
        ],
      },
    ],
    verticals: [
      { vertical: "NZ Tradies (plumbers, sparkies, builders)", href: "/crm-for-plumbers" },
      { vertical: "NZ Property Management", href: "/crm-for-property-management" },
      { vertical: "Kiwi Agencies & Consultancies", href: "/agency-crm" },
      { vertical: "NZ Real Estate", href: "/crm-for-real-estate" },
      { vertical: "Accounting Firms (NZ)", href: "/crm-for-accounting-firms" },
      { vertical: "Mortgage Brokers (NZ)", href: "/crm-for-mortgage-brokers" },
    ],
    faqs: [
      { q: "Is the team NZ-based?", a: "NZST/NZDT business hours Mon–Fri 8am–5pm; trained on Xero, MYOB, NZ real-estate portals, SMS-first tradie cadences." },
      { q: "Is this Privacy Act 2020 + UEMA compliant?", a: "Yes — consent records, opt-out within 5 working days, suppression management." },
      { q: "Do you sync to Xero?", a: "Yes — closed-won deals push to Xero as draft invoices same business day." },
      { q: "Is pricing in NZD?", a: "Yes — NZ$2,499/mo and NZ$6,649/mo flat, billed in NZD with GST." },
      { q: "Is the dialer NZ-numbered?", a: "Yes — NZ local-presence numbers, call recording, call coaching in both tiers." },
      { q: "What's the commitment?", a: "3-month engagement recommended; no long-term contract, 30 days' notice." },
    ],
  },
];

// ── Managed RevOps — US city landing pages ───────────────────────────────────

// All 25 /managed-revops-<slug> city pages (uniform USD offer on every page).
const REVOPS_CITIES: ReadonlyArray<{ slug: string; city: string }> = [
  { slug: "atlanta", city: "Atlanta" },
  { slug: "austin", city: "Austin" },
  { slug: "boston", city: "Boston" },
  { slug: "charlotte", city: "Charlotte" },
  { slug: "chicago", city: "Chicago" },
  { slug: "columbus", city: "Columbus" },
  { slug: "dallas", city: "Dallas" },
  { slug: "denver", city: "Denver" },
  { slug: "detroit", city: "Detroit" },
  { slug: "houston", city: "Houston" },
  { slug: "indianapolis", city: "Indianapolis" },
  { slug: "los-angeles", city: "Los Angeles" },
  { slug: "miami", city: "Miami" },
  { slug: "minneapolis", city: "Minneapolis" },
  { slug: "nashville", city: "Nashville" },
  { slug: "new-york", city: "New York" },
  { slug: "philadelphia", city: "Philadelphia" },
  { slug: "phoenix", city: "Phoenix" },
  { slug: "portland", city: "Portland" },
  { slug: "salt-lake-city", city: "Salt Lake City" },
  { slug: "san-antonio", city: "San Antonio" },
  { slug: "san-diego", city: "San Diego" },
  { slug: "san-francisco", city: "San Francisco" },
  { slug: "seattle", city: "Seattle" },
  { slug: "tampa", city: "Tampa" },
];

// Shared offer details on every city page (mirrored from the city page templates).
const CITY_SHARED_OFFER = {
  service_type: "Managed Revenue Operations (Service schema, areaServed: City, US)",
  delivery: "100% remote — Revenue Specialists operate inside your HelloGrowthCRM instance during US business hours.",
  tiers: [
    { name: "Growth Engine", price: "$1,499/mo", summary: "Named Revenue Specialist, same-business-day SLA on inbound, email & SMS sequence execution, pipeline cleanup, weekly KPI report." },
    { name: "RevOps Partner", price: "$3,999/mo", summary: "Everything in Growth Engine plus a dedicated automation specialist, lead-scoring tuning, quarterly funnel reviews, and a monthly strategy call." },
  ],
  onboarding: "Most clients are live within 5–7 business days of signing; first weekly pipeline report arrives in week two.",
  cta: "https://calendly.com/hellogrowthcrm-sales/demo",
};

// Related service routes verified under src/app/(public)/ — SYNCED_AT 2026-07-08.
const RELATED_OFFERINGS = [
  { route: "/managed-crm-service", name: "Managed CRM Service" },
  { route: "/fractional-revops", name: "Fractional RevOps" },
  { route: "/free-revops-audit", name: "Free RevOps Audit" },
  { route: "/revops", name: "RevOps Hub" },
  { route: "/what-is-revops", name: "What is RevOps? (guide)" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tools
// ─────────────────────────────────────────────────────────────────────────────

export const solutionsListWhatsappUseCases = defineTool({
  schema: z.object({}),
  definition: {
    name: "solutions_list_whatsapp_use_cases",
    description:
      "List the WhatsApp CRM message use cases built into HelloGrowthCRM's WhatsApp composer: general message, follow-up, meeting reminder, document request/share, and notification with link — each with its message template pattern. Messages are sent via wa.me deep links with prefilled, personalized text.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  async handle(_args) {
    return ok({
      synced_at: SYNCED_AT,
      feature_url: "https://hellogrowthcrm.com/features/whatsapp-crm",
      count: WHATSAPP_USE_CASES.length,
      use_cases: WHATSAPP_USE_CASES,
      notes: [
        "Placeholders available per template: lead first name, sender name, company name, subject, body, URL, document type, document note.",
        "The composer builds https://wa.me/<number>?text=<encoded message> links from the lead's phone number.",
      ],
    });
  },
});

export const solutionsGetManagedRevops = defineTool({
  schema: z.object({
    city: z
      .string()
      .optional()
      .describe('Optional US city slug for the /managed-revops-<slug> landing page, e.g. "atlanta", "new-york", "salt-lake-city". Omit for the full service overview.'),
  }),
  definition: {
    name: "solutions_get_managed_revops",
    description:
      "HelloGrowthCRM Managed RevOps service (done-for-you revenue operations). Without arguments: full service overview — what's included, weekly SOPs, KPIs, who it's for, pricing tiers across all 9 market pages (global, India, USA, UK, Australia, Canada, UAE, Singapore, New Zealand), all 25 US city landing pages, and related offerings (managed-crm-service, fractional-revops, free-revops-audit). With a `city` slug: that city page's summary and offer.",
    inputSchema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: 'US city slug, e.g. "atlanta" or "san-francisco". Omit for the overview.',
        },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    if (args.city) {
      const slug = args.city.trim().toLowerCase().replaceAll(/\s+/g, "-");
      const entry = REVOPS_CITIES.find((c) => c.slug === slug);
      if (!entry) {
        return fail(
          `Unknown city "${args.city}". Valid city slugs: ${REVOPS_CITIES.map((c) => c.slug).join(", ")}`,
        );
      }
      return ok({
        synced_at: SYNCED_AT,
        city: entry.city,
        slug: entry.slug,
        url: `https://hellogrowthcrm.com/managed-revops-${entry.slug}`,
        summary: `Done-for-you revenue operations for ${entry.city} small businesses: lead follow-up, pipeline hygiene, SLA-based response, and weekly reporting from $1,499/mo.`,
        offer: CITY_SHARED_OFFER,
        national_service_page: "https://hellogrowthcrm.com/usa/services/managed-revops",
      });
    }

    const globalMarket = REVOPS_MARKETS[0];
    return ok({
      synced_at: SYNCED_AT,
      service: "Managed RevOps — done-for-you revenue operations by HelloGrowthCRM",
      overview: {
        what_it_is: globalMarket?.positioning,
        whats_included: globalMarket?.tiers,
        weekly_sops: globalMarket?.weekly_sops,
        kpis: globalMarket?.kpis,
        who_its_for:
          "Sales teams and small businesses without RevOps bandwidth — see per-market vertical lists. Engagements: 3-month recommendation, no long-term contract, 30 days' notice to pause or cancel.",
        faqs: globalMarket?.faqs,
      },
      markets: {
        count: REVOPS_MARKETS.length,
        note: "Each market page localizes pricing, compliance, SOPs, KPIs, verticals, and FAQs. Prose condensed in this mirror; all rows preserved.",
        items: REVOPS_MARKETS,
      },
      city_pages: {
        count: REVOPS_CITIES.length,
        note: "US city landing pages share a uniform USD offer (Growth Engine $1,499/mo, RevOps Partner $3,999/mo). Pass `city` for a specific page.",
        cities: REVOPS_CITIES.map((c) => ({
          city: c.city,
          slug: c.slug,
          route: `/managed-revops-${c.slug}`,
        })),
      },
      related_offerings: RELATED_OFFERINGS,
    });
  },
});
