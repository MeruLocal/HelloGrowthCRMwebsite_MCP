import { z } from "zod";
import { defineTool, fail, ok } from "./tool-types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Static data — sourced from hellocrmwebsite/src/views/ToolsHub.tsx,
// src/lib/india-tool-pages.ts, and src/lib/seo-content-tool-pages.ts
// ─────────────────────────────────────────────────────────────────────────────

const COMPARISONS = [
  { slug: "hubspot", name: "HubSpot" },
  { slug: "salesforce", name: "Salesforce" },
  { slug: "pipedrive", name: "Pipedrive" },
  { slug: "zoho", name: "Zoho CRM" },
  { slug: "monday-crm", name: "Monday CRM" },
  { slug: "freshsales", name: "Freshsales" },
  { slug: "close-crm", name: "Close CRM" },
  { slug: "wati", name: "Wati" },
  { slug: "aisensy", name: "AiSensy" },
  { slug: "interakt", name: "Interakt" },
  { slug: "hellocrm-vs-hubspot", name: "HubSpot (alternate)" },
  { slug: "hellocrm-vs-pipedrive", name: "Pipedrive (alternate)" },
  { slug: "best-crm-for-small-business", name: "Best CRM for Small Business" },
  { slug: "leadsquared", name: "LeadSquared" },
];

const INDUSTRIES = [
  "Real Estate", "Legal", "Healthcare", "Manufacturing", "SaaS",
  "Recruitment", "Finance", "Construction", "Education", "Insurance",
  "Retail", "E-commerce", "Hospitality", "Logistics", "Automotive",
  "Professional Services", "Non-Profit", "Technology", "Media", "Consulting",
];

// All 118 free tools — exact titles from ToolsHub.tsx + india-tool-pages.ts + seo-content-tool-pages.ts
const TOOLS_PAGES: Array<{ slug: string; title: string; desc: string; category: string }> = [
  // ── Pipeline & Revenue Ops ─────────────────────────────────────────────────
  { slug: "pipeline-health-score", title: "Pipeline Health Score", desc: "Grade your pipeline health in 2 minutes. Get a score and fix checklist.", category: "ops" },
  { slug: "sales-roi-calculator", title: "Sales ROI Calculator", desc: "Calculate the revenue impact of improving your sales process.", category: "ops" },
  { slug: "crm-roi-calculator", title: "CRM ROI Calculator", desc: "Calculate the revenue impact of adopting a CRM for your sales team.", category: "ops" },
  { slug: "crm-value-calculator", title: "CRM Value Calculator", desc: "Estimate how much revenue poor follow-up, manual work, and low win rates are costing your team.", category: "ops" },
  { slug: "deal-velocity-calculator", title: "Deal Velocity Calculator", desc: "Measure pipeline revenue velocity with built-in sensitivity analysis.", category: "ops" },
  { slug: "sales-pipeline-calculator", title: "Sales Pipeline Calculator", desc: "Model pipeline stages, conversion rates, and forecast revenue.", category: "ops" },
  { slug: "sales-pipeline-template", title: "Sales Pipeline Template", desc: "Build a CRM pipeline with custom stages, close probabilities, and stage-by-stage sales flow.", category: "ops" },
  { slug: "forecast-accuracy", title: "Forecast Accuracy Tracker", desc: "Track and improve sales forecast accuracy with trend visualization.", category: "ops" },
  { slug: "sales-forecast-simulator", title: "Sales Forecast Simulator", desc: "Model conservative, realistic, and optimistic forecast scenarios.", category: "ops" },
  { slug: "funnel-leakage", title: "Funnel Leakage Calculator", desc: "See where your pipeline drops off and which bottleneck costs the most revenue.", category: "ops" },
  { slug: "revenue-goal-calculator", title: "Revenue Goal Calculator", desc: "Reverse-engineer the sales activity needed to hit your revenue target.", category: "ops" },
  { slug: "win-loss-analysis", title: "Win/Loss Analysis", desc: "Structured deal reviews with pattern detection and actionable takeaways.", category: "ops" },
  { slug: "deal-win-rate-calculator", title: "Deal Win Rate Calculator", desc: "Calculate win rate, loss rate, and no-decision rate and compare your team against B2B benchmarks.", category: "ops" },
  { slug: "sales-conversion-calculator", title: "Sales Conversion Calculator", desc: "Model how conversion-rate improvements change pipeline coverage, win volume, and revenue.", category: "ops" },
  { slug: "sales-metrics-dashboard", title: "Sales Metrics Dashboard", desc: "Public anonymized sales benchmarks dashboard with signup-gated detail.", category: "ops" },

  // ── Lead & ICP ────────────────────────────────────────────────────────────
  { slug: "lead-scoring-calculator", title: "Lead Scoring Calculator", desc: "Build a custom lead scoring model. Assign weights and export.", category: "ai" },
  { slug: "lead-scoring-template", title: "Lead Scoring Template", desc: "Build your own lead scoring model with weights and export.", category: "ai" },
  { slug: "lead-score-calculator", title: "Lead Qualification Scorecard", desc: "Score any lead across company size, industry, role, and engagement.", category: "ai" },
  { slug: "icp-scorecard", title: "ICP Scorecard Builder", desc: "Build a weighted Ideal Customer Profile scorecard and score prospects.", category: "ai" },
  { slug: "icp-builder", title: "Ideal Customer Profile Builder", desc: "Build a consistent ICP with firmographics, pain points, buying signals, and qualification criteria.", category: "ai" },
  { slug: "buyer-persona-generator", title: "Buyer Persona Generator", desc: "AI-powered B2B buyer persona builder with messaging and objection scripts.", category: "ai" },
  { slug: "lead-response-time", title: "Lead Response Time Impact Calculator", desc: "Estimate how response speed affects lead conversion, pipeline creation, and revenue.", category: "ops" },

  // ── Outreach & Cadence ────────────────────────────────────────────────────
  { slug: "follow-up-cadence-builder", title: "Follow-Up Cadence Builder", desc: "Build a multi-channel follow-up schedule and export as CSV.", category: "communication" },
  { slug: "follow-up-roi", title: "Follow-Up ROI Calculator", desc: "Model how much pipeline and revenue you lose when leads do not get timely follow-up.", category: "ops" },
  { slug: "outreach-frequency", title: "Outreach Frequency Optimizer", desc: "Get the exact follow-up cadence for your deal size, industry, and motion.", category: "communication" },
  { slug: "objection-handler", title: "Sales Objection Handler", desc: "AI-generated response strategies for common sales objections with practice mode.", category: "ai" },
  { slug: "battle-card-builder", title: "Battle Card Builder", desc: "Build competitive battle cards with strengths, weaknesses, and killer questions.", category: "communication" },
  { slug: "ab-test-planner", title: "A/B Test Planner", desc: "Plan outbound sequence tests with statistical significance calculations.", category: "communication" },
  { slug: "meeting-prep", title: "Meeting Prep Assistant", desc: "AI-powered meeting prep with company overview, questions, and agenda.", category: "ai" },

  // ── Email Tools ───────────────────────────────────────────────────────────
  { slug: "email-subject-line-generator", title: "Email Subject Line Generator", desc: "AI-powered subject lines that get opens.", category: "ai" },
  { slug: "subject-line-tester", title: "Subject Line Tester", desc: "Score any cold email subject line across 6 dimensions instantly.", category: "ai" },
  { slug: "subject-line-scorer", title: "Email Subject Line Scorer", desc: "Score subject lines for length, personalization, spam risk, and open-rate impact before sending.", category: "ai" },
  { slug: "cold-email-generator", title: "Cold Email Generator", desc: "Generate outbound emails tailored to persona, pain point, and offer.", category: "ai" },
  { slug: "cold-email-templates", title: "Cold Email Templates", desc: "20+ proven cold email templates for B2B sales.", category: "communication" },
  { slug: "follow-up-email-generator", title: "Follow-Up Email Generator", desc: "Create timely follow-up emails for no-response, proposal, and next-step scenarios.", category: "ai" },
  { slug: "email-personalization", title: "Email Personalization Generator", desc: "Generate personalized cold email variants from a prospect's company and role.", category: "ai" },
  { slug: "email-open-rate-calculator", title: "Email Open Rate Calculator", desc: "Calculate email open, click-through, and unsubscribe rates and compare them to benchmarks.", category: "communication" },
  { slug: "email-sequence-planner", title: "Email Sequence Planner", desc: "Plan cold outreach, nurture, win-back, and onboarding sequences with timing, CTA, and exportable steps.", category: "communication" },
  { slug: "sales-email-analyzer", title: "Sales Email Analyzer", desc: "Score any sales email across 8 dimensions with instant AI-powered analysis.", category: "ai" },
  { slug: "email-signature-generator", title: "Email Signature Generator", desc: "Create a clean outbound signature with contact details and CTA.", category: "communication" },
  { slug: "ai-email-writer", title: "AI Email Writer (Standalone)", desc: "Hub for free AI email tools: personalization, cold email, follow-ups, analysis.", category: "ai" },

  // ── Calls & Scripts ───────────────────────────────────────────────────────
  { slug: "dialer-roi-calculator", title: "Dialer ROI Calculator", desc: "Calculate the revenue impact of a built-in CRM dialer.", category: "communication" },
  { slug: "call-script-builder", title: "Call Script Builder", desc: "Word-for-word scripts for discovery, demo, and closing calls.", category: "communication" },
  { slug: "sales-script-generator", title: "Sales Script Generator", desc: "AI-powered cold call and discovery call scripts.", category: "ai" },

  // ── Messaging ─────────────────────────────────────────────────────────────
  { slug: "whatsapp-message-template-generator", title: "WhatsApp Message Template Generator", desc: "Sales and support message drafts with placeholders.", category: "communication" },
  { slug: "whatsapp-business-roi-calculator", title: "WhatsApp Business ROI Calculator", desc: "Estimate revenue lift from faster WhatsApp follow-up and conversion gains.", category: "communication" },

  // ── Meetings & Notes ──────────────────────────────────────────────────────
  { slug: "meeting-notes-summarizer", title: "Meeting Notes Summarizer", desc: "Summary and action items from notes — runs in your browser.", category: "ai" },
  { slug: "meeting-summarizer", title: "Meeting Notes AI Summarizer", desc: "AI meeting summarizer with action items and follow-ups.", category: "ai" },

  // ── Positioning & Messaging ───────────────────────────────────────────────
  { slug: "elevator-pitch-generator", title: "Elevator Pitch Generator", desc: "Build concise pitch variations for intros, demos, and outbound conversations.", category: "ai" },
  { slug: "value-proposition-generator", title: "Value Proposition Generator", desc: "Turn product capabilities into clear outcome-focused positioning and messaging.", category: "ai" },
  { slug: "competitor-comparison", title: "Competitor Comparison Widget", desc: "Compare HelloGrowthCRM against top CRMs with a shareable URL.", category: "ops" },

  // ── CRM Selection & Readiness ─────────────────────────────────────────────
  { slug: "crm-comparison-quiz", title: "CRM Comparison Quiz", desc: "Answer 5 questions and get a personalized CRM recommendation.", category: "free" },
  { slug: "crm-readiness", title: "CRM Readiness Quiz", desc: "15-question readiness assessment with personalized recommendations.", category: "ops" },
  { slug: "crm-migration-checklist", title: "CRM Migration Checklist", desc: "Step-by-step checklist for migrating CRMs safely.", category: "free" },
  { slug: "hubspot-migration", title: "HubSpot Migration Helper", desc: "CSV mapping preview and validation for HubSpot migration.", category: "ops" },
  { slug: "crm-buyer-guide", title: "CRM Buyer Guide Generator", desc: "15-question CRM buyer quiz with personalized recommendation PDF.", category: "ops" },
  { slug: "crm-buyers-guide-generator", title: "CRM Buyer's Guide Generator", desc: "Interactive checklist: requirements, vendor shortlist, rollout — print or PDF.", category: "ops" },
  { slug: "crm-health-check", title: "CRM Health Check Tool", desc: "Upload CSV to score duplicates, completeness, and freshness.", category: "ops" },
  { slug: "data-health-checker", title: "CRM Data Health Checker", desc: "Upload a CSV and get an instant data quality audit — 100% client-side.", category: "ops" },

  // ── Sales Team & Quota ────────────────────────────────────────────────────
  { slug: "sales-quota-calculator", title: "Sales Quota Calculator", desc: "Set fair sales quotas with ramp time, attainment expectations, and OTE guidance built in.", category: "ops" },
  { slug: "sales-activity-calculator", title: "Sales Activity Calculator", desc: "Calculate daily call and email targets needed to hit your annual revenue goals.", category: "ops" },
  { slug: "sales-velocity-calculator", title: "Sales Velocity Calculator", desc: "Measure how fast deals move through your pipeline and how much revenue you generate over time.", category: "ops" },
  { slug: "sales-cycle-benchmark", title: "Sales Cycle Benchmark", desc: "See how long your sales cycle should take based on industry and deal profile.", category: "ops" },
  { slug: "commission-calculator", title: "Commission Calculator", desc: "Model flat, tiered, and accelerator commission structures. Compare plans.", category: "ops" },
  { slug: "rep-performance-scorecard", title: "Sales Rep Performance Scorecard", desc: "Score reps by attainment, activity, conversion rate, and coaching signals in one manager-ready view.", category: "ops" },
  { slug: "sales-territory-planner", title: "Sales Territory Planner", desc: "Balance account allocation, rep capacity, and quota coverage across territories.", category: "ops" },
  { slug: "sales-hiring-assessment", title: "Sales Hiring Assessment", desc: "Six questions to clarify SDR vs AE vs leadership hiring fit.", category: "ops" },
  { slug: "sales-playbooks", title: "Sales Playbooks Library", desc: "100+ downloadable playbook templates by stage and industry.", category: "ops" },

  // ── RevOps & Strategy ─────────────────────────────────────────────────────
  { slug: "revops-maturity-assessment", title: "RevOps Maturity Assessment", desc: "Assess your revenue operations maturity. Get a score and roadmap.", category: "ops" },
  { slug: "okr-tracker", title: "OKR Goal Tracker", desc: "Track objectives, key results, owners, and review cadence with exportable progress reports.", category: "ops" },
  { slug: "roi-benchmark-report", title: "ROI Benchmark Report Generator", desc: "Generate a personalized benchmark report to compare your CRM performance against industry norms.", category: "ops" },

  // ── Customer Success ──────────────────────────────────────────────────────
  { slug: "customer-health-score", title: "Customer Health Score Calculator", desc: "Score account health across multiple dimensions to spot churn risk and expansion potential early.", category: "ai" },
  { slug: "nps-calculator", title: "NPS Calculator", desc: "Calculate Net Promoter Score instantly and compare your result against standard benchmark bands.", category: "ops" },
  { slug: "churn-rate-calculator", title: "Churn Rate Calculator", desc: "Calculate customer churn, annualized churn, and revenue impact from lost accounts.", category: "ops" },
  { slug: "churn-impact-calculator", title: "Churn Impact Calculator", desc: "See the true revenue cost of churn and how much you'd save by reducing it.", category: "ops" },
  { slug: "clv-calculator", title: "CLV Calculator", desc: "Customer lifetime value from AOV, frequency, lifespan, and margin.", category: "ops" },
  { slug: "mrr-calculator", title: "MRR Calculator", desc: "Calculate monthly recurring revenue, net new MRR, growth, and ARR for your SaaS business.", category: "ops" },

  // ── SaaS & Pricing ────────────────────────────────────────────────────────
  { slug: "saas-pricing-calculator", title: "SaaS Pricing Calculator", desc: "Work backwards from your revenue target to find the right SaaS price.", category: "ops" },
  { slug: "cac-calculator", title: "CAC Calculator", desc: "Calculate your Customer Acquisition Cost, LTV:CAC ratio, and payback period.", category: "ops" },
  { slug: "payback-period-calculator", title: "CAC Payback Period Calculator", desc: "Calculate how many months it takes to recover customer acquisition cost and benchmark your payback period.", category: "ops" },

  // ── Invoicing & Billing ───────────────────────────────────────────────────
  { slug: "invoice-generator", title: "Invoice Generator", desc: "Create and download invoice PDFs instantly.", category: "ops" },
  { slug: "invoice-template-generator", title: "Invoice Template Generator", desc: "Line items, tax, and print or save as PDF.", category: "ops" },
  { slug: "invoice-quote-generator", title: "Invoice & Quote Generator", desc: "GST, printable invoices, and CPQ proposals — links to all free generators.", category: "ops" },
  { slug: "gst-invoice-generator", title: "GST Invoice Generator", desc: "Printable GST tax invoice with HSN and CGST/SGST or IGST split (India).", category: "ops" },

  // ── India Finance & Compliance ────────────────────────────────────────────
  { slug: "gst-calculator", title: "GST Calculator", desc: "Calculate inclusive or exclusive GST with CGST/SGST or IGST split.", category: "ops" },
  { slug: "tds-calculator", title: "TDS Calculator", desc: "Estimate TDS deduction, threshold impact, and net payment amount.", category: "ops" },
  { slug: "salary-calculator-india", title: "Salary Calculator India", desc: "Estimate average in-hand salary from annual CTC, EPF, and tax regime assumptions.", category: "ops" },
  { slug: "hra-calculator", title: "HRA Calculator", desc: "Estimate exempt and taxable HRA from salary, rent, and metro status.", category: "ops" },
  { slug: "income-tax-calculator-india", title: "Income Tax Calculator India", desc: "Compare old and new regime tax estimates with cess and taxable income.", category: "ops" },
  { slug: "pf-calculator", title: "PF Calculator", desc: "Calculate employee and employer EPF contributions with or without the wage ceiling.", category: "ops" },
  { slug: "gratuity-calculator", title: "Gratuity Calculator", desc: "Estimate gratuity from last drawn salary and years of service.", category: "ops" },
  { slug: "business-loan-emi-calculator", title: "Business Loan EMI Calculator", desc: "Estimate EMI, total interest, processing fee, and total borrowing cost.", category: "ops" },
  { slug: "invoice-number-generator", title: "Invoice Number Generator", desc: "Generate invoice number formats with prefix, branch, date, and sequence.", category: "ops" },
  { slug: "hsn-code-finder", title: "HSN Code Finder", desc: "Search a curated set of common HSN code examples and indicative GST rates.", category: "ops" },
  { slug: "sales-tax-calculator", title: "Sales Tax Calculator", desc: "Estimate tax amount and invoice total from a taxable amount and tax rate.", category: "ops" },
  { slug: "profit-margin-calculator", title: "Profit Margin Calculator", desc: "Calculate profit and margin from revenue and cost inputs.", category: "ops" },
  { slug: "emi-calculator", title: "EMI Calculator", desc: "Loan EMI, total interest, and payoff in INR.", category: "ops" },
  { slug: "sip-calculator", title: "SIP Calculator", desc: "Project mutual fund SIP future value with expected returns.", category: "ops" },

  // ── Industry-Specific Calculators ─────────────────────────────────────────
  { slug: "law-firm-billing-rate-calculator", title: "Law Firm Billing Rate Calculator", desc: "Estimate hourly billing rates from cost, utilization, and target margin.", category: "ops" },
  { slug: "shopify-profit-calculator", title: "Shopify Profit Calculator", desc: "Estimate D2C per-order profit after product, shipping, ad, and fee costs.", category: "ops" },
  { slug: "construction-project-estimator", title: "Construction Project Estimator", desc: "Estimate job quote value from materials, labor, equipment, contingency, and markup.", category: "ops" },
  { slug: "exhibition-roi-calculator", title: "Exhibition ROI Calculator", desc: "Estimate event ROI from costs, visitors, and conversion assumptions.", category: "ops" },

  // ── Platform & Compliance ─────────────────────────────────────────────────
  { slug: "business-name-generator", title: "Business Name Generator", desc: "Brainstorm company and product names from a keyword.", category: "ai" },
  { slug: "web-forms-landing-page-builder", title: "Web Forms & Landing Page Builder", desc: "Lead capture, UTM attribution, and routing from marketing to CRM.", category: "communication" },
  { slug: "mobile-crm-guide", title: "Mobile-First CRM App", desc: "Run pipeline and tasks from your phone — mobile-first sales workflows.", category: "ops" },
  { slug: "offline-crm-sync", title: "Offline Mode & Sync", desc: "Field sales connectivity: save safely and sync when back online.", category: "ops" },
  { slug: "audit-logs-compliance", title: "Audit Logs (Compliance)", desc: "Audit trails, access control, and Trust Center resources.", category: "ops" },

  // ── SEO & Content Tools ───────────────────────────────────────────────────
  { slug: "aeo-grader", title: "AEO Grader", desc: "Score whether a page is ready for answer-engine and AI-overview discovery.", category: "ai" },
  { slug: "seo-title-generator", title: "SEO Title Generator", desc: "Create optimized page titles for blogs, landing pages, and product pages.", category: "ai" },
  { slug: "meta-description-generator", title: "Meta Description Generator", desc: "Generate search-friendly meta descriptions with clearer intent and CTA framing.", category: "ai" },
  { slug: "keyword-density-checker", title: "Keyword Density Checker", desc: "Check keyword frequency, density, and repeated supporting terms in your content.", category: "ops" },
  { slug: "keyword-research-tool", title: "Keyword Research Tool", desc: "Generate keyword ideas by search intent, niche, and location for organic growth planning.", category: "ai" },
  { slug: "long-tail-keyword-generator", title: "Long-Tail Keyword Generator", desc: "Build longer, lower-competition keyword ideas with audience and location modifiers.", category: "ai" },
  { slug: "blog-title-generator", title: "Blog Title Generator", desc: "Create headline ideas for SEO posts, guides, thought leadership, and content marketing.", category: "ai" },
  { slug: "blog-outline-generator", title: "Blog Outline Generator", desc: "Generate article structures, section ideas, and FAQ prompts before writing.", category: "ai" },
  { slug: "content-brief-generator", title: "Content Brief Generator", desc: "Create writer-ready SEO briefs with keyword, audience, intent, and section guidance.", category: "ai" },
  { slug: "serp-snippet-preview", title: "SERP Snippet Preview Tool", desc: "Preview how your title, URL, and description may appear in search results.", category: "ops" },
  { slug: "schema-markup-generator", title: "Schema Markup Generator", desc: "Generate JSON-LD schema for articles, FAQs, products, local businesses, and organizations.", category: "ops" },
];

const CASE_STUDIES: Record<string, Array<{ id: string; title: string; summary: string; result: string; featuresUsed: string[] }>> = {
  "Real Estate": [
    { id: "CS-001", title: "Real Estate Brokerage", summary: "25-agent residential brokerage tracked buyer inquiries, automated site visit reminders, managed broker commissions.", result: "40% faster lead-to-visit conversion.", featuresUsed: ["Lead Management", "Dialer", "Automation"] },
    { id: "CS-002", title: "Commercial Property Developer", summary: "8-project developer tracked investor interest stages with AI scoring.", result: "3x increase in qualified investor meetings.", featuresUsed: ["Pipeline", "AI Lead Scoring"] },
    { id: "CS-003", title: "Property Management Company", summary: "500+ rental units — tenant renewals, maintenance pipelines, lease expiry reminders.", result: "92% renewal rate (up from 78%).", featuresUsed: ["Automation", "Task Boards"] },
    { id: "CS-004", title: "Real Estate Franchise Network", summary: "12-office franchise centralized lead routing with territory management.", result: "28% increase in network-wide conversions.", featuresUsed: ["Territory Management", "Lead Routing"] },
    { id: "CS-005", title: "Luxury Home Builder", summary: "Tracked prospects from consultation through construction milestones.", result: "Zero missed follow-ups across 18-month sales cycles.", featuresUsed: ["Pipeline", "Task Boards", "Automation"] },
    { id: "CS-054", title: "Coworking Space", summary: "Managed tour bookings, membership upgrades, corporate client acquisition.", result: "95% occupancy rate.", featuresUsed: ["Pipeline", "Automation"] },
  ],
  "Legal": [
    { id: "CS-006", title: "Personal Injury Law Firm", summary: "15-attorney PI firm — intake calls, case pipelines, settlement tracking.", result: "50% reduction in missed client callbacks.", featuresUsed: ["Dialer", "Pipeline", "Intake"] },
    { id: "CS-007", title: "Immigration Law Practice", summary: "H-1B/EB-5 visa pipelines, automated document requests and deadline reminders.", result: "35% faster case processing.", featuresUsed: ["Pipeline", "Email Automation"] },
    { id: "CS-008", title: "Corporate Law Firm", summary: "Mid-size firm tracked engagements, billable hours, referral sources.", result: "22% increase in referral-generated revenue.", featuresUsed: ["AI Lead Scoring", "Referral Tracking"] },
    { id: "CS-009", title: "Family Law Practice", summary: "Solo practitioner managed custody/divorce/mediation cases simultaneously.", result: "Handled 3x more cases without additional staff.", featuresUsed: ["Task Boards", "WhatsApp"] },
    { id: "CS-010", title: "Criminal Defense Firm", summary: "Tracked court dates, client communications, case evidence timelines.", result: "Zero missed court appearances in 12 months.", featuresUsed: ["Automation", "Task Boards"] },
  ],
  "Healthcare": [
    { id: "CS-011", title: "Multi-Specialty Hospital", summary: "Referral doctor relationships, corporate health tie-ups, patient re-engagement campaigns.", result: "35% increase in referral patient volume.", featuresUsed: ["Pipeline", "Email Automation"] },
    { id: "CS-012", title: "Dental Clinic Chain", summary: "8-clinic chain — appointment follow-ups, treatment plan tracking, SMS reminders.", result: "45% reduction in missed appointments.", featuresUsed: ["WhatsApp", "SMS", "Automation"] },
    { id: "CS-013", title: "Telehealth Startup", summary: "B2B telemedicine tracked hospital partnerships; AI voice agents handled demo scheduling.", result: "60% of demos booked without human intervention.", featuresUsed: ["AI Voice Agents", "Pipeline"] },
    { id: "CS-014", title: "Medical Device Distributor", summary: "6–18-month hospital procurement cycles tracked across 5 regions.", result: "Forecasting within 8% variance.", featuresUsed: ["Forecasting", "Territory Management"] },
    { id: "CS-015", title: "Health Insurance TPA", summary: "200+ hospital and 50+ corporate client relationships, automated renewals.", result: "98% client retention rate.", featuresUsed: ["Automation", "Email", "Pipeline"] },
  ],
  "SaaS": [
    { id: "CS-021", title: "B2B SaaS Startup", summary: "Inbound trial signups scored and routed automatically; sequences nurtured free-to-paid conversions.", result: "34% lift in trial-to-paid conversion.", featuresUsed: ["AI Lead Scoring", "Email Automation"] },
    { id: "CS-022", title: "Enterprise SaaS Vendor", summary: "Complex multi-stakeholder deals managed across 9-month cycles.", result: "Win rate improved from 18% to 27%.", featuresUsed: ["Pipeline", "AI Lead Scoring", "Forecasting"] },
  ],
  "Manufacturing": [
    { id: "CS-023", title: "Industrial Equipment Manufacturer", summary: "Distributor network managed across 12 regions, order pipelines tracked.", result: "25% reduction in order processing time.", featuresUsed: ["Territory Management", "Pipeline"] },
  ],
  "Finance": [
    { id: "CS-024", title: "Wealth Management Firm", summary: "HNI client relationships tracked with compliance-friendly communication logs.", result: "40% increase in AUM from existing clients.", featuresUsed: ["Compliance", "Pipeline", "Automation"] },
  ],
  "Recruitment": [
    { id: "CS-025", title: "Executive Search Firm", summary: "Candidate pipelines and client mandates managed in dual-tracking boards.", result: "50% faster placement cycle.", featuresUsed: ["Pipeline", "Dual Tracking"] },
  ],
};

const SEO_RULES = `# SEO Rules (Guardrails)

1. Always link to canonical host: \`https://hellogrowthcrm.com\` (never \`www\`).
2. Never add internal links to legacy redirect sources (e.g. /benefits, /support, /resources).
3. Add new indexable routes to sitemap unless intentionally excluded.
4. Do not include redirecting URLs in sitemap entries.
5. Keep one logical h1 per page.
6. Every non-decorative image must have meaningful alt text.
7. Use absolute canonical URLs in metadata.
8. Keep paginated archives indexable and canonicalized per page.
9. For out-of-range pagination, redirect to a valid page.
10. Blog post OpenGraph type must be \`article\`.
11. Static marketing pages should prefer force-static or ISR when possible.
12. Avoid duplicate database reads between page render and metadata generation.
13. Prefer lightweight OG/WebP assets for heavy pages.
14. Keep Organization.sameAs current across major profiles.
15. Add structured data only when truthful and complete.
16. Do not ship broken hreflang references.
17. Keep internal links crawlable (avoid JS-only critical nav links).
18. Validate changes with typecheck + lint before merge.`;

// ─────────────────────────────────────────────────────────────────────────────
// Tools
// ─────────────────────────────────────────────────────────────────────────────

export const contentListCaseStudies = defineTool({
  schema: z.object({
    industry: z.string().optional().describe("Filter by industry name (case-insensitive)."),
  }),
  definition: {
    name: "content_list_case_studies",
    description: "List case studies by industry. Returns all industries if no filter given.",
    inputSchema: {
      type: "object",
      properties: {
        industry: { type: "string", description: "Industry name filter (case-insensitive)." },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    if (args.industry) {
      const industryFilter = args.industry;
      const key = Object.keys(CASE_STUDIES).find(
        (k) => k.toLowerCase() === industryFilter.toLowerCase(),
      );
      if (!key) return fail(`Industry "${industryFilter}" not found. Available: ${Object.keys(CASE_STUDIES).join(", ")}`);
      const scenarios = CASE_STUDIES[key] ?? [];
      return ok({ industry: key, count: scenarios.length, scenarios });
    }
    const summary = Object.entries(CASE_STUDIES).map(([industry, scenarios]) => ({
      industry,
      count: scenarios.length,
      scenarios,
    }));
    return ok({ total_industries: summary.length, case_studies: summary });
  },
});

export const contentGetComparison = defineTool({
  schema: z.object({
    slug: z.string().describe("Competitor comparison slug, e.g. hubspot, salesforce, zoho."),
  }),
  definition: {
    name: "content_get_comparison",
    description: "Get metadata for a competitor comparison page by slug.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string" },
      },
      required: ["slug"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    const comp = COMPARISONS.find((c) => c.slug === args.slug);
    if (!comp) return fail(`Comparison "${args.slug}" not found. Use content_list_comparisons to see all slugs.`);
    return ok({ ...comp, url: `https://hellogrowthcrm.com/compare/${comp.slug}` });
  },
});

export const contentListComparisons = defineTool({
  schema: z.object({}),
  definition: {
    name: "content_list_comparisons",
    description: "List all competitor comparison pages available on hellogrowthcrm.com.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  async handle(_args) {
    return ok({
      count: COMPARISONS.length,
      comparisons: COMPARISONS.map((c) => ({ ...c, url: `https://hellogrowthcrm.com/compare/${c.slug}` })),
    });
  },
});

export const contentListIndustries = defineTool({
  schema: z.object({}),
  definition: {
    name: "content_list_industries",
    description: "List all industry vertical pages available on hellogrowthcrm.com.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  async handle(_args) {
    return ok({
      count: INDUSTRIES.length,
      industries: INDUSTRIES.map((name) => ({
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        url: `https://hellogrowthcrm.com/crm-for-${name.toLowerCase().replace(/\s+/g, "-")}`,
      })),
    });
  },
});

export const contentListTools = defineTool({
  schema: z.object({
    search: z.string().optional().describe("Filter tools by keyword in title, slug, or description."),
    category: z.enum(["all", "ai", "communication", "ops", "free"]).default("all").describe("Filter by tool category."),
  }),
  definition: {
    name: "content_list_tools",
    description: `List all 118 free tools and calculators on hellogrowthcrm.com. Filterable by keyword and category (ai, communication, ops, free).`,
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Keyword filter on title, slug, or description." },
        category: { type: "string", enum: ["all", "ai", "communication", "ops", "free"], default: "all" },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    let tools = TOOLS_PAGES;
    if (args.category !== "all") {
      tools = tools.filter((t) => t.category === args.category);
    }
    if (args.search) {
      const q = args.search.toLowerCase();
      tools = tools.filter(
        (t) => t.title.toLowerCase().includes(q) || t.slug.includes(q) || t.desc.toLowerCase().includes(q),
      );
    }
    return ok({
      total_tools: TOOLS_PAGES.length,
      filtered_count: tools.length,
      tools: tools.map((t) => ({
        slug: t.slug,
        title: t.title,
        desc: t.desc,
        category: t.category,
        url: `https://hellogrowthcrm.com/tools/${t.slug}`,
      })),
    });
  },
});

export const contentGetSeoRules = defineTool({
  schema: z.object({}),
  definition: {
    name: "content_get_seo_rules",
    description: "Return the SEO rules and guardrails for hellogrowthcrm.com content.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  async handle(_args) {
    return ok(SEO_RULES);
  },
});
