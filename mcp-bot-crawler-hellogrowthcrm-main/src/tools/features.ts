import { z } from "zod";
import { defineTool, fail, ok } from "./tool-types.js";

// ── Static feature data ───────────────────────────────────────────────────────

type PlanAvailability = boolean | string;

interface Feature {
  slug: string;
  title: string;
  category: string;
  summary: string;
  bullets: string[];
  free: PlanAvailability;
  t1: PlanAvailability;
  t2: PlanAvailability;
  t3: PlanAvailability;
  learnMoreHref?: string;
  aliases?: string[];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const RAW_FEATURES: Omit<Feature, "slug">[] = [
  // ── Core CRM ────────────────────────────────────────────────────────────────
  {
    title: "Dashboard",
    category: "Core CRM",
    summary: "A visual home base that gives teams an at-a-glance view of pipeline health, activity trends, and revenue progress without needing to build reports manually.",
    bullets: [
      "Designed to reduce the time reps and managers spend digging for status before standups or reviews",
      "Higher plan tiers unlock more panel types and deeper customization options",
      "Useful across sales, success, and ops functions that need shared visibility",
    ],
    free: true,
    t1: true,
    t2: "Advanced + custom panels",
    t3: "Fully customizable",
    learnMoreHref: "/product/crm-dialer",
  },
  {
    title: "Analytics",
    category: "Core CRM",
    summary: "Built-in reporting and analytics that surfaces activity trends, conversion rates, and pipeline movement without needing a separate BI tool.",
    bullets: [
      "Covers funnel performance, rep activity, and revenue attribution in one place",
      "Higher tiers unlock deeper breakdowns, custom reports, and longer data retention windows",
      "Useful for managers who want structured answers, not just raw CRM data exports",
    ],
    free: true,
    t1: true,
    t2: "Advanced + custom reports",
    t3: "Full analytics suite",
    learnMoreHref: "/product/ai-crm",
  },
  {
    title: "Leads",
    category: "Core CRM",
    summary: "Lead capture, qualification, and pipeline entry tools that keep new inquiries organized and moving toward conversion.",
    bullets: [
      "Supports inbound, outbound, and imported lead sources in a single workspace",
      "Includes status tracking, assignment, and activity history tied to each record",
      "Useful for teams handling a high volume of new contacts and wanting consistent intake",
    ],
    free: true,
    t1: true,
    t2: true,
    t3: true,
    learnMoreHref: "/product/ai-lead-scoring",
  },
  {
    title: "Accounts",
    category: "Core CRM",
    summary: "Company-level records that group contacts, deals, and activity history so teams can manage relationships at the account level.",
    bullets: [
      "Supports both B2B workflows where the account matters as much as the individual contact",
      "Useful for field sales, enterprise deals, and any motion involving multiple stakeholders at a company",
      "Keeps the full relationship timeline in one place without splitting context across tools",
    ],
    free: true,
    t1: true,
    t2: true,
    t3: true,
    learnMoreHref: "/product/crm-dialer",
  },
  {
    title: "Deals",
    category: "Core CRM",
    summary: "A pipeline management layer for tracking open opportunities from first contact through close — with stage movement, probability, and expected value.",
    bullets: [
      "Gives reps and managers a shared view of where each deal stands in the sales process",
      "Higher plan tiers add forecast controls, pipeline hygiene support, and more stage customization",
      "Useful across deal-driven sales motions in B2B, services, and high-ticket consumer sales",
    ],
    free: true,
    t1: true,
    t2: true,
    t3: true,
    learnMoreHref: "/product/ai-crm",
  },
  {
    title: "Activities",
    category: "Core CRM",
    summary: "Task, call, meeting, and note logging tools that keep the complete interaction history tied to every CRM record.",
    bullets: [
      "Prevents important context from living in email threads or memory — every action is logged",
      "Useful for multi-rep handoffs, account reviews, and pipeline calls that need full visibility",
      "Higher tiers add activity analytics and hygiene tooling for managers",
    ],
    free: true,
    t1: true,
    t2: true,
    t3: true,
    learnMoreHref: "/product/crm-dialer",
  },
  {
    title: "Prospecting",
    category: "Core CRM",
    summary: "Built-in prospecting tools that help reps find, research, and add new contacts to the CRM without switching to separate enrichment or discovery tools.",
    bullets: [
      "Reduces time spent manually building outreach lists from external sources",
      "Useful for outbound-heavy teams that need a steady flow of qualified new contacts",
      "Pairs well with sequencing, dialer, and scoring for a complete outbound motion",
    ],
    free: false,
    t1: "Basic",
    t2: "Advanced",
    t3: "Advanced + enrichment",
    learnMoreHref: "/product/ai-lead-scoring",
  },
  {
    title: "Exhibition Capture",
    category: "Core CRM",
    summary: "Tools for capturing leads at events, trade shows, and exhibitions — scanning badges or business cards directly into the CRM.",
    bullets: [
      "Eliminates manual post-event data entry and the lead leakage that comes with it",
      "Useful for businesses that rely on conferences, expos, or in-person events for pipeline",
      "Captured leads feed directly into routing, sequences, and scoring workflows",
    ],
    free: false,
    t1: true,
    t2: true,
    t3: true,
    learnMoreHref: "/product/crm-dialer",
  },

  // ── Commerce & Communication ────────────────────────────────────────────────
  {
    title: "Products",
    category: "Commerce & Communication",
    summary: "A product catalog inside the CRM that lets reps attach line items, pricing, and descriptions directly to quotes and deals without switching tools.",
    bullets: [
      "Useful for businesses selling configurable, multi-item, or service-based offerings",
      "Keeps pricing consistent across the team without relying on rep memory or shared spreadsheets",
      "Pairs with Quotes and Invoices to create a complete commerce layer inside the CRM",
    ],
    free: false,
    t1: true,
    t2: true,
    t3: true,
    learnMoreHref: "/product/crm-dialer",
  },
  {
    title: "Quote Requests",
    category: "Commerce & Communication",
    summary: "Inbound quote request capture that feeds buyer inquiries directly into the CRM so no potential deal is missed or manually re-entered.",
    bullets: [
      "Useful for businesses where buyers reach out to ask for custom pricing before a deal starts",
      "Connects inbound intent signals with CRM pipeline without extra tools",
      "Works well with products, quotes, and approval workflows for a clean end-to-end process",
    ],
    free: false,
    t1: true,
    t2: true,
    t3: true,
    learnMoreHref: "/product/crm-dialer",
  },
  {
    title: "Quotes & Proposals",
    category: "Commerce & Communication",
    summary: "A built-in quoting and proposal tool for building, sending, and tracking commercial documents directly from a deal record.",
    bullets: [
      "Removes the need for Word or Google Docs templates disconnected from the CRM",
      "Useful for services, SaaS, and distribution teams that send structured proposals as part of sales",
      "Pairs with e-signature, invoice generation, and approval workflows",
    ],
    free: false,
    t1: true,
    t2: true,
    t3: true,
    learnMoreHref: "/product/crm-dialer",
    aliases: ["Quotes"],
  },
  {
    title: "Invoices",
    category: "Commerce & Communication",
    summary: "Invoice generation tied to closed deals — converting won opportunities into billable documents without leaving the CRM.",
    bullets: [
      "Useful for teams that need to move quickly from deal close to billing",
      "Reduces the handoff gap between sales and finance for revenue recognition",
      "Pairs with payments, expense tracking, and revenue reporting",
    ],
    free: false,
    t1: true,
    t2: true,
    t3: true,
    learnMoreHref: "/product/crm-dialer",
  },
  {
    title: "Expenses",
    category: "Commerce & Communication",
    summary: "Expense tracking tied to accounts and deals — capturing cost data alongside revenue for real margin visibility.",
    bullets: [
      "Useful for agencies, consultancies, or service businesses that track per-project costs",
      "Keeps expense context visible next to revenue data instead of in a separate accounting tool",
      "Pairs with invoices and revenue tracking for a complete financial picture per account",
    ],
    free: false,
    t1: true,
    t2: true,
    t3: true,
    learnMoreHref: "/product/crm-dialer",
  },
  {
    title: "Payments Received",
    category: "Commerce & Communication",
    summary: "Payment reconciliation tied to invoices and deals so teams can see what has been paid and what is still outstanding from inside the CRM.",
    bullets: [
      "Reduces the back-and-forth between sales and finance to confirm payment status",
      "Useful for businesses with manual or offline payment workflows that need CRM-side tracking",
      "Pairs with invoices, revenue tracking, and deal close data for accurate reporting",
    ],
    free: false,
    t1: true,
    t2: true,
    t3: true,
    learnMoreHref: "/product/crm-dialer",
  },
  {
    title: "Revenue",
    category: "Commerce & Communication",
    summary: "CRM-side revenue tracking that aggregates deal values, closed amounts, and recurring revenue signals for pipeline-to-revenue reporting.",
    bullets: [
      "Useful for teams that want a single source of truth for revenue performance without BI exports",
      "Connects deal close data to invoices, payments, and forecasting for end-to-end visibility",
      "Pairs with analytics, forecast, and commission tools for a full revenue operations view",
    ],
    free: false,
    t1: true,
    t2: true,
    t3: true,
    learnMoreHref: "/product/crm-dialer",
    aliases: ["Revenue tracking"],
  },
  {
    title: "HelloMail",
    category: "Commerce & Communication",
    summary: "A shared inbox inside the CRM so teams can manage inbound email from leads and customers without switching to a separate email client.",
    bullets: [
      "Prevents important messages from getting lost in personal inboxes",
      "Useful for support, sales, and ops teams that share inbound communication workflows",
      "Connects incoming messages directly to the relevant CRM record for full context",
    ],
    free: false,
    t1: true,
    t2: true,
    t3: true,
    learnMoreHref: "/product/email-automation",
    aliases: ["HelloMail inbox", "Shared inbox"],
  },
  {
    title: "Web Chat",
    category: "Commerce & Communication",
    summary: "A CRM-native web chat assistant for capturing inbound leads and answering questions directly from the website.",
    bullets: [
      "Keeps chat conversations tied to CRM records instead of isolated in a separate chat platform",
      "Useful for websites with meaningful inbound traffic that needs immediate engagement",
      "Pairs with routing, scoring, and sequences for a fast inbound response workflow",
    ],
    free: false,
    t1: true,
    t2: true,
    t3: true,
    learnMoreHref: "/product/whatsapp-sms-crm",
    aliases: ["Web Chat Assistant"],
  },
  {
    title: "Dialer",
    category: "Commerce & Communication",
    summary: "A built-in phone dialer that lets reps call directly from the CRM, log outcomes, and keep the full call history tied to contact and deal records.",
    bullets: [
      "Eliminates the need for a separate dialing tool and manual call logging",
      "Higher tiers add power dialing, call recording, and AI-assisted call summaries",
      "Most useful for outbound teams, BDRs, and inside sales reps with high call volumes",
    ],
    free: false,
    t1: "Local dialer",
    t2: "+ Power dialer",
    t3: "+ AI summaries",
    learnMoreHref: "/product/crm-dialer",
    aliases: ["Built-in Dialer"],
  },
  {
    title: "WhatsApp & SMS",
    category: "Commerce & Communication",
    summary: "Mobile messaging workflows that help teams engage leads and customers on the channels where they already respond.",
    bullets: [
      "Brings conversational outreach into the CRM record instead of leaving it in separate apps",
      "Useful for reminders, follow-up, promotions, and high-response workflows",
      "Pairs with templates, campaigns, and automation for scalable execution",
    ],
    free: false,
    t1: true,
    t2: true,
    t3: true,
    learnMoreHref: "/product/whatsapp-sms-crm",
    aliases: ["Messaging apps", "SMS Templates", "WhatsApp Templates"],
  },
  {
    title: "Campaigns",
    category: "Commerce & Communication",
    summary: "Broadcast and multi-channel campaign tools that let teams run coordinated outreach to lists, segments, or full contact bases.",
    bullets: [
      "Useful for lead nurture, reactivation, and time-sensitive promotional pushes",
      "Keeps campaign execution inside the CRM so results tie back to pipeline",
      "Pairs naturally with segmentation, sequences, and follow-up automation",
    ],
    free: false,
    t1: false,
    t2: true,
    t3: true,
    learnMoreHref: "/product/email-automation",
  },
  {
    title: "Sequences",
    category: "Commerce & Communication",
    summary: "Automated multi-step outreach workflows that send timed messages across email, SMS, and other channels until a prospect responds.",
    bullets: [
      "Keeps follow-up consistent without requiring reps to manually track every touchpoint",
      "Higher tiers add A/B testing, branching logic, and advanced scheduling controls",
      "Best for outbound prospecting, trial nurture, and structured onboarding flows",
    ],
    free: false,
    t1: "Basic",
    t2: "Advanced + A/B testing",
    t3: true,
    learnMoreHref: "/product/email-automation",
    aliases: ["Email Sequences"],
  },
  {
    title: "Scheduling & Booking",
    category: "Commerce & Communication",
    summary: "Meeting scheduling and booking pages that shorten the path from interest to conversation.",
    bullets: [
      "Removes manual back-and-forth for demos, qualification calls, and follow-up meetings",
      "Supports branded booking experiences and cleaner pipeline handoff after booking",
      "Useful for both inbound conversion and outbound follow-up workflows",
    ],
    free: true,
    t1: true,
    t2: true,
    t3: true,
    learnMoreHref: "/product/meeting-scheduler",
    aliases: ["Scheduler", "Scheduling & video"],
  },

  // ── Project, AI & Customer ──────────────────────────────────────────────────
  {
    title: "Task Boards",
    category: "Project, AI & Customer",
    summary: "Board-based work management for follow-up, internal tasks, handoffs, and execution workflows that need visibility.",
    bullets: [
      "Useful when teams need more structure than a simple task list",
      "Paid tiers add broader views, hygiene support, and more operational depth",
      "Works especially well for sales ops, onboarding, and recurring follow-up workflows",
    ],
    free: "500 tasks",
    t1: "Unlimited + views",
    t2: "Unlimited + managed hygiene",
    t3: "Unlimited + dependencies",
    learnMoreHref: "/product/sales-task-boards",
  },

  // ── Intelligence Module ─────────────────────────────────────────────────────
  {
    title: "AI Insights",
    category: "Intelligence Module",
    summary: "AI-generated analysis surfaced inside the CRM to help teams understand pipeline health, rep performance, and revenue signals without manual reporting.",
    bullets: [
      "Surfaces patterns and anomalies that would otherwise require manual data pulls",
      "Useful for managers who want automated context before one-on-ones or pipeline reviews",
      "Creates the most value when connected to clean activity and deal stage data",
    ],
    free: false,
    t1: false,
    t2: true,
    t3: true,
    learnMoreHref: "/product/ai-crm",
  },
  {
    title: "AI Agents",
    category: "Intelligence Module",
    summary: "Autonomous AI agents that take actions inside the CRM — drafting follow-ups, updating records, and executing workflow steps without rep intervention.",
    bullets: [
      "Reduces manual busywork so reps can focus on conversations instead of CRM upkeep",
      "Growth tier provides Beta access; RevOps Partner tier unlocks custom agent configuration",
      "Most effective when pipeline data is clean and processes are well-defined",
    ],
    free: false,
    t1: false,
    t2: "Beta",
    t3: "+ custom agents",
    learnMoreHref: "/product/ai-crm",
    aliases: ["AI Agent (Beta)"],
  },
  {
    title: "Pipeline Forecast",
    category: "Intelligence Module",
    summary: "AI-assisted revenue forecasting that projects expected close amounts based on current pipeline stage, velocity, and historical conversion patterns.",
    bullets: [
      "Gives leadership a more reliable forward-looking view than manual rep estimates",
      "Useful for finance alignment, headcount planning, and quarterly target reviews",
      "Improves over time as the CRM accumulates deal history and outcome data",
    ],
    free: false,
    t1: false,
    t2: true,
    t3: true,
    learnMoreHref: "/product/ai-crm",
  },
  {
    title: "Market Radar",
    category: "Intelligence Module",
    summary: "Market intelligence tooling that monitors competitive signals, keyword trends, and demand shifts so teams can adjust positioning and targeting.",
    bullets: [
      "Connects market signals with CRM execution rather than treating research as a separate exercise",
      "Useful for content planning, competitive response, and territory prioritization",
      "Supports both founders and RevOps teams making prioritization decisions",
    ],
    free: false,
    t1: false,
    t2: true,
    t3: true,
    learnMoreHref: "/audit",
  },
  {
    title: "Growth Audit",
    category: "Intelligence Module",
    summary: "A structured funnel audit that identifies where leads drop off, where conversions stall, and which channels are delivering real pipeline value.",
    bullets: [
      "Helps teams move from gut-feel prioritization to evidence-based growth decisions",
      "Free tier includes one audit; paid tiers unlock recurring monthly audits",
      "Useful after a strategy change, a slow quarter, or before scaling spend",
    ],
    free: "1 audit",
    t1: "3/month",
    t2: "Unlimited",
    t3: "Unlimited",
    learnMoreHref: "/audit",
  },
  {
    title: "Visitor Tracking",
    category: "Intelligence Module",
    summary: "Website visitor intelligence that identifies which companies are browsing and maps anonymous traffic to CRM records for timely follow-up.",
    bullets: [
      "Turns passive inbound traffic into actionable pipeline signals",
      "Useful for BDR teams prioritizing outreach based on intent rather than cold lists",
      "Works best when paired with routing, scoring, and follow-up automation",
    ],
    free: false,
    t1: false,
    t2: true,
    t3: true,
    learnMoreHref: "/audit",
  },
  {
    title: "Gamification",
    category: "Intelligence Module",
    summary: "Sales performance gamification that turns CRM activity and results into competitive scoreboards reps can see in real time.",
    bullets: [
      "Helps managers reinforce the right behaviors without micromanaging",
      "Useful for SDR teams, founder-led sales, and any org building an execution culture",
      "Pairs with activity tracking, goals, and leaderboard for a complete performance layer",
    ],
    free: false,
    t1: false,
    t2: true,
    t3: true,
    learnMoreHref: "https://app.hellogrowthcrm.com/gamification",
  },
  {
    title: "Goals",
    category: "Intelligence Module",
    summary: "Rep and team goal-setting tools that make targets visible inside the CRM alongside the activity and pipeline data used to hit them.",
    bullets: [
      "Creates alignment between individual rep targets and team-level revenue expectations",
      "Useful for weekly check-ins, quota reviews, and performance conversations",
      "Works best when paired with dashboards, leaderboard, and activity tracking",
    ],
    free: false,
    t1: false,
    t2: true,
    t3: true,
    learnMoreHref: "https://app.hellogrowthcrm.com/gamification",
  },
  {
    title: "Leaderboard",
    category: "Intelligence Module",
    summary: "A real-time team performance leaderboard that shows activity counts, deal progress, and revenue contribution across the sales team.",
    bullets: [
      "Makes performance visible without requiring managers to pull manual reports",
      "Useful for morning standups, team meetings, and ongoing motivation",
      "Pairs with goals and gamification to create a complete performance feedback loop",
    ],
    free: false,
    t1: false,
    t2: true,
    t3: true,
    learnMoreHref: "https://app.hellogrowthcrm.com/gamification",
  },

  // ── Customer Module ──────────────────────────────────────────────────────────
  {
    title: "Customer Portal",
    category: "Customer Module",
    summary: "A branded self-service portal where customers can view their orders, invoices, project status, and communications without contacting support.",
    bullets: [
      "Reduces inbound support volume by giving customers direct access to their account data",
      "RevOps Partner tier adds white-label options for a fully branded experience",
      "Useful for teams that want one platform to handle both acquisition and retention",
    ],
    free: false,
    t1: false,
    t2: true,
    t3: "+ white-label",
    learnMoreHref: "/product/customer-health-score",
  },
  {
    title: "Referrals",
    category: "Customer Module",
    summary: "A referral program workflow that tracks advocate activity, referral submissions, and pipeline generated from customer introductions.",
    bullets: [
      "Turns happy customers into a structured source of qualified pipeline",
      "Keeps referral tracking inside the CRM instead of relying on manual spreadsheets",
      "Useful for relationship-driven businesses where trust transfers between buyers",
    ],
    free: false,
    t1: false,
    t2: true,
    t3: true,
    learnMoreHref: "/product/customer-health-score",
  },
  {
    title: "References",
    category: "Customer Module",
    summary: "A managed reference library of satisfied customers that sales can use in late-stage deals to accelerate trust and reduce close friction.",
    bullets: [
      "Helps reps match the right reference to a prospect's industry, size, or use case",
      "Keeps reference requests organized so customers are not over-contacted",
      "Useful for enterprise deals where social proof and peer validation matter",
    ],
    free: false,
    t1: false,
    t2: true,
    t3: true,
    learnMoreHref: "/product/customer-health-score",
  },
  {
    title: "Business Listings",
    category: "Customer Module",
    summary: "Tools for managing and syncing your business presence across directories, review platforms, and local listing sources.",
    bullets: [
      "Keeps NAP data (name, address, phone) consistent across discovery channels",
      "Useful for local businesses and multi-location teams managing inbound from search",
      "Available from Software Only tier as a foundational visibility feature",
    ],
    free: false,
    t1: true,
    t2: true,
    t3: true,
    learnMoreHref: "/product/customer-health-score",
  },
  {
    title: "Landing Pages",
    category: "Customer Module",
    summary: "CRM-connected landing page builder for campaign capture, event signups, and inbound conversion without needing a separate tool.",
    bullets: [
      "Keeps form submissions and lead data flowing directly into CRM records",
      "Useful for product launches, webinars, and campaign-specific conversion pages",
      "RevOps Partner tier removes limits for teams running multiple concurrent campaigns",
    ],
    free: false,
    t1: false,
    t2: true,
    t3: "Unlimited",
    learnMoreHref: "/product/customer-health-score",
  },

  // ── Support Module ───────────────────────────────────────────────────────────
  {
    title: "Tickets",
    category: "Support Module",
    summary: "A support ticket system inside the CRM that keeps issue resolution tied to the customer record and sales history.",
    bullets: [
      "Prevents support context from living in a separate tool disconnected from the deal timeline",
      "Useful for teams combining sales, onboarding, and customer success in a shared system",
      "Pairs with knowledge base and SLA policies for a complete support layer",
    ],
    free: false,
    t1: false,
    t2: true,
    t3: true,
    learnMoreHref: "/product/customer-health-score",
  },
  {
    title: "Knowledge Base",
    category: "Support Module",
    summary: "A searchable internal and customer-facing knowledge base for capturing answers, SOPs, and product documentation.",
    bullets: [
      "Reduces repetitive support volume by making answers self-serve for customers",
      "Useful for onboarding reps and standardizing responses across the support team",
      "Pairs with tickets and chat to create a deflection-first support workflow",
    ],
    free: false,
    t1: false,
    t2: true,
    t3: true,
    learnMoreHref: "/product/customer-health-score",
  },
  {
    title: "SLA Policies",
    category: "Support Module",
    summary: "Service level agreement configuration that sets response and resolution time targets for support tickets across customer tiers.",
    bullets: [
      "Creates accountability in support workflows with escalation rules and breach alerts",
      "Useful for teams with contractual support commitments or tiered customer plans",
      "RevOps Partner tier unlocks full SLA policy management for enterprise-ready support",
    ],
    free: false,
    t1: false,
    t2: false,
    t3: true,
    learnMoreHref: "/product/customer-health-score",
  },

  // ── Admin, Integrations & Service ───────────────────────────────────────────
  {
    title: "API & Integrations",
    category: "Admin, Integrations & Service",
    summary: "Connectivity tooling for syncing data, triggering workflows, and fitting the CRM into the rest of the operating stack.",
    bullets: [
      "Useful when revenue teams depend on multiple systems and need a single operating layer",
      "Supports cleaner automation, reporting, and data movement across departments",
      "Higher tiers add broader integration coverage and more custom support",
    ],
    free: false,
    t1: "90 integrations",
    t2: "90 integrations",
    t3: "90 + custom support",
    learnMoreHref: "/integrations",
    aliases: ["API access", "Total integrations", "Automation", "Lead source integrations", "Lead Sources", "Commerce & payments"],
  },
  {
    title: "Lead Routing",
    category: "Admin, Integrations & Service",
    summary: "Automated lead assignment rules that distribute new inquiries to the right rep based on territory, source, score, or round-robin logic.",
    bullets: [
      "Reduces response time by removing manual assignment from the lead intake process",
      "Growth tier adds round-robin routing; RevOps Partner adds fully custom rule sets",
      "Pairs well with scoring, territories, and speed-to-lead SLA tracking",
    ],
    free: false,
    t1: false,
    t2: "Round-robin",
    t3: "+ custom rules",
    learnMoreHref: "/product/ai-crm",
    aliases: ["Lead Routing Rules", "Lead Stages"],
  },
  {
    title: "Validation Rules",
    category: "Admin, Integrations & Service",
    summary: "Field-level data validation rules that enforce required inputs and data quality standards before records can be saved or moved.",
    bullets: [
      "Prevents dirty data from entering the pipeline and corrupting reporting",
      "Useful for teams with compliance requirements or strict stage-gating rules",
      "Pairs with custom fields and workflows for a complete data governance layer",
    ],
    free: false,
    t1: false,
    t2: true,
    t3: true,
    learnMoreHref: "/product/ai-crm",
  },
  {
    title: "Workflows",
    category: "Admin, Integrations & Service",
    summary: "Automated workflow builder for triggering actions — task creation, field updates, notifications, stage moves — based on CRM events.",
    bullets: [
      "Reduces manual work by automating repetitive steps in the sales and ops process",
      "Growth tier enables basic workflows; RevOps Partner unlocks multi-step and approval flows",
      "Most effective when layered with routing, scoring, and sequence automation",
    ],
    free: false,
    t1: false,
    t2: "Basic",
    t3: "Multi-step + approval",
    learnMoreHref: "/product/ai-crm",
  },
  {
    title: "Territories",
    category: "Admin, Integrations & Service",
    summary: "Territory definition and ownership tools that assign accounts, leads, and deals to reps based on geography, industry, or custom rules.",
    bullets: [
      "Helps teams distribute work fairly and reduce ownership conflicts across regions",
      "Useful for distributed teams, field sales, and organizations with assigned segments",
      "RevOps Partner tier adds map-based territory visualization for field ops teams",
    ],
    free: false,
    t1: false,
    t2: true,
    t3: "+ map view",
    learnMoreHref: "/product/territory-management",
  },
  {
    title: "Commissions",
    category: "Admin, Integrations & Service",
    summary: "Commission tracking inside the CRM that links deal outcomes to rep incentive calculations without exporting to spreadsheets.",
    bullets: [
      "Keeps commission visibility tied to pipeline and deal data instead of manual tallies",
      "Reduces disputes between reps and management around what counts and when",
      "Useful for commission-driven teams that want transparency without a separate tool",
    ],
    free: false,
    t1: false,
    t2: true,
    t3: true,
    learnMoreHref: "/product/territory-management",
  },
  {
    title: "Field Operations",
    category: "Admin, Integrations & Service",
    summary: "Tools for managing field sales teams — check-ins, visit logs, route planning, and on-site activity capture from mobile.",
    bullets: [
      "Keeps field rep activity logged in the CRM even when visits happen away from a desk",
      "Useful for teams with outside sales, on-site demos, or territory-based coverage models",
      "Pairs with territories, dialer, and activity tracking for full field visibility",
    ],
    free: false,
    t1: false,
    t2: true,
    t3: true,
    learnMoreHref: "/product/territory-management",
  },
  {
    title: "Named Revenue Specialist",
    category: "Admin, Integrations & Service",
    summary: "A dedicated operator who manages follow-up, pipeline discipline, and day-to-day revenue workflow reliability inside your CRM.",
    bullets: [
      "Useful for founders or lean teams that do not want to hire a full in-house RevOps function yet",
      "Creates accountability around lead handling, cleanup, and weekly operating rhythm",
      "Included in managed service tiers where execution support matters as much as software access",
    ],
    free: false,
    t1: false,
    t2: true,
    t3: true,
    learnMoreHref: "/services/managed-revops",
  },
  {
    title: "Managed RevOps",
    category: "Admin, Integrations & Service",
    summary: "Done-for-you revenue operations support that turns HelloGrowthCRM from software into an execution system run with specialist help.",
    bullets: [
      "Best for teams that need follow-up reliability and pipeline discipline without building an ops team first",
      "Includes process execution, reporting, cleanup, and operating support inside the CRM",
      "Designed to improve speed, consistency, and visibility without adding more tools",
    ],
    free: false,
    t1: false,
    t2: true,
    t3: true,
    learnMoreHref: "/services/managed-revops",
  },
  {
    title: "Weekly Follow-up Execution",
    category: "Admin, Integrations & Service",
    summary: "A managed operating cadence where follow-up tasks, outreach queues, and next steps are actively worked every week.",
    bullets: [
      "Useful for teams where good intentions are not turning into consistent outbound or nurture execution",
      "Helps prevent silent lead leakage across inbound, outbound, and stalled opportunities",
      "Often one of the fastest ways to improve pipeline responsiveness without new headcount",
    ],
    free: false,
    t1: false,
    t2: true,
    t3: true,
    learnMoreHref: "/services/managed-revops",
  },
  {
    title: "Same-Business-Day Lead SLA",
    category: "Admin, Integrations & Service",
    summary: "A service commitment around inbound lead handling so new opportunities are worked quickly instead of aging in queues.",
    bullets: [
      "Useful when speed-to-lead directly affects conversion and buyer experience",
      "Pairs with routing, activity review, and managed execution support",
      "Helps leadership create a more predictable response standard across the funnel",
    ],
    free: false,
    t1: false,
    t2: true,
    t3: true,
    learnMoreHref: "/services/managed-revops",
  },
  {
    title: "Pipeline Cleanup & Hygiene",
    category: "Admin, Integrations & Service",
    summary: "Ongoing cleanup of stale records, mis-staged deals, missing fields, and messy ownership so reporting stays trustworthy.",
    bullets: [
      "Useful for teams whose pipeline has become hard to inspect or forecast confidently",
      "Improves the signal quality of dashboards, stage reviews, and leadership reporting",
      "Often overlooked until poor data starts hurting decision-making",
    ],
    free: false,
    t1: false,
    t2: true,
    t3: true,
    learnMoreHref: "/services/managed-revops",
  },
  {
    title: "Weekly KPI Report",
    category: "Admin, Integrations & Service",
    summary: "A recurring performance review that turns CRM data into a readable weekly operating update for managers and founders.",
    bullets: [
      "Helps teams move from scattered metrics to an actual decision-making cadence",
      "Useful when leadership wants clear narrative context, not just raw dashboards",
      "Pairs well with managed follow-up, forecast reviews, and specialist execution",
    ],
    free: false,
    t1: false,
    t2: true,
    t3: true,
    learnMoreHref: "/services/managed-revops",
  },
  {
    title: "Automation Specialist",
    category: "Admin, Integrations & Service",
    summary: "A dedicated automation resource for refining routing, sequences, field logic, and system workflows as the team scales.",
    bullets: [
      "Useful when the CRM needs deeper optimization than day-to-day execution support alone",
      "Helps turn rough processes into cleaner, more repeatable operating systems",
      "Especially valuable for growing teams with multiple funnels, motions, or handoff points",
    ],
    free: false,
    t1: false,
    t2: false,
    t3: true,
    learnMoreHref: "/services/managed-revops",
  },
  {
    title: "Quarterly Funnel Review",
    category: "Admin, Integrations & Service",
    summary: "A strategic review of conversion, leakage, stage design, and operating performance at the funnel level.",
    bullets: [
      "Useful for scaling teams that want continuous process improvement rather than reactive cleanup only",
      "Helps leadership revisit stage definitions, targets, and friction points using actual CRM data",
      "Pairs well with KPI reporting, scoring refinement, and automation planning",
    ],
    free: false,
    t1: false,
    t2: false,
    t3: true,
    learnMoreHref: "/services/managed-revops",
  },
  {
    title: "Lead Scoring Tuning",
    category: "Admin, Integrations & Service",
    summary: "Periodic refinement of scoring logic so the model better reflects the signals that actually correlate with qualified pipeline.",
    bullets: [
      "Useful when initial scoring works but needs adjustment as data quality and sales patterns evolve",
      "Improves trust in prioritization by aligning scoring with real outcomes",
      "Best handled as an ongoing optimization process, not a one-time setup task",
    ],
    free: false,
    t1: false,
    t2: false,
    t3: true,
    learnMoreHref: "/product/ai-lead-scoring",
  },
  {
    title: "Monthly Strategy Call",
    category: "Admin, Integrations & Service",
    summary: "A recurring planning and review session focused on pipeline health, priorities, and revenue-operations decisions for the next cycle.",
    bullets: [
      "Useful for aligning leadership expectations with what the CRM and ops team are actually driving",
      "Turns reporting into action by discussing next-step decisions, not just past numbers",
      "Most valuable when paired with a managed operating cadence and named specialist support",
    ],
    free: false,
    t1: false,
    t2: false,
    t3: true,
    learnMoreHref: "/services/managed-revops",
  },
  {
    title: "Support",
    category: "Admin, Integrations & Service",
    summary: "Plan-based support coverage that ranges from community help to dedicated managed service support and strategic guidance.",
    bullets: [
      "Defines how quickly teams can get answers, issue help, and operating guidance",
      "Higher tiers are designed for teams that need faster resolution and more proactive support",
      "Support quality matters more as the CRM becomes central to revenue execution",
    ],
    free: "Community",
    t1: "Email + Chat",
    t2: "Priority",
    t3: "Dedicated",
    learnMoreHref: "/legal/sla",
    aliases: ["Community support", "Priority support", "Dedicated support"],
  },
];

const FEATURES: Feature[] = RAW_FEATURES.map((f) => ({ ...f, slug: slugify(f.title) }));

const PRODUCT_PAGES = [
  { slug: "ai-lead-scoring", title: "AI Lead Scoring", url: "https://hellogrowthcrm.com/product/ai-lead-scoring", status: "active", description: "Automatically score and prioritize leads using AI signals so reps focus on the opportunities most likely to close." },
  { slug: "crm-dialer", title: "CRM Dialer", url: "https://hellogrowthcrm.com/product/crm-dialer", status: "active", description: "Built-in phone dialer with call logging, recording, and AI summaries directly inside the CRM." },
  { slug: "whatsapp-sms-crm", title: "WhatsApp & SMS CRM", url: "https://hellogrowthcrm.com/product/whatsapp-sms-crm", status: "active", description: "Native WhatsApp and SMS workflows that keep mobile conversations tied to CRM records." },
  { slug: "ai-voice-agents", title: "AI Voice Agents", url: "https://hellogrowthcrm.com/product/ai-voice-agents", status: "active", description: "AI-powered voice agents that handle inbound calls, qualify leads, and route conversations automatically." },
  { slug: "email-automation", title: "Email Automation", url: "https://hellogrowthcrm.com/product/email-automation", status: "active", description: "Multi-step email sequences, campaigns, and inbox management tools built into the CRM." },
  { slug: "sales-forecasting", title: "Sales Forecasting", url: "https://hellogrowthcrm.com/product/sales-forecasting", status: "active", description: "AI-assisted revenue forecasting based on pipeline stage, velocity, and historical conversion data." },
  { slug: "sales-task-boards", title: "Sales Task Boards", url: "https://hellogrowthcrm.com/product/sales-task-boards", status: "active", description: "Kanban-style task boards for managing follow-up, handoffs, and ops workflows with full pipeline context." },
  { slug: "territory-management", title: "Territory Management", url: "https://hellogrowthcrm.com/product/territory-management", status: "active", description: "Define, assign, and visualize sales territories to reduce rep conflicts and improve coverage." },
  { slug: "meeting-scheduler", title: "Meeting Scheduler", url: "https://hellogrowthcrm.com/product/meeting-scheduler", status: "active", description: "Branded booking pages and calendar sync for scheduling demos and calls directly from CRM outreach." },
  { slug: "ai-crm", title: "AI CRM", url: "https://hellogrowthcrm.com/product/ai-crm", status: "active", description: "The full AI layer across the CRM — insights, agents, forecasting, scoring, and automation in one system." },
  { slug: "customer-health-score", title: "Customer Health Score", url: "https://hellogrowthcrm.com/product/customer-health-score", status: "active", description: "Signals-based health scoring for existing customers to identify churn risk and expansion opportunities." },
  { slug: "ai-sales-coach", title: "AI Sales Coach", url: "https://hellogrowthcrm.com/product/ai-sales-coach", status: "coming-soon", description: "AI coaching that reviews call recordings, flags missed objections, and suggests follow-up actions." },
  { slug: "ai-sdr", title: "AI SDR", url: "https://hellogrowthcrm.com/product/ai-sdr", status: "coming-soon", description: "An AI sales development rep that researches prospects, writes personalized outreach, and books meetings." },
  { slug: "revenue-intelligence", title: "Revenue Intelligence", url: "https://hellogrowthcrm.com/product/revenue-intelligence", status: "coming-soon", description: "Cross-channel revenue signal aggregation for real-time GTM intelligence and decision support." },
  { slug: "deal-room", title: "Deal Room", url: "https://hellogrowthcrm.com/product/deal-room", status: "coming-soon", description: "A collaborative buyer-seller workspace to share proposals, track engagement, and manage multi-stakeholder deals." },
  { slug: "linkedin-crm", title: "LinkedIn CRM", url: "https://hellogrowthcrm.com/product/linkedin-crm", status: "coming-soon", description: "Native LinkedIn prospecting and messaging integration that logs activity directly to CRM records." },
  { slug: "revenue-automation", title: "Revenue Automation", url: "https://hellogrowthcrm.com/product/revenue-automation", status: "coming-soon", description: "End-to-end revenue workflow automation covering routing, follow-up, handoffs, and pipeline management." },
];

const CATEGORIES = [...new Set(FEATURES.map((f) => f.category))];

// ── features_list ─────────────────────────────────────────────────────────────

export const featuresList = defineTool({
  schema: z.object({
    category: z.enum(["Core CRM", "Commerce & Communication", "Project, AI & Customer", "Intelligence Module", "Customer Module", "Support Module", "Admin, Integrations & Service", "all"]).default("all"),
    plan: z.enum(["free", "t1", "t2", "t3", "all"]).default("all").describe("Filter to features available on a specific plan tier. free=Free, t1=Software Only/Starter, t2=Growth Engine, t3=RevOps Partner"),
    search: z.string().optional().describe("Keyword to filter features by title, summary, or aliases"),
  }),
  definition: {
    name: "features_list",
    description: "List all HelloGrowthCRM product features. Supports filtering by category, plan tier, and keyword search.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["Core CRM", "Commerce & Communication", "Project, AI & Customer", "Intelligence Module", "Customer Module", "Support Module", "Admin, Integrations & Service", "all"],
          default: "all",
          description: "Feature category to filter by",
        },
        plan: {
          type: "string",
          enum: ["free", "t1", "t2", "t3", "all"],
          default: "all",
          description: "Plan tier filter: free, t1 (Software Only/Starter), t2 (Growth Engine), t3 (RevOps Partner)",
        },
        search: { type: "string", description: "Keyword search across title, summary, and aliases" },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    try {
      let results = FEATURES;

      if (args.category !== "all") {
        results = results.filter((f) => f.category === args.category);
      }

      if (args.plan !== "all") {
        const tier = args.plan as "free" | "t1" | "t2" | "t3";
        results = results.filter((f) => {
          const val = f[tier];
          return val !== false && val !== undefined;
        });
      }

      if (args.search) {
        const kw = args.search.toLowerCase();
        results = results.filter(
          (f) =>
            f.title.toLowerCase().includes(kw) ||
            f.summary.toLowerCase().includes(kw) ||
            (f.aliases ?? []).some((a) => a.toLowerCase().includes(kw)),
        );
      }

      return ok({
        total: results.length,
        categories: CATEGORIES,
        features: results.map((f) => ({
          slug: f.slug,
          title: f.title,
          category: f.category,
          summary: f.summary,
          availability: { free: f.free, t1: f.t1, t2: f.t2, t3: f.t3 },
          learnMoreHref: f.learnMoreHref
            ? f.learnMoreHref.startsWith("http")
              ? f.learnMoreHref
              : `https://hellogrowthcrm.com${f.learnMoreHref}`
            : undefined,
        })),
      });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});

// ── features_get ──────────────────────────────────────────────────────────────

export const featuresGet = defineTool({
  schema: z.object({
    slug: z.string().describe("Feature slug, e.g. 'ai-agents', 'pipeline-forecast', 'dialer'"),
  }),
  definition: {
    name: "features_get",
    description: "Get full details for a specific HelloGrowthCRM feature by slug — summary, plan availability, key benefits, and learn-more URL.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Feature slug (use features_list to enumerate slugs)" },
      },
      required: ["slug"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    try {
      const feature = FEATURES.find((f) => f.slug === args.slug);
      if (!feature) {
        const suggestions = FEATURES.filter((f) =>
          f.slug.includes(args.slug.split("-")[0] ?? "") ||
          f.title.toLowerCase().includes(args.slug.replace(/-/g, " ")),
        ).slice(0, 5).map((f) => ({ slug: f.slug, title: f.title }));

        return fail(
          `Feature '${args.slug}' not found.${suggestions.length ? ` Did you mean one of: ${suggestions.map((s) => s.slug).join(", ")}?` : ""}`,
        );
      }

      return ok({
        slug: feature.slug,
        title: feature.title,
        category: feature.category,
        summary: feature.summary,
        bullets: feature.bullets,
        availability: {
          free: feature.free,
          t1_software_only: feature.t1,
          t2_growth_engine: feature.t2,
          t3_revops_partner: feature.t3,
        },
        aliases: feature.aliases ?? [],
        learnMoreUrl: feature.learnMoreHref
          ? feature.learnMoreHref.startsWith("http")
            ? feature.learnMoreHref
            : `https://hellogrowthcrm.com${feature.learnMoreHref}`
          : undefined,
      });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});

// ── features_list_products ────────────────────────────────────────────────────

export const featuresListProducts = defineTool({
  schema: z.object({
    status: z.enum(["active", "coming-soon", "all"]).default("all"),
  }),
  definition: {
    name: "features_list_products",
    description: "List all HelloGrowthCRM product pages with their status (active or coming soon), descriptions, and URLs.",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["active", "coming-soon", "all"],
          default: "all",
          description: "Filter by product status",
        },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    try {
      const results =
        args.status === "all"
          ? PRODUCT_PAGES
          : PRODUCT_PAGES.filter((p) => p.status === args.status);

      return ok({
        total: results.length,
        products: results,
      });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});
