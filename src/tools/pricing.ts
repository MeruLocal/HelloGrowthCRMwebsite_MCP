import { z } from "zod";
import { defineTool, ok } from "./tool-types.js";
import { COUNTRY_PRICING, MANAGED_REVOPS, SYNCED_AT } from "../data/website-mirror.js";
import { FREE_PLAN, GROWTH_PLAN, INDIA_GROWTH_PRICE, INDIA_TAX_NOTE } from "../data/plan-truth.js";
// The integration figure is DERIVED from the mirrored catalog rows (see
// src/tools/integrations.ts). Typing a digit here is how "630+ integrations"
// survived three months inside a plan feature bullet after the website
// retired the number — 630 counts 371 scaffolded rows that are not built.
import { LIVE_INTEGRATION_COUNT, INTEGRATION_CATEGORY_COUNT } from "./integrations.js";

// ─────────────────────────────────────────────────────────────────────────────
// Pricing data — sourced from hellocrmwebsite/src/lib/pricing-usa-data.ts,
// pricing-india-data.ts and managed-revops-content.ts (synced 2026-08-06)
//
// REWRITTEN 2026-08-06. The previous GLOBAL_PLANS was a full plan generation
// behind the website and was quoting plans that no longer exist:
//
//   • "Professional" was renamed to "Growth" and its monthly rate moved
//     $12 → $13. AI credits were 2,500/user/mo, not 50,000.
//     Founder set USD monthly Growth back to $12 on 2026-10-15 (USD annual $10 unchanged).
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
//
// UPDATED 2026-11-26 (live audit of 2026-11-19): the Free plan is now built
// from src/data/plan-truth.ts after the Free-plan rebalance went live on PROD
// (500 leads, 1 task board, 1 booking page, 1 landing page, 30-day analytics);
// the enforced AI allowance is 100 credits/user/month on Free and 1,000 on
// Growth (the 2,500 / 10,000 / "50 total" figures matched nothing enforced).
// ─────────────────────────────────────────────────────────────────────────────

// The Free plan is built from FREE_PLAN (src/data/plan-truth.ts) so its caps
// cannot drift from the FAQ, switch-guide and comparison copy that quote them.
function freePlan(zero: string, bestFor: string) {
  const f = FREE_PLAN;
  return {
    name: "Free Forever",
    slug: "free",
    price_annual: zero,
    price_monthly: zero,
    billing: `Free forever · No credit card · ${f.users} user · ${f.leads} leads · Never expires`,
    best_for: bestFor,
    ai_credits: `${f.aiCreditsPerUserPerMonth} per user/month`,
    limits: {
      users: f.users,
      leads: f.leads,
      accounts: f.accounts,
      pipelines: f.pipelines,
      tasks: f.tasks,
      task_boards: f.taskBoards,
      booking_pages: f.bookingPages,
      landing_pages: f.landingPages,
      analytics_window_days: f.analyticsWindowDays,
      email_templates: f.emailTemplates,
      custom_fields: f.customFields,
    },
    features: [
      `Lead & Contact Management (${f.leads} leads cap)`,
      `Accounts (${f.accounts} cap) + ${f.pipelines} deal pipeline`,
      "Pipeline Management (Kanban)",
      `Task Boards (${f.taskBoards} board, ${f.tasks} tasks)`,
      `Scheduler (${f.bookingPages} booking page)`,
      `Landing pages (${f.landingPages} page)`,
      `Analytics dashboard (last ${f.analyticsWindowDays} days)`,
      "Basic activity logging",
      `${f.emailTemplates} Basic Email Templates`,
      `${f.customFields} Custom Fields`,
      "WhatsApp click-to-chat only (the WhatsApp hub and team inbox are Growth)",
      `AI assistance — ${f.aiCreditsPerUserPerMonth} AI credits/user/month`,
      "Community support",
      "\"Powered by HelloGrowthCRM\" branding shown",
    ],
    cta_url: "https://app.hellogrowthcrm.com/signup",
  };
}

const GLOBAL_PLANS = [
  freePlan("$0", "Our default starter — not a trial"),
  {
    name: "Growth",
    slug: "growth",
    price_annual: "$10/user/month (billed annually)",
    // $12 per HG-004 (2026-08-12, pricing-constants.ts in hellocrmwebsite) —
    // the canonical decision postdates this file's 8/6 rewrite which had $13.
    price_monthly: "$12/user/month",
    billing: "Per-user pricing · Annual or monthly billing · 14-day free trial",
    best_for: "Growing sales teams outside India (US, UK, Canada, Australia, UAE, Singapore, New Zealand)",
    ai_credits: `${GROWTH_PLAN.aiCreditsPerUserPerMonth.toLocaleString("en-US")} per user/month`,
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
      `${LIVE_INTEGRATION_COUNT} live integrations across ${INTEGRATION_CATEGORY_COUNT} categories`,
      "Custom fields, modules, pipeline stages & workflows",
      "Territory & team management with map view",
      "Probability-weighted pipeline forecast (stage probabilities)",
      "Role-based access control",
      "Priority support + dedicated onboarding",
      "Managed RevOps add-on available — our specialists run your pipeline (from $1,499/mo flat)",
      `${GROWTH_PLAN.aiCreditsPerUserPerMonth.toLocaleString("en-US")} AI credits/user/month`,
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
    best_for: "Large enterprises outside India with complex needs",
    ai_credits: "Set per contract",
    limits: { leads: "Unlimited", accounts: "Unlimited", pipelines: "Unlimited", tasks: "Unlimited" },
    features: [
      "Everything in Growth, PLUS:",
      "Dedicated named Account Manager",
      "Custom workflow automation (multi-step, approval flows)",
      "Multi-location / branch management",
      "Audit trails, compliance reporting & full activity audit",
      "White-label customer portal & custom agents",
      "SLA policies, approval flows & multi-currency commerce",
      "Unlimited exports",
      `All ${LIVE_INTEGRATION_COUNT} live integrations + custom integration support`,
      "Managed RevOps included — dedicated RevOps Specialists run your pipeline (Growth Engine + RevOps Partner tiers)",
      "Custom training (up to 4 sessions/year)",
      "SLA-backed 99.9% uptime",
      "Priority phone support",
      "Custom API rate limits",
      "Data migration & onboarding support",
      "AI credit allowance set per contract",
    ],
    cta_url:
      "https://app.hellogrowthcrm.com/book/hellogrowthcrm-app-free-demo?token=77396889-c602-4e59-be14-d16f8663e5ba",
  },
];

const INDIA_PLANS = [
  freePlan("₹0", "Default starter — not a trial"),
  // The India Starter plan (₹99/user/mo) was removed from the website —
  // Growth (₹899) is now the entry paid self-serve plan for India.
  {
    name: "Growth",
    slug: "growth",
    // ₹899 + 18% GST on BOTH billing modes (billed ₹1,060.82/mo), as hellocrm billing charges.
    price_annual: `${INDIA_GROWTH_PRICE} — annual: 10 months paid, 2 months free (₹8,990/user/year + 18% GST)`,
    price_monthly: `${INDIA_GROWTH_PRICE} — same rate; annual adds 2 months free`,
    tax_note: INDIA_TAX_NOTE,
    billing: "Per-user pricing · Annual or monthly billing · 14-day free trial · Hero tier",
    best_for: "Growing Indian sales teams",
    ai_credits: `${GROWTH_PLAN.aiCreditsPerUserPerMonth.toLocaleString("en-US")} per user/month`,
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
      `${LIVE_INTEGRATION_COUNT} live integrations across ${INTEGRATION_CATEGORY_COUNT} categories`,
      "Custom fields, modules, pipeline stages & workflows",
      "Territory & team management with map view",
      "Probability-weighted pipeline forecast (stage probabilities)",
      "Role-based access control",
      "Priority support + dedicated onboarding",
      `${GROWTH_PLAN.aiCreditsPerUserPerMonth.toLocaleString("en-US")} AI credits/user/month`,
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
    ai_credits: "Set per contract",
    limits: { leads: "Unlimited", accounts: "Unlimited", pipelines: "Unlimited", tasks: "Unlimited" },
    features: [
      "Everything in Growth, PLUS:",
      "Dedicated named Account Manager",
      "Custom workflow automation (multi-step, approval flows)",
      "Multi-branch / location management",
      "Audit trails, compliance reporting & full activity audit",
      "White-label customer portal & custom agents",
      "SLA policies, approval flows & multi-currency commerce",
      "Unlimited exports",
      "Test cases for SaaS / QA teams",
      `All ${LIVE_INTEGRATION_COUNT} live integrations + custom integration support`,
      "Custom training (up to 4 sessions/year)",
      "SLA-backed 99.9% uptime",
      "Priority phone support",
      "Custom API rate limits",
      "Data migration & onboarding support",
      "AI credit allowance set per contract",
    ],
    cta_url: "https://calendly.com/hellogrowthcrm-sales/demo",
  },
];

// Add-ons. The dialer tiers ($15/$29/$49, ₹799/₹1,499/₹2,499) and the India
// AI-credit top-up bundles that used to live here matched no billing SKU in the
// product (re-checked against hellocrm `app` 2026-11-26), and the top-up notes
// compared against a 2,500-credit Growth allowance that is not enforced. They
// are withdrawn until a purchasable SKU exists; the tool now says so instead of
// quoting a price nobody can pay.
const ADDONS_NOTE =
  "No add-on is sold at a published self-serve price today. Calling, extra AI credits and other add-ons are quoted by sales — see https://hellogrowthcrm.com/pricing or contact sales.";
const ADDONS = {
  global_usd: { dialer: [] as { name: string; price: string; desc: string }[] },
  india_inr: {
    dialer: [] as { name: string; price: string; desc: string }[],
    ai_credit_topups: [] as { credits: string; price: string; per_credit: string; note: string }[],
  },
};

const PRICING_FAQ = [
  { q: "Is the Free plan really forever?", a: "Yes. Free Forever is not a trial — it never expires. You keep it as long as you want." },
  { q: "Is there a free trial on paid plans?", a: "Growth has a 14-day free trial with full feature access in every market. No credit card required." },
  { q: "Is there a money-back guarantee?", a: "Yes — a 14-day money-back window on annual plans (7-day on monthly renewals), pro-rated on India annual plans. See the refund policy at /legal/refunds." },
  { q: "Can I switch plans anytime?", a: "Yes. You can upgrade or downgrade at any time." },
  { q: "Are there setup fees?", a: "No setup fees and no hidden costs on any plan." },
  { q: "What are the plan tiers?", a: "Free Forever, Growth, and Enterprise — the same ladder in every market. Growth is the hero plan at $10/user/mo annually ($12 monthly in the US); Enterprise is custom-priced. Managed RevOps is a separate flat-fee service, available as an add-on on Growth and included with Enterprise." },
  { q: "Do you offer nonprofit discounts?", a: "Yes — 50% off Growth for nonprofits with documentation." },
  { q: "What payment methods are accepted?", a: "Varies by market — US: credit card, ACH, PayPal, Stripe. India: UPI, Razorpay, Net Banking, credit/debit card. UK: card, Stripe, GoCardless, bank transfer. India prices exclude GST — 18% GST is added on top (₹899 bills as ₹1,060.82), with or without a GSTIN. Call pricing_get_country_plans for a specific market." },
  { q: "Is there a minimum number of users?", a: `No minimum. The Free plan supports ${FREE_PLAN.users} user (${FREE_PLAN.leads} leads). Growth and Enterprise scale from 1 user upward. The Managed RevOps tiers (Growth Engine, RevOps Partner) are flat monthly retainers with no per-seat charge.` },
  { q: "Does the Managed RevOps service require a long-term contract?", a: "No long-term contract required, but a 3-month initial engagement is recommended." },
  { q: "How does annual billing work?", a: "Annual plans are 10 months paid, 2 months free — effectively a 17% discount. Billed upfront annually." },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tools
// ─────────────────────────────────────────────────────────────────────────────

// ── pricing_get_plans ──────────────────────────────────────────────────────────

/**
 * Pricing is country-aware, not India-only. Returned with pricing_get_plans so an
 * assistant does not read "global_usd" as "US only" or the INR ladder as the only one.
 */
export const MARKET_SCOPE = {
  summary:
    "HelloGrowthCRM is sold worldwide with country-aware pricing. India is billed in INR; every other market is billed in USD or its local currency.",
  india: "India: Growth is INR 899 per user per month plus 18% GST (INR 1,060.82 billed), billed in INR (UPI, Razorpay, net banking, card).",
  outside_india:
    "Outside India: Growth is USD 12 per user per month on monthly billing, with a lower per-month rate on yearly billing. Local-currency prices exist for the UK (GBP), Canada (CAD), Australia (AUD), UAE (AED), Singapore (SGD) and New Zealand (NZD).",
  yearly_discount: "Yearly billing is discounted in every market (India: two months free).",
  more: "Call pricing_get_country_plans for each market's currency, payment methods and compliance posture, countries_list for the 8 localized hubs, and country_get for one market's profile.",
} as const;

export const pricingGetPlans = defineTool({
  schema: z.object({
    region: z.enum(["global", "india", "both"]).default("both").describe("'global' for USD plans, 'india' for INR plans, 'both' for all."),
    plan: z.string().optional().describe("Filter by plan slug: free, growth, enterprise."),
  }),
  definition: {
    name: "pricing_get_plans",
    description: "Get HelloGrowthCRM CRM plans. Pricing is country-aware, not India-only: India is INR, other markets USD or local currency (see market_scope in the result). The ladder is Free Forever → Growth → Enterprise in every market. Use region='global' for USD or region='india' for INR. Managed RevOps retainers are a separate service — call pricing_get_managed_revops for those.",
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

    result.market_scope = MARKET_SCOPE;
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
    description: "Get HelloGrowthCRM add-on pricing. No add-on currently has a published self-serve price (dialer tiers and AI-credit top-ups were withdrawn because no billing SKU exists); the result says how add-ons are quoted.",
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

    result.note = ADDONS_NOTE;
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
      "Get HelloGrowthCRM country-localized pricing for the 8 market hubs (India, United States, United Kingdom, Canada, Australia, UAE, Singapore, New Zealand) — pricing is country-aware, not India-only: currency, the Growth plan's annual and monthly per-user price, the full plan-ladder summary line, accepted payment methods, compliance posture, and the country pricing page URL.",
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
