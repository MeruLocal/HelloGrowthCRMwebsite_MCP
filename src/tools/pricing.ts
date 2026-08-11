import { z } from "zod";
import { defineTool, ok } from "./tool-types.js";
import { COUNTRY_PRICING, MANAGED_REVOPS, SYNCED_AT } from "../data/website-mirror.js";

// ─────────────────────────────────────────────────────────────────────────────
// Pricing data — sourced from hellocrmwebsite/src/lib/pricing-usa-data.ts,
// pricing-india-data.ts and managed-revops-content.ts (synced 2026-08-06)
//
// REWRITTEN 2026-08-06. The previous GLOBAL_PLANS was a full plan generation
// behind the website and was quoting plans that no longer exist:
//
//   • "Professional" was renamed to "Growth" and its monthly rate moved
//     $12 → $13. AI credits were 2,500/user/mo, not 50,000.
//   • The Free tier caps tightened: 150 leads / 20 accounts / 100 tasks /
//     2 templates (this file claimed 200 / 50 / 500 / 5).
//   • "Growth Engine" and "RevOps Partner" are NOT CRM plan tiers. They are
//     Managed RevOps service retainers — Growth lists the service as an add-on
//     and Enterprise bundles it. They are exposed by pricing_get_managed_revops
//     below, at their current prices ($1,499 / $3,999, not $1,500 / $4,000).
//     The prices themselves were close to right; listing them as per-seat CRM
//     tiers is what made them misleading.
//   • "Enterprise" (custom pricing) was missing entirely from the global ladder.
//
// The live ladder in every market is: Free Forever → Growth → Enterprise.
// ─────────────────────────────────────────────────────────────────────────────

const GLOBAL_PLANS = [
  {
    name: "Free Forever",
    slug: "free",
    price_annual: "$0",
    price_monthly: "$0",
    billing: "Free forever · No credit card · 1 user · 150 leads · Never expires",
    best_for: "Our default starter — not a trial",
    ai_credits: "50 total",
    limits: { users: 1, leads: 150, accounts: 20, pipelines: 1, tasks: 100 },
    features: [
      "Lead & Contact Management (150 leads/contacts cap)",
      "Accounts (20 cap) + 1 deal pipeline",
      "Pipeline Management (Kanban)",
      "Task Board (100 tasks, Kanban only)",
      "Basic activity logging",
      "2 Basic Email Templates",
      "3 Custom Fields",
      "WhatsApp click-to-chat only (no API-backed inbox)",
      "AI Writing Assistant (capped, 5 uses/month)",
      "AI Chatbot — 1 conversation/month",
      "Mobile dashboard (read-only)",
      "30-day analytics",
      "1 Growth Audit included",
      "Community support",
      "\"Powered by HelloGrowthCRM\" branding shown",
    ],
    cta_url: "https://app.hellogrowthcrm.com/signup",
  },
  {
    name: "Growth",
    slug: "growth",
    price_annual: "$10/user/month (billed annually)",
    price_monthly: "$13/user/month",
    billing: "Annual billing · Unlimited users · 14-day free trial",
    best_for: "Growing US sales teams",
    ai_credits: "2,500 per user/month",
    limits: { leads: "Unlimited", accounts: "Unlimited", pipelines: "Unlimited", tasks: "Unlimited" },
    popular: true,
    features: [
      "Everything in Free, PLUS:",
      "Unlimited leads, contacts & deals with unlimited pipelines",
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
      "API access & all 630+ integrations across 116 categories",
      "Custom fields, modules, pipeline stages & workflows",
      "Territory & team management with map view",
      "AI-assisted sales forecasting",
      "Role-based access control",
      "Priority support + dedicated onboarding",
      "Managed RevOps add-on available — our specialists run your pipeline (from $1,499/mo flat)",
      "2,500 AI credits/user/month",
    ],
    guarantees: ["14-day free trial", "14-day money-back guarantee on annual plans (7-day on monthly renewals)"],
    cta_url: "https://app.hellogrowthcrm.com/signup",
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    price_annual: "Talk to us — custom pricing",
    price_monthly: "Annual contract · Custom pricing",
    billing: "Annual contract · Custom per-company pricing",
    best_for: "Large US enterprises",
    ai_credits: "10,000 per user/month + 3-month rollover",
    limits: { leads: "Unlimited", accounts: "Unlimited", pipelines: "Unlimited", tasks: "Unlimited" },
    features: [
      "Everything in Growth, PLUS:",
      "Dedicated named Account Manager",
      "Custom workflow automation (multi-step, approval flows)",
      "Advanced revenue intelligence, attribution & churn prediction",
      "Multi-location / branch management",
      "Audit trails, compliance reporting & full activity audit",
      "White-label customer portal & custom agents",
      "SLA policies, approval flows & multi-currency commerce",
      "Unlimited exports + scheduled reports",
      "All 630+ integrations + custom integration support",
      "Managed RevOps included — dedicated RevOps Specialists run your pipeline (Growth Engine + RevOps Partner tiers)",
      "Custom training (up to 4 sessions/year)",
      "SLA-backed 99.9% uptime",
      "Priority phone support",
      "Custom API rate limits",
      "Data migration & onboarding support",
      "10,000 AI credits/user/month + 3-month rollover",
    ],
    cta_url:
      "https://app.hellogrowthcrm.com/book/hellogrowthcrm-app-free-demo?token=77396889-c602-4e59-be14-d16f8663e5ba",
  },
];

const INDIA_PLANS = [
  {
    name: "Free Forever",
    slug: "free",
    price_annual: "₹0",
    price_monthly: "₹0",
    billing: "Free forever · No credit card · 1 user · 150 leads · Never expires",
    best_for: "Default starter — not a trial",
    ai_credits: "50 total",
    limits: { leads: 150, accounts: 20, pipelines: 1, tasks: 100 },
    features: [
      "Lead & Contact Management (150 leads/contacts cap)",
      "Accounts (20 cap) + 1 deal pipeline",
      "Pipeline Management (Kanban)",
      "Task Board (100 tasks, Kanban only)",
      "Basic activity logging",
      "2 Basic Email Templates",
      "3 Custom Fields",
      "WhatsApp click-to-chat only (no API-backed inbox)",
      "AI Writing Assistant (capped, 5 uses/month)",
      "AI Chatbot — 1 conversation/month",
      "Mobile dashboard (read-only)",
      "30-day analytics",
      "1 Growth Audit included",
      "Community support",
      "\"Powered by HelloGrowthCRM\" branding shown",
    ],
    cta_url: "https://app.hellogrowthcrm.com/signup",
  },
  // The India Starter plan (₹99/user/mo) was removed from the website —
  // Growth (₹899) is now the entry paid self-serve plan for India.
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
      "Everything in Free, PLUS:",
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
      "API access & all 630 integrations across 116 categories",
      "Custom fields, modules, pipeline stages & workflows",
      "Territory & team management with map view",
      "AI-assisted sales forecasting",
      "Role-based access control",
      "Priority support + dedicated onboarding",
      "2,500 AI credits/user/month",
    ],
    guarantees: ["14-day free trial", "14-day money-back window on annual plans (7-day on monthly renewals; pro-rated on India annual plans)"],
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
      "All 630 integrations + custom integration support",
      "Custom training (up to 4 sessions/year)",
      "SLA-backed 99.9% uptime",
      "Priority phone support",
      "Custom API rate limits",
      "Data migration & onboarding support",
      "10,000 AI credits/user/month + 3-month rollover",
    ],
    cta_url: "https://calendly.com/hellogrowthcrm-sales/demo",
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
      { credits: "500", price: "₹299", per_credit: "₹0.60", note: "Repeat top-up habit — consider upgrading to Growth" },
      { credits: "1,000", price: "₹549", per_credit: "₹0.55", note: "Growth gives 2,500/user for just ₹350 more per month" },
      { credits: "2,500", price: "₹1,499", per_credit: "₹0.60", note: "Growth (₹899) gives the same credits + unlimited users + full AI CRM. Upgrade saves ₹600" },
      { credits: "5,000", price: "₹2,499", per_credit: "₹0.50", note: "At ₹2,499 top-up vs ₹899/user Growth — upgrading wins every time" },
    ],
  },
};

const PRICING_FAQ = [
  { q: "Is the Free plan really forever?", a: "Yes. Free Forever is not a trial — it never expires. You keep it as long as you want." },
  { q: "Is there a free trial on paid plans?", a: "Growth has a 14-day free trial with full feature access in every market. No credit card required." },
  { q: "Is there a money-back guarantee?", a: "Yes — a 14-day money-back window on annual plans (7-day on monthly renewals), pro-rated on India annual plans. See the refund policy at /legal/refunds." },
  { q: "Can I switch plans anytime?", a: "Yes. You can upgrade or downgrade at any time." },
  { q: "Are there setup fees?", a: "No setup fees and no hidden costs on any plan." },
  { q: "What are the plan tiers?", a: "Free Forever, Growth, and Enterprise — the same ladder in every market. Growth is the hero plan at $10/user/mo annually ($13 monthly in the US); Enterprise is custom-priced. Managed RevOps is a separate flat-fee service, available as an add-on on Growth and included with Enterprise." },
  { q: "Do you offer nonprofit discounts?", a: "Yes — 50% off Growth for nonprofits with documentation." },
  { q: "What payment methods are accepted?", a: "Varies by market — US: credit card, ACH, PayPal, Stripe. India: UPI, Razorpay, Net Banking, credit/debit card. UK: card, Stripe, GoCardless, bank transfer. All India prices include GST. Call pricing_get_country_plans for a specific market." },
  { q: "Is there a minimum number of users?", a: "No minimum. The Free plan supports 1 user (150 leads). Growth and Enterprise scale from 1 user upward. The Managed RevOps tiers (Growth Engine, RevOps Partner) are flat monthly retainers with no per-seat charge." },
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
    plan: z.string().optional().describe("Filter by plan slug: free, growth, enterprise."),
  }),
  definition: {
    name: "pricing_get_plans",
    description: "Get HelloGrowthCRM CRM plans. The ladder is Free Forever → Growth → Enterprise in every market. Use region='global' for USD or region='india' for INR. Managed RevOps retainers are a separate service — call pricing_get_managed_revops for those.",
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
    plan_a: z.string().describe("First plan slug (free, growth, enterprise)."),
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

// ── pricing_get_country_plans ──────────────────────────────────────────────────
// Country-localized pricing summaries (sourced from lib/pricing-*-data.ts).
// The full global/India plan detail lives in pricing_get_plans; this surfaces the
// 8 localized hubs (currency, Growth annual/monthly price, payment methods,
// compliance, pricing page href).

export const pricingGetCountryPlans = defineTool({
  schema: z.object({
    country: z
      .string()
      .optional()
      .describe("Country slug (in, usa, uk, canada, au, uae, singapore, new-zealand). Omit for all."),
  }),
  definition: {
    name: "pricing_get_country_plans",
    description:
      "Get HelloGrowthCRM country-localized pricing for the 8 market hubs: currency, the Growth plan's annual and monthly per-user price, the full plan-ladder summary line, accepted payment methods, compliance posture, and the country pricing page URL.",
    inputSchema: {
      type: "object",
      properties: {
        country: {
          type: "string",
          description: "in | usa | uk | canada | au | uae | singapore | new-zealand",
        },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    const rows = args.country
      ? COUNTRY_PRICING.filter((p) => p.countrySlug === args.country!.toLowerCase())
      : COUNTRY_PRICING;
    if (args.country && rows.length === 0) {
      return ok({
        error: `Country "${args.country}" not found. Available: ${COUNTRY_PRICING.map((p) => p.countrySlug).join(", ")}.`,
      });
    }
    return ok({
      synced_at: SYNCED_AT,
      count: rows.length,
      country_pricing: rows.map((p) => ({
        ...p,
        home_url: `https://hellogrowthcrm.com${p.homeHref}`,
        pricing_url: `https://hellogrowthcrm.com${p.pricingHref}`,
      })),
    });
  },
});

// ── pricing_get_managed_revops ─────────────────────────────────────────────────
// Managed RevOps is a SERVICE, not a CRM plan tier. It is sold as a flat monthly
// retainer alongside the CRM: available as an add-on on Growth, bundled with
// Enterprise. These figures used to sit in a COUNTRY_PRICING field labelled
// "per user/mo", which invited exactly the wrong reading. Keep them here.

export const pricingGetManagedRevOps = defineTool({
  schema: z.object({
    country: z
      .string()
      .optional()
      .describe(
        "Market slug (global, in, usa, uk, canada, au, uae, singapore, new-zealand). Omit for all.",
      ),
  }),
  definition: {
    name: "pricing_get_managed_revops",
    description:
      "Get HelloGrowthCRM Managed RevOps service pricing — the Growth Engine and RevOps Partner tiers, as a flat monthly retainer in local currency. This is a done-for-you service where HelloGrowthCRM specialists run the customer's pipeline; it is NOT a per-seat CRM plan. Available as an add-on on Growth and included with Enterprise.",
    inputSchema: {
      type: "object",
      properties: {
        country: {
          type: "string",
          description: "global | in | usa | uk | canada | au | uae | singapore | new-zealand",
        },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    const available = Object.keys(MANAGED_REVOPS).join(", ");

    if (args.country) {
      const key = args.country.toLowerCase();
      const tiers = MANAGED_REVOPS[key];
      if (!tiers) {
        return ok({ error: `Market "${args.country}" not found. Available: ${available}.` });
      }
      return ok({
        synced_at: SYNCED_AT,
        billing_model: "Flat monthly retainer — not per seat. No long-term contract required.",
        market: key,
        tiers,
      });
    }

    return ok({
      synced_at: SYNCED_AT,
      billing_model: "Flat monthly retainer — not per seat. No long-term contract required.",
      market_count: Object.keys(MANAGED_REVOPS).length,
      markets: MANAGED_REVOPS,
    });
  },
});
