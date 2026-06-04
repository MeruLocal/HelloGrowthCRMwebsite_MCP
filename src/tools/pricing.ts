import { z } from "zod";
import { defineTool, ok } from "./tool-types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Pricing data — sourced from hellocrmwebsite/src/lib/pricing-india-data.ts
// and src/hooks/usePricing.ts
// ─────────────────────────────────────────────────────────────────────────────

const GLOBAL_PLANS = [
  {
    name: "Free Forever",
    slug: "free",
    price_annual: "$0",
    price_monthly: "$0",
    billing: "Free forever · No credit card required · Never expires",
    best_for: "Individuals and tiny teams trying HelloGrowthCRM",
    ai_credits: "50 total",
    limits: { leads: 200, accounts: 50, pipelines: 1, tasks: 500 },
    features: [
      "Pipeline management (Kanban)",
      "Task board (500 tasks, Kanban only)",
      "Basic activity logging",
      "5 email templates",
      "Appointment scheduling",
      "Mobile dashboard (read-only)",
      "30-day analytics",
      "1 Growth Audit included",
      "Community support",
    ],
    cta_url: "https://app.hellogrowthcrm.com/signup",
  },
  {
    name: "Professional",
    slug: "professional",
    price_annual: "$10/user/month (billed annually — 2 months free)",
    price_monthly: "$12/user/month",
    billing: "Annual or monthly · Unlimited users · 14-day free trial · No credit card",
    best_for: "Tech-savvy self-serve sales teams",
    ai_credits: "50,000 per user/month · Overage $0.005/K",
    limits: { leads: "Unlimited", accounts: "Unlimited", pipelines: "Unlimited", tasks: "Unlimited" },
    features: [
      "Everything in Free, PLUS:",
      "Unlimited leads, contacts, accounts, deals & activities",
      "AI lead scoring & enrichment",
      "Built-in dialer with call tracking & recording",
      "HelloMail inbox + email sequences & templates",
      "WhatsApp & SMS (bulk broadcast)",
      "Real-time dashboards & analytics",
      "Task boards (Kanban + table + calendar) + automation",
      "Products, quotes, invoices, payments & revenue tracking",
      "Campaigns, web chat assistant & visitor tracking",
      "Customer portal, referrals, landing pages",
      "Tickets + knowledge base + scheduling & booking",
      "API access & 90+ integrations",
      "Standard email + chat support",
      "Onboarding checklist",
    ],
    guarantees: ["14-day free trial", "30-day money-back guarantee"],
    cta_url: "https://app.hellogrowthcrm.com/signup",
  },
  {
    name: "Growth Engine",
    slug: "growth-engine",
    price_annual: "$1,500/month (flat retainer)",
    price_monthly: "$1,500/month (flat retainer)",
    billing: "Monthly retainer · Includes Professional software · No long-term contract required",
    best_for: "Founders who won't manage the CRM themselves",
    ai_credits: "15,000/month shared pool",
    limits: { leads: "Unlimited", accounts: "Unlimited", pipelines: "Unlimited", tasks: "Unlimited" },
    features: [
      "Everything in Professional, PLUS:",
      "Dedicated Revenue Specialist assigned",
      "Weekly cadence: triage → assign → follow-up → clean → report",
      "Same-business-day SLA for inbound leads",
      "Email & SMS sequence management (specialist-run)",
      "Pipeline cleanup & data hygiene (weekly)",
      "Weekly KPI report with narrative commentary",
      "Client approval workflow for templates",
      "90-minute kickoff + pipeline architecture session",
    ],
    cta_url: "https://calendly.com/hello-merufintech/30min",
  },
  {
    name: "RevOps Partner",
    slug: "revops-partner",
    price_annual: "$4,000/month (flat retainer)",
    price_monthly: "$4,000/month (flat retainer)",
    billing: "Monthly retainer · Includes Professional software · Dedicated pod",
    best_for: "Scaling teams 15+ people",
    ai_credits: "Unlimited (fair use)",
    limits: { leads: "Unlimited", accounts: "Unlimited", pipelines: "Unlimited", tasks: "Unlimited" },
    features: [
      "Everything in Growth Engine, PLUS:",
      "Dedicated pod: Revenue Specialist + Automation Specialist",
      "Quarterly funnel review with KPI targets",
      "Automation optimization (sequencing, routing, scoring)",
      "Lead scoring model tuning (quarterly)",
      "Governance & instrumentation plan",
      "Monthly stack review",
      "Custom automation builds (up to 3/month)",
      "Priority SLA: same-business-day on all requests",
    ],
    cta_url: "https://calendly.com/hello-merufintech/30min",
  },
];

const INDIA_PLANS = [
  {
    name: "Free Forever",
    slug: "free",
    price_annual: "₹0",
    price_monthly: "₹0",
    billing: "Free forever · No credit card · 1 user · 200 leads · Never expires",
    best_for: "Default starter — not a trial",
    ai_credits: "50 total",
    limits: { leads: 200, accounts: 50, pipelines: 1, tasks: 500 },
    features: [
      "Lead & Contact Management (200 leads cap)",
      "Accounts (50 cap) + 1 deal pipeline",
      "Pipeline Management (Kanban)",
      "Task Board (500 tasks, Kanban only)",
      "Basic activity logging",
      "5 Basic Email Templates",
      "Appointment Scheduling",
      "Mobile dashboard (read-only)",
      "30-day analytics",
      "1 Growth Audit included",
      "Community support",
      "Business listings",
    ],
    cta_url: "https://app.hellogrowthcrm.com/signup",
  },
  {
    name: "Starter",
    slug: "starter",
    price_annual: "₹99/user/month (annual — 10 months paid, 2 months free)",
    price_monthly: "₹129/user/month",
    billing: "Annual billing · 10-user hard cap · No free trial",
    best_for: "Price-sensitive Indian SMBs",
    ai_credits: "200 per user/month",
    limits: { leads: "Unlimited", accounts: "Unlimited", pipelines: 3, tasks: "Unlimited", max_users: 10 },
    features: [
      "Unlimited leads & contacts",
      "Accounts & deals with 3 sales pipelines",
      "Pipeline management (Kanban + list view)",
      "Full activity types + activity log",
      "Email sequences, templates & booking pages",
      "WhatsApp messaging (manual send only)",
      "HelloMail inbox + email tracking",
      "Task boards (Kanban, table, calendar)",
      "Exhibition capture",
      "Products catalog, quote requests, quotes & basic invoices",
      "Business listings",
      "Mobile app (iOS + Android)",
      "30-day analytics",
      "~10 integrations across core categories",
      "Standard email + chat support",
      "Onboarding checklist",
      "200 AI credits/user/month",
    ],
    excluded: [
      "No AI lead scoring or enrichment",
      "No built-in dialer or web chat assistant",
      "No bulk WhatsApp or SMS broadcasts",
      "No public API or advanced workflow automation",
    ],
    cta_url: "https://app.hellogrowthcrm.com/signup",
  },
  {
    name: "Growth",
    slug: "growth",
    price_annual: "₹899/user/month (annual — 10 months paid, 2 months free = ₹8,990/user/year)",
    price_monthly: "₹1,099/user/month",
    billing: "Annual billing · Unlimited users · 14-day free trial · Hero tier",
    best_for: "Growing Indian sales teams",
    ai_credits: "2,500 per user/month · Overage ₹0.60/K",
    limits: { leads: "Unlimited", accounts: "Unlimited", pipelines: "Unlimited", tasks: "Unlimited" },
    popular: true,
    features: [
      "Everything in Starter, PLUS:",
      "AI lead scoring & enrichment",
      "Built-in dialer with call tracking & recording",
      "Bulk WhatsApp broadcasts & SMS campaigns",
      "Real-time dashboards, team analytics & custom reports",
      "Prospecting + exhibition capture",
      "Campaigns, web chat assistant & visitor tracking",
      "Market Radar, Growth Audit, AI Insights & AI Agents (Beta)",
      "Gamification, goals, leaderboard & pipeline forecast",
      "Products, proposals, invoices, expenses & revenue tracking",
      "Customer portal, referrals, references & landing pages",
      "Tickets + knowledge base",
      "API access & all 90 integrations across 20 categories",
      "Custom fields, modules, pipeline stages & workflows",
      "Territory & team management with map view",
      "AI-assisted sales forecasting",
      "Role-based access control",
      "Priority support + dedicated onboarding",
      "2,500 AI credits/user/month",
    ],
    guarantees: ["14-day free trial", "30-day pro-rated refund on annual plans"],
    cta_url: "https://app.hellogrowthcrm.com/signup",
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    price_annual: "Custom pricing — talk to sales",
    price_monthly: "Annual contract · Custom per-company pricing",
    billing: "Annual contract · Custom pricing · Dedicated Account Manager",
    best_for: "Large Indian businesses with complex needs",
    ai_credits: "10,000 per user/month + 3-month rollover",
    limits: { leads: "Unlimited", accounts: "Unlimited", pipelines: "Unlimited", tasks: "Unlimited" },
    features: [
      "Everything in Growth, PLUS:",
      "Dedicated named Account Manager",
      "Custom workflow automation (multi-step, approval flows)",
      "Advanced revenue intelligence, attribution & churn prediction",
      "Multi-branch / location management",
      "Audit trails, compliance reporting & full activity audit",
      "White-label customer portal & custom agents",
      "SLA policies, approval flows & multi-currency commerce",
      "Unlimited exports + scheduled reports",
      "Test cases for SaaS / QA teams",
      "All 90 integrations + custom integration support",
      "Custom training (up to 4 sessions/year)",
      "SLA-backed 99.9% uptime",
      "Priority phone support",
      "Custom API rate limits",
      "Data migration & onboarding support",
      "10,000 AI credits/user/month + 3-month rollover",
    ],
    cta_url: "https://calendly.com/hello-merufintech/30min",
  },
];

const ADDONS = {
  global_usd: {
    dialer: [
      { name: "Dialer Starter", price: "$15/user/month", desc: "Solo seller — single-line dialing with call recording" },
      { name: "Dialer Pro", price: "$29/user/month", desc: "Power dialer + call notes + sequences + dispositions" },
      { name: "Dialer Business", price: "$49/user/month", desc: "Multi-line, IVR, call routing, supervisor barge-in" },
    ],
  },
  india_inr: {
    dialer: [
      { name: "Dialer Starter", price: "₹799/user/month", desc: "Solo seller — single-line dialing with call recording" },
      { name: "Dialer Pro", price: "₹1,499/user/month", desc: "Power dialer + call notes + sequences + dispositions" },
      { name: "Dialer Business", price: "₹2,499/user/month", desc: "Multi-line, IVR, call routing, supervisor barge-in" },
    ],
    ai_credit_topups: [
      { credits: "100", price: "₹69", per_credit: "₹0.69", note: "Impulse buy for free users trying AI" },
      { credits: "500", price: "₹299", per_credit: "₹0.60", note: "Repeat top-up — consider upgrading to Starter" },
      { credits: "1,000", price: "₹549", per_credit: "₹0.55", note: "Growth gives 2,500/user for just ₹350 more/month" },
      { credits: "2,500", price: "₹1,499", per_credit: "₹0.60", note: "Growth (₹899) gives same credits + unlimited users + full AI CRM. Upgrade saves ₹600" },
      { credits: "5,000", price: "₹2,499", per_credit: "₹0.50", note: "At ₹2,499 top-up vs ₹899/user Growth — upgrading wins every time" },
    ],
  },
};

const PRICING_FAQ = [
  { q: "Is the Free plan really forever?", a: "Yes. Free Forever is not a trial — it never expires. You keep it as long as you want." },
  { q: "Is there a free trial on paid plans?", a: "Professional (global) and Growth (India) have a 14-day free trial with full feature access. No credit card required." },
  { q: "Is there a money-back guarantee?", a: "Yes — 30 days on Professional (global) and 30-day pro-rated refund on India annual plans." },
  { q: "Can I switch plans anytime?", a: "Yes. You can upgrade or downgrade at any time." },
  { q: "Are there setup fees?", a: "No setup fees and no hidden costs on any plan." },
  { q: "Do you offer nonprofit discounts?", a: "Yes — 50% off Professional for nonprofits with documentation." },
  { q: "What payment methods are accepted?", a: "Global: credit cards, ACH (US), wire transfers. India: UPI, NEFT, Razorpay, credit cards. All India prices include GST." },
  { q: "What is the Starter plan user cap?", a: "India Starter has a 10-user hard cap. All other paid plans have unlimited users." },
  { q: "Does the Managed RevOps service require a long-term contract?", a: "No long-term contract required, but a 3-month initial engagement is recommended." },
  { q: "How does annual billing work?", a: "Annual plans are 10 months paid, 2 months free — effectively a 17% discount. Billed upfront annually." },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tools
// ─────────────────────────────────────────────────────────────────────────────

// ── pricing_get_plans ──────────────────────────────────────────────────────────

export const pricingGetPlans = defineTool({
  schema: z.object({
    region: z.enum(["global", "india", "both"]).default("both").describe("'global' for USD plans, 'india' for INR plans, 'both' for all."),
    plan: z.string().optional().describe("Filter by plan slug: free, professional, starter, growth, growth-engine, enterprise, revops-partner."),
  }),
  definition: {
    name: "pricing_get_plans",
    description: "Get HelloGrowthCRM pricing plans. Use region='global' for USD plans (Free, Professional, Growth Engine, RevOps Partner) or region='india' for INR plans (Free, Starter, Growth, Enterprise).",
    inputSchema: {
      type: "object",
      properties: {
        region: { type: "string", enum: ["global", "india", "both"], default: "both" },
        plan: { type: "string", description: "Filter by plan slug." },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    let result: Record<string, unknown> = {};

    if (args.region === "global" || args.region === "both") {
      const plans = args.plan
        ? GLOBAL_PLANS.filter((p) => p.slug === args.plan)
        : GLOBAL_PLANS;
      result.global_usd = { currency: "USD", plan_count: plans.length, plans };
    }

    if (args.region === "india" || args.region === "both") {
      const plans = args.plan
        ? INDIA_PLANS.filter((p) => p.slug === args.plan)
        : INDIA_PLANS;
      result.india_inr = { currency: "INR", plan_count: plans.length, plans };
    }

    return ok(result);
  },
});

// ── pricing_get_addons ────────────────────────────────────────────────────────

export const pricingGetAddons = defineTool({
  schema: z.object({
    region: z.enum(["global", "india", "both"]).default("both"),
    type: z.enum(["dialer", "ai_credits", "all"]).default("all").describe("'dialer' for dialer add-ons, 'ai_credits' for India AI credit top-up bundles."),
  }),
  definition: {
    name: "pricing_get_addons",
    description: "Get HelloGrowthCRM add-on pricing: dialer tiers (USD/INR) and India AI credit top-up bundles.",
    inputSchema: {
      type: "object",
      properties: {
        region: { type: "string", enum: ["global", "india", "both"], default: "both" },
        type: { type: "string", enum: ["dialer", "ai_credits", "all"], default: "all" },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    const result: Record<string, unknown> = {};

    if (args.region === "global" || args.region === "both") {
      result.global_usd = {};
      if (args.type === "dialer" || args.type === "all") {
        (result.global_usd as Record<string, unknown>).dialer = ADDONS.global_usd.dialer;
      }
    }

    if (args.region === "india" || args.region === "both") {
      result.india_inr = {};
      if (args.type === "dialer" || args.type === "all") {
        (result.india_inr as Record<string, unknown>).dialer = ADDONS.india_inr.dialer;
      }
      if (args.type === "ai_credits" || args.type === "all") {
        (result.india_inr as Record<string, unknown>).ai_credit_topups = ADDONS.india_inr.ai_credit_topups;
      }
    }

    return ok(result);
  },
});

// ── pricing_get_faq ───────────────────────────────────────────────────────────

export const pricingGetFaq = defineTool({
  schema: z.object({
    search: z.string().optional().describe("Filter FAQs by keyword."),
  }),
  definition: {
    name: "pricing_get_faq",
    description: "Get pricing FAQs for HelloGrowthCRM — trials, refunds, billing, discounts, payment methods.",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Keyword filter." },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    let faqs = PRICING_FAQ;
    if (args.search) {
      const q = args.search.toLowerCase();
      faqs = faqs.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
    }
    return ok({ count: faqs.length, faqs });
  },
});

// ── pricing_compare_plans ─────────────────────────────────────────────────────

export const pricingComparePlans = defineTool({
  schema: z.object({
    plan_a: z.string().describe("First plan slug (e.g. free, starter, professional, growth)."),
    plan_b: z.string().describe("Second plan slug to compare against."),
    region: z.enum(["global", "india"]).default("india"),
  }),
  definition: {
    name: "pricing_compare_plans",
    description: "Compare two HelloGrowthCRM plans side by side — shows price difference and feature delta.",
    inputSchema: {
      type: "object",
      properties: {
        plan_a: { type: "string" },
        plan_b: { type: "string" },
        region: { type: "string", enum: ["global", "india"], default: "india" },
      },
      required: ["plan_a", "plan_b"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    const source = args.region === "india" ? INDIA_PLANS : GLOBAL_PLANS;
    const a = source.find((p) => p.slug === args.plan_a);
    const b = source.find((p) => p.slug === args.plan_b);

    const available = source.map((p) => p.slug).join(", ");
    if (!a) return ok({ error: `Plan "${args.plan_a}" not found. Available: ${available}` });
    if (!b) return ok({ error: `Plan "${args.plan_b}" not found. Available: ${available}` });

    return ok({
      region: args.region,
      comparison: {
        plan_a: { name: a.name, price_annual: a.price_annual, price_monthly: a.price_monthly, ai_credits: a.ai_credits, best_for: a.best_for },
        plan_b: { name: b.name, price_annual: b.price_annual, price_monthly: b.price_monthly, ai_credits: b.ai_credits, best_for: b.best_for },
      },
      plan_a_features: a.features,
      plan_b_features: b.features,
    });
  },
});
