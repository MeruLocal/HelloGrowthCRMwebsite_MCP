// ─────────────────────────────────────────────────────────────────────────────
// Plan truth — the ONE place this server states plan limits and the AI
// allowance. Every tool that mentions the Free plan, a Free cap or an AI credit
// figure reads it from here, so a plan change is a one-line edit instead of a
// grep across a dozen hand-typed "200 leads" / "150 leads" copies.
//
// WHY: the 2026-11-19 live audit found four different Free-plan lead caps in
// circulation on this server (200, 150, "200 contacts", and the plan card's
// 150) and none of them matched the product. Each was a literal typed into a
// different tool.
//
// SOURCE (hellocrm, branch `app` = PROD, re-read 2026-11-26):
//   • supabase/migrations/20261030152543_free_plan_rebalance.sql (PLAN-HGC-0652,
//     hellocrm #9852, live on PROD): Free max_leads 150 → 500, landing_pages 1,
//     max_task_boards 1, max_booking_pages 1, analytics_window_days 30; adds
//     task_boards, scheduler, analytics_dashboard and landing_pages to Free; moves
//     ~52 modules (team inbox, WhatsApp hub, cadences, workflow automation, AI
//     agents, report builder, every industry module, …) to Growth.
//   • supabase/migrations/20260804113254_tighten_free_plan_limits.sql: Free
//     max_tasks 100, max_accounts 20, max_email_templates 2, max_custom_fields 3
//     (not changed by #9852).
//   • supabase/migrations/20260707000000_plan_restructure_plans_config.sql:
//     plans.limits.ai_credits_per_user — Free 100, Growth 1,000 (the last
//     migration to set either value; apply_subscription_to_tenant copies it onto
//     tenants.ai_credits_per_user).
//
// Enterprise AI allowance is deliberately NOT stated: no migration has revised
// it since the April seed, so there is no current figure to quote. Enterprise is
// custom-priced and its allowance is set per contract.
// ─────────────────────────────────────────────────────────────────────────────

export const PLAN_TRUTH_SOURCE =
  "hellocrm plans config on PROD: free_plan_rebalance (PLAN-HGC-0652, live 2026-10-30) + tighten_free_plan_limits + plan_restructure_plans_config";

export const PLAN_TRUTH_VERIFIED_AT = "2026-11-26";

/** The plan ladder in every market. Starter, Growth Engine and RevOps Partner are not CRM plans. */
export const PLAN_LADDER = ["Free", "Growth", "Enterprise"] as const;

export const FREE_PLAN = {
  users: 1,
  leads: 500,
  accounts: 20,
  tasks: 100,
  taskBoards: 1,
  bookingPages: 1,
  landingPages: 1,
  analyticsWindowDays: 30,
  pipelines: 1,
  emailTemplates: 2,
  customFields: 3,
  aiCreditsPerUserPerMonth: 100,
} as const;

export const GROWTH_PLAN = {
  aiCreditsPerUserPerMonth: 1000,
} as const;

const n = (v: number) => v.toLocaleString("en-US");

/** One-line Free-plan summary, reused by FAQs, switch guides and comparisons. */
export const FREE_PLAN_SUMMARY =
  `${n(FREE_PLAN.leads)} leads, ${FREE_PLAN.accounts} accounts, ${FREE_PLAN.tasks} tasks, ` +
  `${FREE_PLAN.taskBoards} task board, ${FREE_PLAN.bookingPages} booking page, ` +
  `${FREE_PLAN.landingPages} landing page and ${FREE_PLAN.analyticsWindowDays}-day analytics for ${FREE_PLAN.users} user`;

/** Short form for a comparison-table cell. */
export const FREE_PLAN_CELL = `Yes — ${n(FREE_PLAN.leads)} leads, forever, no credit card`;

/**
 * India price wording, matching hellocrm billing (`_shared/billingHandlers/gstinPricing.ts` on the
 * `app` branch): ₹899 + 18% = ₹1,060.82 per seat per month, GSTIN or not. A GSTIN changes the invoice,
 * not the price. Never write "GSTIN-conditional" and never ₹1,099.
 */
export const INDIA_TAX_NOTE =
  "₹899 per user per month + 18% GST, so ₹1,060.82 is billed per user per month in India, with or without a GSTIN. A GSTIN does not change the price; it puts your GST number on the invoice so you can claim input tax credit. USD prices carry no GST.";

export const INDIA_GROWTH_PRICE = "₹899/user/month + 18% GST (₹1,060.82 billed)";
