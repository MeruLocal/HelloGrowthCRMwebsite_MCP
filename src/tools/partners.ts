import { z } from "zod";
import { defineTool, ok } from "./tool-types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Static data — READ-MIRROR of the partner program sources.
// Source: hellocrmwebsite/src/lib/partner-program-content.ts — SYNCED_AT 2026-06-11
// Source: hellocrmwebsite/src/lib/partner-apply-schema.ts — SYNCED_AT 2026-06-11
// Source: hellocrmwebsite/src/app/(public)/partners/page.tsx (metadata) — SYNCED_AT 2026-06-11
// Route verified: /partners exists under src/app/(public)/.
// ─────────────────────────────────────────────────────────────────────────────

const SYNCED_AT = "2026-06-11";

const PROGRAM_OVERVIEW = {
  url: "https://hellogrowthcrm.com/partners",
  // From /partners page metadata + partner FAQs:
  headline: "Partner Program: Earn 50% Revenue in Year 1",
  commission: {
    year_1: "50% revenue share on paid customer referrals",
    year_2_onwards: "15% recurring revenue share",
    eligibility:
      "Revenue share applies after the referral becomes a paying customer on an eligible HelloGrowthCRM plan and the partner account is approved and activated. Free-plan users do not generate revenue share until they upgrade.",
  },
  how_it_works: [
    "Apply via the form on /partners — the program is approval-based and every application is reviewed.",
    "Approved partners sign a written agreement covering revenue share, compliance, branding, and confidentiality before activation.",
    "After approval and agreement execution, a partner tracking code is assigned so referrals are attributed correctly.",
    "Partners complete a certification that covers the product knowledge needed — no prior CRM implementation experience required.",
    "Partner reporting / payout statements are being built out in line with the HelloGrowthCRM roadmap; activated partners receive tracking guidance.",
  ],
  who_can_apply:
    "Sales consultants, CRM consultants/implementers, digital marketing agencies, IT resellers/VARs, business advisors/coaches, chartered accountants, and independent consultants with an active SMB client base. Partners outside India are welcome — agreement terms account for currency, taxes, and local payout methods. Most current partners serve Indian SMBs, where WhatsApp, IndiaMART, and Tally integrations are strongest.",
  featured_partners_note:
    "The /partners page also shows a featured partner directory (database-backed, up to 6 featured entries) with tier, type, location, industries, and certifications.",
};

// Mirrors PARTNER_FAQS (8 Q&A pairs, shown on /partners + JSON-LD source).
const PARTNER_FAQS: Array<{ q: string; a: string }> = [
  {
    q: "When do I qualify for revenue share?",
    a: "Revenue share applies after your referral becomes a paying customer on an eligible HelloGrowthCRM plan, and your partner account is approved and activated. Approved partners earn 50% in Year 1 and 15% recurring from Year 2 onwards. Payout timing and thresholds are described in the partner agreement.",
  },
  {
    q: "Do I earn on unpaid customers?",
    a: "No. Commissions apply to paid subscription revenue from customers you refer. Free-plan users do not generate partner revenue share until they upgrade to a paid plan.",
  },
  {
    q: "Is approval required?",
    a: "Yes. The program is approval-based. We review every application to ensure a good fit for customers and for our brand. Approval is at HelloGrowthCRM's discretion.",
  },
  {
    q: "When do I receive my partner code?",
    a: "After you are approved and your agreement is executed, we assign your partner tracking code so referrals can be attributed correctly.",
  },
  {
    q: "Do I need to sign an agreement?",
    a: "Yes. Approved partners receive a written agreement that covers revenue share, compliance, branding, and confidentiality before activation.",
  },
  {
    q: "Can I track my referrals later?",
    a: "Yes. We are building partner reporting in line with our HelloGrowthCRM roadmap. Activated partners will receive guidance on tracking and payout statements as the program matures.",
  },
  {
    q: "Do I need technical or CRM implementation experience to apply?",
    a: "No, but it strengthens your application. Many approved partners are chartered accountants or business advisors with no CRM background — the certification covers the product knowledge you need. What matters most is an active client base of small and mid-sized businesses and the credibility to recommend operational tools to them.",
  },
  {
    q: "Can partners outside India join the program?",
    a: "Yes. The application form accepts partners from dozens of countries, and the agreement terms account for currency, taxes, and local payout methods. Most current partners serve Indian SMBs, where HelloGrowthCRM's WhatsApp, IndiaMART, and Tally integrations are strongest, but agencies and consultants serving SMB clients elsewhere are welcome to apply.",
  },
];

// Mirrors partnerApplySchema (zod) from partner-apply-schema.ts — documented as
// form fields with type, required flag, options, and validation notes.
type ApplicationField = {
  name: string;
  label_group: string;
  type: string;
  required: boolean;
  options?: ReadonlyArray<string>;
  validation?: string;
  default?: string | string[];
};

const APPLICATION_FIELDS: ApplicationField[] = [
  // Applicant details
  { name: "full_name", label_group: "Applicant details", type: "string", required: true, validation: "2–200 chars" },
  { name: "email", label_group: "Applicant details", type: "string (email)", required: true, validation: "valid email, ≤320 chars" },
  { name: "phone_country_code", label_group: "Applicant details", type: "string", required: false, default: "+91", validation: "1–10 chars" },
  { name: "mobile", label_group: "Applicant details", type: "string", required: true, validation: "4–40 chars" },
  { name: "country", label_group: "Applicant details", type: "string", required: true, validation: "2–120 chars" },
  { name: "city", label_group: "Applicant details", type: "string", required: true, validation: "1–120 chars" },
  { name: "linkedin_url", label_group: "Applicant details", type: "string (url)", required: false, validation: "≤2000 chars; https:// prefixed automatically" },
  // Firm / business
  { name: "company_name", label_group: "Firm / business", type: "string", required: true, validation: "1–200 chars" },
  { name: "website", label_group: "Firm / business", type: "string (url)", required: false, validation: "≤2000 chars; https:// prefixed automatically" },
  {
    name: "business_type",
    label_group: "Firm / business",
    type: "enum",
    required: true,
    options: ["Sole practitioner", "Partnership firm", "Private limited company", "LLP", "Other"],
  },
  {
    name: "years_in_practice",
    label_group: "Firm / business",
    type: "enum",
    required: true,
    options: ["Less than 1 year", "1–3 years", "3–5 years", "5–10 years", "10+ years"],
  },
  // Professional background
  {
    name: "primary_role",
    label_group: "Professional background",
    type: "enum",
    required: true,
    options: [
      "Sales Consultant",
      "Business Development Manager",
      "CRM Consultant / Implementer",
      "Digital Marketing Agency",
      "IT Reseller / VAR",
      "Business Advisor / Coach",
      "Independent Consultant",
      "Chartered Accountant (CA)",
      "Other",
    ],
  },
  { name: "ca_membership", label_group: "Professional background", type: "string", required: false, validation: "≤100 chars (CA membership number, if applicable)" },
  {
    name: "areas_of_expertise",
    label_group: "Professional background",
    type: "enum[] (multi-select)",
    required: true,
    options: [
      "CRM Implementation",
      "Sales Process Design",
      "Lead Generation",
      "Digital Marketing",
      "Customer Success",
      "Revenue Operations",
      "Business Development",
      "Other",
    ],
    validation: "select at least one",
  },
  // Client base
  {
    name: "approx_active_clients",
    label_group: "Client base",
    type: "enum",
    required: true,
    options: ["1–10", "11–50", "51–100", "101–500", "500+"],
  },
  {
    name: "typical_client_segment",
    label_group: "Client base",
    type: "enum",
    required: true,
    options: ["Startups", "SMBs", "Mid-market", "Enterprises", "Individuals / Freelancers", "Mixed"],
  },
  {
    name: "expected_onboardings",
    label_group: "Client base",
    type: "enum",
    required: true,
    options: ["1–3", "4–10", "11–25", "25+"],
  },
  // Tools & integrations
  {
    name: "crm_tools",
    label_group: "Tools & integrations",
    type: "enum[] (multi-select)",
    required: true,
    options: [
      "Salesforce",
      "HubSpot",
      "Zoho CRM",
      "Freshsales",
      "Pipedrive",
      "Microsoft Dynamics",
      "Spreadsheets / No CRM",
      "Other",
    ],
    validation: "select at least one",
  },
  {
    name: "interested_in_beta",
    label_group: "Tools & integrations",
    type: "string (enum-like)",
    required: false,
    options: ["Yes, sign me up", "Maybe later", "Prefer not to say"],
    default: "Prefer not to say",
  },
  {
    name: "preferred_payout_method",
    label_group: "Tools & integrations",
    type: "string (enum-like)",
    required: false,
    options: ["Bank transfer (NEFT/RTGS)", "UPI", "Cheque", "Other"],
  },
  // Partnership intent
  { name: "message", label_group: "Partnership intent", type: "string (textarea)", required: true, validation: "20–8000 chars — tell us about your practice" },
  { name: "how_did_you_hear", label_group: "Partnership intent", type: "string", required: false, validation: "≤500 chars" },
  // Consents
  { name: "consent", label_group: "Consents", type: "boolean", required: true, validation: "must be true — agree to Privacy Policy and Terms & Conditions" },
  { name: "consent_certification", label_group: "Consents", type: "boolean", required: true, validation: "must be true — confirm the certification requirement" },
  // Hidden / meta
  { name: "products_interested", label_group: "Hidden / meta", type: "enum[]", required: false, options: ["HelloGrowthCRM"], default: ["HelloGrowthCRM"] },
  { name: "utm_source", label_group: "Hidden / meta", type: "string", required: false, validation: "≤120 chars" },
  { name: "utm_medium", label_group: "Hidden / meta", type: "string", required: false, validation: "≤120 chars" },
  { name: "utm_campaign", label_group: "Hidden / meta", type: "string", required: false, validation: "≤120 chars" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tools
// ─────────────────────────────────────────────────────────────────────────────

export const partnersGetProgram = defineTool({
  schema: z.object({}),
  definition: {
    name: "partners_get_program",
    description:
      "HelloGrowthCRM Partner Program details (route: /partners): commission structure (50% revenue share in Year 1, 15% recurring from Year 2 on paid referrals), approval and agreement process, partner tracking code, certification requirement, who can apply, and the 8 official program FAQs.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  async handle(_args) {
    return ok({
      synced_at: SYNCED_AT,
      program: PROGRAM_OVERVIEW,
      faq_count: PARTNER_FAQS.length,
      faqs: PARTNER_FAQS,
    });
  },
});

export const partnersGetApplicationSchema = defineTool({
  schema: z.object({}),
  definition: {
    name: "partners_get_application_schema",
    description:
      "Partner program application form schema — every field (name, group, type, required flag, allowed options, validation) mirrored from the website's partner-apply-schema.ts. Documents HOW to apply: the form is submitted on the /partners page; this MCP server does not submit partner applications directly.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  async handle(_args) {
    return ok({
      synced_at: SYNCED_AT,
      apply_url: "https://hellogrowthcrm.com/partners",
      field_count: APPLICATION_FIELDS.length,
      fields: APPLICATION_FIELDS,
      submission_note:
        "Submission happens via the application form on the /partners page (stored to the website database and emailed to the partnerships team). The generic forms_submit tool on this server targets website contact/lead forms — for partner applications, direct applicants to the /partners page so all required consents and enum fields are captured correctly.",
    });
  },
});
