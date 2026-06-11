import { z } from "zod";
import { defineTool, fail, ok } from "./tool-types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Static mirror data — READ-MIRROR of the website. Never edit values here to
// differ from the website source file; re-extract and bump SYNCED_AT instead.
//
// Source: hellocrmwebsite/src/lib/templates-data.ts (templates + categoryMeta)
//         — SYNCED_AT 2026-06-11
// Route:  hellocrmwebsite/src/app/(public)/templates/[category]/[slug]/page.tsx
//         → https://hellogrowthcrm.com/templates/{category}/{slug}
// Only summary fields are mirrored (slug, title, category, one-line
// description, audience, download formats, popular flag, lastUpdated).
// Full template bodies (useCases, howToUse, faqs, sampleData, etc.) live on
// the website page itself.
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATES_SYNCED_AT = "2026-06-11";

type TemplateCategory =
  | "pipeline"
  | "email-sequences"
  | "lead-scoring"
  | "sales"
  | "onboarding"
  | "audit"
  | "gtm";

const TEMPLATE_CATEGORIES: Array<{ slug: TemplateCategory; label: string }> = [
  { slug: "pipeline", label: "Pipeline Templates" },
  { slug: "email-sequences", label: "Email Sequences" },
  { slug: "lead-scoring", label: "Lead Scoring Models" },
  { slug: "sales", label: "Sales Workflows" },
  { slug: "onboarding", label: "Customer Onboarding" },
  { slug: "audit", label: "RevOps Audit" },
  { slug: "gtm", label: "Go-to-Market" },
];

interface TemplateSummary {
  id: string;
  slug: string;
  title: string;
  category: TemplateCategory;
  description: string; // source field: oneLiner
  whoItsFor: string;
  formats: string[]; // source field: downloads[].format
  popular?: boolean;
  lastUpdated: string;
}

const TEMPLATES: TemplateSummary[] = [
  { id: "1", slug: "sales-pipeline-template", title: "CRM Sales Pipeline Template", category: "pipeline", description: "A universal 7-stage sales pipeline with weighted forecasting, stage probabilities, and automated deal aging alerts.", whoItsFor: "Sales managers, AEs, and RevOps teams at B2B companies with 3+ reps.", formats: ["xlsx", "csv", "pdf"], popular: true, lastUpdated: "2026-02-15" },
  { id: "2", slug: "real-estate-lead-pipeline", title: "Real Estate Lead Pipeline", category: "pipeline", description: "A 13-stage CRM pipeline for real estate agents: New Lead → Contacted → Qualification → Site Visit → Negotiation → Booking → Legal & Docs → Deal Closed.", whoItsFor: "Independent real estate agents, boutique brokerages, property management firms, NRI investment advisors, and new-home builders managing a mix of buyer, seller, and investor inquiries.", formats: ["xlsx", "pdf"], popular: true, lastUpdated: "2026-02-10" },
  { id: "3", slug: "enterprise-sales-pipeline", title: "Enterprise Sales Pipeline", category: "pipeline", description: "10-stage enterprise pipeline for complex B2B sales cycles of 3-12 months with legal review and procurement stages.", whoItsFor: "Enterprise AEs, sales directors, and deal desk teams selling to companies with 500+ employees.", formats: ["xlsx", "pdf"], lastUpdated: "2026-02-12" },
  { id: "4", slug: "saas-trial-conversion-sequence", title: "SaaS Trial Conversion Sequence", category: "email-sequences", description: "14-day automated email sequence to convert free trial users into paying customers with A/B test variants.", whoItsFor: "SaaS product-led growth teams, marketing automation managers, and growth hackers.", formats: ["pdf"], popular: true, lastUpdated: "2026-02-18" },
  { id: "5", slug: "cold-email-follow-up-workflow", title: "Cold Email Follow-Up Workflow", category: "email-sequences", description: "5-touch cold outreach sequence optimized for 35%+ open rates with personalized follow-ups and a breakup email.", whoItsFor: "SDRs, BDRs, and outbound sales teams doing cold prospecting.", formats: ["pdf", "xlsx"], lastUpdated: "2026-02-14" },
  { id: "6", slug: "webinar-follow-up-sequence", title: "Webinar Follow-Up Sequence", category: "email-sequences", description: "Post-webinar nurture sequence for attendees and no-shows with recording, slides, and personalized CTAs.", whoItsFor: "Marketing teams, demand gen managers, and event coordinators running educational or product webinars.", formats: ["pdf"], lastUpdated: "2026-02-08" },
  { id: "7", slug: "b2b-lead-scoring-model", title: "B2B Lead Scoring Model", category: "lead-scoring", description: "Score leads 0-100 based on firmographic data, behavioral signals, and engagement recency with automatic routing.", whoItsFor: "B2B marketing and sales teams with 50+ leads per month.", formats: ["xlsx", "csv", "pdf"], popular: true, lastUpdated: "2026-02-20" },
  { id: "8", slug: "product-led-growth-scoring", title: "Product-Led Growth Scoring", category: "lead-scoring", description: "Score users based on product usage to automatically identify Product Qualified Leads (PQLs) for sales outreach.", whoItsFor: "Product-led SaaS companies with a freemium or free trial model.", formats: ["xlsx", "pdf"], lastUpdated: "2026-02-11" },
  { id: "9", slug: "inbound-lead-qualification", title: "Inbound Lead Qualification Workflow", category: "sales", description: "End-to-end inbound flow: capture → 0–100 score → BANT → routing → SLA → meeting booking → nurture/recycle, with full automation and field-level steps.", whoItsFor: "Inbound SDR/AE teams, RevOps, and marketing operations running forms, chat, and demo requests.", formats: ["pdf", "xlsx"], lastUpdated: "2026-03-21" },
  { id: "10", slug: "deal-lost-re-engagement", title: "Deal Lost Re-engagement Workflow", category: "sales", description: "Full win-back playbook: enroll on Closed Lost, 30/60/90-day value emails, re-engagement scoring (0–100), tiered sales alerts, tasks, and clear outcomes.", whoItsFor: "AEs, SDRs, sales managers, and RevOps teams managing Closed Lost pipelines and win-back programs.", formats: ["pdf", "xlsx"], lastUpdated: "2026-03-21" },
  { id: "11", slug: "ecommerce-customer-lifecycle", title: "E-commerce Customer Lifecycle", category: "sales", description: "Five-step DTC lifecycle: first-purchase welcome, review & feedback, cross-sell & repeat buy, loyalty enrollment, and dormant win-back — with statuses and full automation pack.", whoItsFor: "E-commerce and DTC marketing, retention, and operations teams using Shopify, WooCommerce, or similar stacks.", formats: ["pdf", "xlsx"], lastUpdated: "2026-03-21" },
  { id: "12", slug: "agency-client-onboarding", title: "Agency Client Onboarding Checklist", category: "onboarding", description: "22-step agency onboarding checklist across 5 milestones: kickoff, access & assets, CRM setup, automation, and launch readiness.", whoItsFor: "Agency owners, account managers, strategists, and RevOps leads at marketing and sales agencies onboarding new retainer or project clients.", formats: ["xlsx", "pdf"], lastUpdated: "2026-03-20" },
  { id: "13", slug: "customer-success-health-check", title: "Customer Success Health Check", category: "onboarding", description: "Quarterly recurring health check workflow: six milestone stages from usage and NPS through renewal risk, expansion, and automated CSM follow-up.", whoItsFor: "Customer success managers, CS directors, renewal managers, and RevOps at B2B SaaS and services companies.", formats: ["xlsx", "pdf"], lastUpdated: "2026-03-21" },
  { id: "14", slug: "revops-maturity-audit", title: "RevOps Maturity Assessment", category: "audit", description: "Consulting-grade RevOps scorecard with 50 criteria across People (12), Process (13), Technology (12), and Data (13), using a 0–5 scale with automated 0–100 normalization.", whoItsFor: "RevOps leaders, CROs, VPs of Sales/Marketing/CS, and consultants benchmarking GTM operations.", formats: ["xlsx", "pdf"], popular: true, lastUpdated: "2026-03-21" },
  { id: "15", slug: "crm-health-scorecard", title: "CRM Health Scorecard", category: "audit", description: "Professional 30-criteria CRM Health Scorecard for SaaS/B2B RevOps teams across Data Quality (8), User Adoption (7), Automation Utilization (7), and Reporting Accuracy (8).", whoItsFor: "SaaS and B2B RevOps leaders, CRM admins, Sales Ops, Marketing Ops, Customer Success Ops, and consultants running operational CRM audits.", formats: ["xlsx", "pdf"], lastUpdated: "2026-02-21" },
  { id: "16", slug: "sales-process-audit-checklist", title: "Sales Process Audit Checklist", category: "audit", description: "Professional 40-point sales process audit checklist for B2B, SaaS, and RevOps teams across Lead Generation, Qualification, Pipeline Management, Closing, and Post-Sale Handoff.", whoItsFor: "Sales leaders, RevOps teams, Sales Ops managers, enablement teams, and consultants running sales process diagnostics.", formats: ["xlsx", "pdf"], lastUpdated: "2026-02-19" },
  { id: "17", slug: "data-quality-assessment", title: "CRM Data Quality Assessment", category: "audit", description: "Professional 30-criterion CRM data quality framework for RevOps and Data teams: Completeness (10), Accuracy (10), and Freshness (10), with 0-5 scoring and automated 0-100 dashboards.", whoItsFor: "RevOps, Sales Ops, Marketing Ops, CRM administrators, data stewards, and analytics teams responsible for CRM trust and governance.", formats: ["xlsx", "csv", "pdf"], lastUpdated: "2026-04-09" },
  { id: "18", slug: "product-launch-playbook", title: "Product Launch Playbook", category: "gtm", description: "CRM-ready launch workspace with messaging framework, cross-functional workstreams, weekly timeline, readiness checklist, and post-launch reviews.", whoItsFor: "Product marketing managers, launch leads, founders, sales enablement leaders, demand gen teams, customer success managers, and cross-functional GTM teams coordinating a release.", formats: ["xlsx", "csv", "pdf"], popular: true, lastUpdated: "2026-04-25" },
  { id: "19", slug: "competitive-battle-cards", title: "Competitive Battle Cards", category: "gtm", description: "Sales-ready competitive battle card template with top-3 competitor cards, objection handling, rep-tested win tactics, and recurring review workflows.", whoItsFor: "Product marketing, competitive intelligence owners, sales enablement teams, frontline account executives, SDR leaders, and revenue teams facing recurring competitor mentions in pipeline.", formats: ["xlsx", "csv", "pdf"], lastUpdated: "2026-04-25" },
  { id: "20", slug: "territory-planning-template", title: "Sales Territory Planning Template", category: "gtm", description: "Data-driven territory planning workspace with account import, potential scoring, balance checks, quota planning, and optional performance tracking.", whoItsFor: "Sales directors, VP Sales, Sales Ops leaders, RevOps teams, and regional sales managers responsible for territory design, account assignment, and quota allocation.", formats: ["xlsx", "csv", "pdf"], lastUpdated: "2026-04-25" },
  { id: "21", slug: "crm-migration-checklist", title: "CRM Migration Project Plan & Checklist", category: "audit", description: "Consulting-grade 65-step CRM migration plan: Planning (10), Data audit & mapping (12), System config & migration (12), Automation rebuild (10), Testing & validation (8), Training & change (7), Go-live & optimization (6)—with owners, status, priorities, risks, and export.", whoItsFor: "RevOps, Sales Ops, IT, CRM administrators, data teams, and project leads running a CRM switch or major replatform.", formats: ["xlsx", "pdf", "csv"], popular: true, lastUpdated: "2026-04-09" },
  { id: "22", slug: "sales-forecasting-model", title: "Sales Forecasting Model", category: "pipeline", description: "Multi-method forecasting model combining weighted pipeline, historical trends, and rep-level predictions for accurate revenue forecasts.", whoItsFor: "VP Sales, CROs, and finance teams responsible for revenue forecasting and planning.", formats: ["xlsx", "pdf"], lastUpdated: "2026-02-20" },
  { id: "23", slug: "account-based-marketing-playbook", title: "Account-Based Marketing Playbook", category: "gtm", description: "CRM-ready ABM workspace with ICP definition, account scoring and tiering, tier playbooks, engagement tracking, shared account plans, and monthly reviews.", whoItsFor: "ABM managers, demand gen leaders, field marketers, enterprise AEs, SDR teams, and revenue leaders coordinating targeted account strategy.", formats: ["xlsx", "csv", "pdf"], lastUpdated: "2026-04-25" },
  { id: "24", slug: "tech-stack-audit", title: "Sales Tech Stack Audit", category: "audit", description: "Professional 40-criterion sales & marketing tech stack audit: Cost (10), Adoption (10), Integration & Data Flow (10), ROI & Business Impact (10)—with tool inventory, 0–5 scoring, consolidation insights, and export.", whoItsFor: "RevOps, Sales Ops, Marketing Ops, IT, finance partners, and leaders rationalizing GTM technology.", formats: ["xlsx", "pdf", "csv"], lastUpdated: "2026-04-09" },
  { id: "25", slug: "quarterly-business-review", title: "QBR Presentation Template — Quarterly Business Review", category: "sales", description: "QBR presentation framework: executive summary, usage & ROI, support & adoption, risk & expansion, next-quarter MAP — deck order, statuses, and automation-ready fields.", whoItsFor: "CSMs, AMs, CS Ops, support leads, product specialists, AEs, and executive sponsors preparing customer QBRs.", formats: ["pdf", "xlsx"], lastUpdated: "2026-03-21" },
  { id: "26", slug: "ai-crm-implementation-guide", title: "AI CRM Implementation Guide", category: "gtm", description: "Checklist-driven AI CRM rollout guide with readiness reviews, feature prioritization, pilot planning, impact tracking, calibration, and governance.", whoItsFor: "RevOps leaders, CRM administrators, Sales Ops, Marketing Ops, customer success leaders, and GTM teams implementing AI capabilities inside the CRM.", formats: ["pdf", "xlsx", "csv"], lastUpdated: "2026-04-25" },
  { id: "27", slug: "sales-compensation-plan", title: "Sales Compensation Plan Template", category: "gtm", description: "Data-driven compensation planning template with model selection, OTE/quota inputs, accelerators, payout scenarios, benchmark comparisons, and approval governance.", whoItsFor: "VP Sales, Sales Ops, RevOps leaders, finance business partners, HR teams, and compensation owners designing or approving sales plans.", formats: ["xlsx", "csv", "pdf"], lastUpdated: "2026-04-25" },
  { id: "28", slug: "renewal-retention-pipeline", title: "Renewal & Retention Pipeline", category: "pipeline", description: "Track upsell and renewal opportunities through a 6-stage pipeline with churn risk scoring and expansion signals.", whoItsFor: "Customer success managers, renewal managers, and account managers at subscription-based businesses.", formats: ["xlsx", "pdf"], lastUpdated: "2026-02-23" },
  { id: "29", slug: "lead-nurture-sequence", title: "Lead Nurture Email Sequence", category: "email-sequences", description: "8-email drip sequence that educates and qualifies inbound leads over 30 days with progressive profiling and scoring.", whoItsFor: "Demand generation managers, marketing automation specialists, and inbound marketing teams.", formats: ["pdf", "xlsx"], lastUpdated: "2026-02-23" },
  { id: "30", slug: "customer-renewal-sequence", title: "Customer Renewal Email Sequence", category: "email-sequences", description: "6-email renewal sequence starting 90 days before expiry with ROI recaps, success stories, and upgrade offers.", whoItsFor: "Customer success teams, renewal managers, and account managers at SaaS and subscription businesses.", formats: ["pdf"], lastUpdated: "2026-02-23" },
  { id: "31", slug: "demo-meeting-workflow", title: "Demo & Meeting Workflow", category: "sales", description: "Full sales meeting lifecycle: trigger from calendar, prep with research and agenda, run discovery, capture notes, follow up, and log outcomes in CRM.", whoItsFor: "Account executives, SDRs, sales engineers, and managers running intros, demos, pricing calls, objection handling, stakeholder alignment, and renewal/expansion meetings.", formats: ["pdf", "xlsx"], lastUpdated: "2026-03-20" },
  { id: "32", slug: "proposal-quote-workflow", title: "Proposal & Quote Workflow", category: "sales", description: "Full proposal-to-contract workflow: quote configuration, pricing guardrails, multi-level approvals, tracked delivery, negotiation loops, e-signature, and Won/Lost/Stalled outcomes.", whoItsFor: "Account executives, deal desk, revenue operations, finance, legal, and sales leadership running product or service quotes with discounts and custom terms.", formats: ["pdf", "xlsx"], lastUpdated: "2026-03-21" },
  { id: "33", slug: "funnel-leakage-analysis", title: "Funnel Leakage Analysis", category: "audit", description: "Data-driven funnel template: Visitors → Leads → MQL → SQL → Opportunities → Closed Won with conversion & drop-off metrics, revenue impact, leakage flags, RCA framework, and auto recommendations.", whoItsFor: "RevOps, demand generation, marketing operations, sales leadership, and analysts improving funnel efficiency.", formats: ["xlsx", "pdf", "csv"], lastUpdated: "2026-04-09" },
  { id: "34", slug: "reporting-metrics-audit", title: "Reporting & Metrics Audit", category: "audit", description: "Consulting-grade audit: 40 criteria across data accuracy, reporting coverage, metric alignment, and dashboard adoption—normalized scores, health bands, gap analysis, and CSV export.", whoItsFor: "RevOps, FP&A, CFO office, BI/analytics, sales and marketing leadership, and anyone accountable for revenue reporting integrity.", formats: ["xlsx", "pdf", "csv"], lastUpdated: "2026-04-09" },
  { id: "35", slug: "forecast-accuracy-audit", title: "Forecast Accuracy Audit", category: "audit", description: "Compare forecast vs actual by period, quantify error and bias, and improve confidence with methodology and root-cause diagnostics.", whoItsFor: "RevOps, Sales Ops, Finance/FP&A, CRO office, and regional sales leaders accountable for forecast quality.", formats: ["xlsx", "pdf", "csv"], lastUpdated: "2026-04-09" },
  { id: "36", slug: "lead-source-attribution-audit", title: "Lead Source Attribution Audit", category: "audit", description: "40-criteria attribution audit to validate lead source tracking, attribution models, and channel ROI across your RevOps + marketing stack.", whoItsFor: "RevOps, Marketing Ops, demand generation, growth analytics, and leadership teams allocating budget by attributable revenue.", formats: ["xlsx", "pdf", "csv"], lastUpdated: "2026-04-09" },
  { id: "37", slug: "sales-marketing-alignment-audit", title: "Sales-Marketing Alignment Audit", category: "audit", description: "Execution-focused 40-criteria audit to align Sales and Marketing on definitions, SLAs, handoffs, collaboration, and shared revenue metrics.", whoItsFor: "RevOps leaders, Sales leaders, Marketing leaders, and GTM operators responsible for shared pipeline and revenue outcomes.", formats: ["xlsx", "pdf", "csv"], lastUpdated: "2026-04-09" },
  { id: "38", slug: "icp-worksheet", title: "Ideal Customer Profile (ICP) Worksheet", category: "gtm", description: "CRM-friendly ICP workspace with top-customer analysis, success patterns, segment scoring, persona cards, disqualification rules, and final ICP summary.", whoItsFor: "Product marketing, growth, demand generation, sales leadership, SDR/AE teams, RevOps, and customer success leaders refining targeting and account qualification.", formats: ["xlsx", "pdf", "csv"], popular: true, lastUpdated: "2026-04-25" },
  { id: "39", slug: "value-proposition-canvas", title: "Value Proposition Canvas", category: "gtm", description: "Collaborative value proposition canvas with customer jobs, pains, gains, product value mapping, claim validation, messaging hierarchy, and prioritization.", whoItsFor: "Product marketing, product management, founders, sales enablement, growth teams, and GTM leaders building positioning and messaging around customer value.", formats: ["pdf", "xlsx", "csv"], lastUpdated: "2026-04-25" },
  { id: "40", slug: "messaging-matrix", title: "Messaging Matrix", category: "gtm", description: "Grid-based messaging workspace with core value messages, persona rows, channel variants, proof points, effectiveness tracking, and enablement governance.", whoItsFor: "Product marketing, content teams, sales enablement, account executives, SDR leaders, customer success leaders, and GTM teams responsible for message consistency and field readiness.", formats: ["xlsx", "pdf", "csv"], lastUpdated: "2026-04-25" },
  { id: "41", slug: "channel-strategy-template", title: "Channel Strategy Template", category: "gtm", description: "Data-driven channel strategy workspace with channel inventory, scoring, budget allocation, KPI targets, quarterly reviews, and experiment tracking.", whoItsFor: "CMOs, demand generation leaders, growth teams, sales leaders, RevOps, and GTM strategists responsible for channel mix, budget allocation, and performance management.", formats: ["xlsx", "pdf", "csv"], lastUpdated: "2026-04-25" },
  { id: "42", slug: "pricing-hypothesis-worksheet", title: "Pricing Hypothesis Worksheet", category: "gtm", description: "Experiment-driven pricing worksheet with hypothesis definition, competitor benchmarking, test design, outcome tracking, decision logging, and pricing history.", whoItsFor: "Product managers, pricing owners, finance leaders, founders, growth teams, and RevOps partners responsible for pricing and packaging decisions.", formats: ["xlsx", "pdf", "csv"], lastUpdated: "2026-04-25" },
];

function templateUrl(t: TemplateSummary): string {
  return `https://hellogrowthcrm.com/templates/${t.category}/${t.slug}`;
}

// ── templates_list ──────────────────────────────────────────────────────────────

export const templatesList = defineTool({
  schema: z.object({
    category: z
      .enum(["all", "pipeline", "email-sequences", "lead-scoring", "sales", "onboarding", "audit", "gtm"])
      .default("all")
      .describe("Filter by template category slug."),
    search: z
      .string()
      .optional()
      .describe("Filter templates by keyword in title, slug, description, or audience (case-insensitive)."),
  }),
  definition: {
    name: "templates_list",
    description:
      "List the free CRM templates published at hellogrowthcrm.com/templates (pipelines, email sequences, lead scoring models, sales workflows, onboarding checklists, RevOps audits, GTM playbooks). Filterable by category and keyword.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["all", "pipeline", "email-sequences", "lead-scoring", "sales", "onboarding", "audit", "gtm"],
          default: "all",
          description: "Template category slug filter.",
        },
        search: {
          type: "string",
          description: "Keyword filter on title, slug, description, or audience (case-insensitive).",
        },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    let items = TEMPLATES;
    if (args.category !== "all") {
      items = items.filter((t) => t.category === args.category);
    }
    if (args.search) {
      const q = args.search.toLowerCase();
      items = items.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.slug.includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.whoItsFor.toLowerCase().includes(q),
      );
    }
    return ok({
      synced_at: TEMPLATES_SYNCED_AT,
      total: TEMPLATES.length,
      filtered_count: items.length,
      categories: TEMPLATE_CATEGORIES,
      templates: items.map((t) => ({
        slug: t.slug,
        title: t.title,
        category: t.category,
        description: t.description,
        formats: t.formats,
        popular: t.popular ?? false,
        url: templateUrl(t),
      })),
    });
  },
});

// ── templates_get ───────────────────────────────────────────────────────────────

export const templatesGet = defineTool({
  schema: z.object({
    slug: z
      .string()
      .describe("Template slug, e.g. sales-pipeline-template, b2b-lead-scoring-model, icp-worksheet."),
  }),
  definition: {
    name: "templates_get",
    description:
      "Get a single CRM template summary by slug — title, category, description, audience, download formats, last-updated date, and canonical URL.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Template slug." },
      },
      required: ["slug"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    const slug = args.slug.trim().toLowerCase();
    const template = TEMPLATES.find((t) => t.slug === slug);
    if (!template) {
      return fail(
        `Template "${args.slug}" not found. Valid slugs: ${TEMPLATES.map((t) => t.slug).join(", ")}`,
      );
    }
    return ok({
      synced_at: TEMPLATES_SYNCED_AT,
      ...template,
      popular: template.popular ?? false,
      url: templateUrl(template),
    });
  },
});
