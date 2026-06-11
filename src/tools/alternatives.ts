import { z } from "zod";
import { defineTool, fail, ok } from "./tool-types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Static mirror data — READ-MIRROR of the live website. Never invent entries.
// Source: hellocrmwebsite/src/lib/alternatives-shortlist.ts — SYNCED_AT 2026-06-11
// Source: hellocrmwebsite/src/lib/switch-data.ts — SYNCED_AT 2026-06-11
// Source: hellocrmwebsite/src/lib/wa-alternatives-data.ts — SYNCED_AT 2026-06-11
// Source: hellocrmwebsite/src/app/(public)/ directory listing — SYNCED_AT 2026-06-11
// ─────────────────────────────────────────────────────────────────────────────

const SYNCED_AT = "2026-06-11";
const SITE = "https://hellogrowthcrm.com";

// ── Standalone *-alternative page routes under src/app/(public)/ ─────────────
// Source: hellocrmwebsite/src/app/(public)/ directory listing — SYNCED_AT 2026-06-11
const ALTERNATIVE_PAGES: Array<{ route: string; competitor: string; note?: string }> = [
  { route: "/agile-crm-alternative", competitor: "Agile CRM" },
  { route: "/aisensy-alternative", competitor: "AiSensy" },
  { route: "/alternatives", competitor: "(hub)", note: "Alternatives hub page listing all competitor alternative pages." },
  { route: "/asana-alternative-india", competitor: "Asana", note: "India variant." },
  { route: "/bitrix24-alternative", competitor: "Bitrix24" },
  { route: "/bitrix24-alternative-india", competitor: "Bitrix24", note: "India variant." },
  { route: "/clickup-alternative-india", competitor: "ClickUp", note: "India variant." },
  { route: "/copper-crm-alternative", competitor: "Copper CRM" },
  { route: "/doubletick-alternative", competitor: "DoubleTick" },
  { route: "/dynamics-365-alternative", competitor: "Microsoft Dynamics 365" },
  { route: "/gallabox-alternative", competitor: "Gallabox" },
  { route: "/gallabox-alternative-india", competitor: "Gallabox", note: "India variant." },
  { route: "/gohighlevel-alternative", competitor: "GoHighLevel" },
  { route: "/hubspot-alternative", competitor: "HubSpot" },
  { route: "/hubspot-free-plan-alternative", competitor: "HubSpot Free Plan" },
  { route: "/interakt-alternative", competitor: "Interakt" },
  { route: "/kylas-alternative", competitor: "Kylas CRM" },
  { route: "/leadsquared-alternative", competitor: "LeadSquared" },
  { route: "/vtiger-alternative", competitor: "vTiger" },
  { route: "/wati-alternative", competitor: "WATI" },
  { route: "/wati-alternative-india", competitor: "WATI", note: "India variant." },
  { route: "/whatsapp-alternatives", competitor: "(hub)", note: "WhatsApp-CRM alternatives hub page." },
  { route: "/zoho-crm-alternative", competitor: "Zoho CRM" },
];

// ── Curated "best alternatives" shortlists (SEO pages) ───────────────────────
// Source: hellocrmwebsite/src/lib/alternatives-shortlist.ts (ALTERNATIVES_SHORTLIST) — SYNCED_AT 2026-06-11
type AlternativePick = { name: string; blurb: string; isUs?: boolean };

const ALTERNATIVES_SHORTLIST: Record<string, { competitor: string; route: string | null; picks: AlternativePick[] }> = {
  hubspot: {
    competitor: "HubSpot",
    route: "/hubspot-alternative",
    picks: [
      { name: "HelloGrowthCRM", blurb: "Sales-first AI CRM with lead scoring, dialer, WhatsApp, and sequences bundled at one transparent price—ideal when HubSpot's hubs and add-ons inflate total cost.", isUs: true },
      { name: "Pipedrive", blurb: "Pipeline-centric CRM with a fast, visual board—strong when you want a lightweight sales tool and are comfortable wiring calling and SMS through integrations." },
      { name: "Salesforce", blurb: "Enterprise-grade depth, AppExchange, and customization—best when you have admins, budget, and multi-year implementation capacity." },
      { name: "Zoho CRM", blurb: "Competitive pricing inside the Zoho suite—fits teams already on Zoho Books/Desk and willing to climb tiers for AI and dialer parity." },
      { name: "Freshsales", blurb: "Freshworks-native sales CRM—makes sense when you already run Freshdesk/Freshmarketer and want adjacent tooling in one vendor story." },
    ],
  },
  salesforce: {
    competitor: "Salesforce",
    route: null,
    picks: [
      { name: "HelloGrowthCRM", blurb: "Fast deployment with AI, dialer, and messaging included—built for teams that want Salesforce-class selling outcomes without Einstein bills and multi-month implementations.", isUs: true },
      { name: "HubSpot", blurb: "Strong marketing + sales alignment—best when you need campaigns, content, and CRM together and can absorb Sales Hub add-on costs." },
      { name: "Pipedrive", blurb: "Simple pipeline UX for SMBs—great when Salesforce feels heavy and you mainly need deals, activities, and a clean board." },
      { name: "Zoho CRM", blurb: "Regional pricing and Zoho ecosystem depth—fits companies standardized on Zoho apps and multi-product governance." },
      { name: "monday sales CRM", blurb: "Work-OS flexibility—works when your company already runs projects and ops on monday.com and wants CRM inside the same environment." },
    ],
  },
  pipedrive: {
    competitor: "Pipedrive",
    route: null,
    picks: [
      { name: "HelloGrowthCRM", blurb: "Keeps pipeline clarity while adding native AI scoring, dialer, WhatsApp, and optional managed RevOps—fewer bolt-ons than stacking tools around Pipedrive.", isUs: true },
      { name: "HubSpot", blurb: "Full-funnel marketing + CRM—choose it when you need landing pages, ads, and nurture programs tightly coupled to sales." },
      { name: "Salesforce", blurb: "Maximum customization and scale—when Pipedrive outgrows your process but you can fund admins and enterprise architecture." },
      { name: "Zoho CRM", blurb: "Value pricing with a broad suite—ideal when Zoho Books/Desk are already part of finance and support workflows." },
      { name: "Close CRM", blurb: "Dialer-first workflows for high-volume calling—when outbound speed matters more than broad forecasting and AI governance." },
    ],
  },
  zoho: {
    competitor: "Zoho CRM",
    route: "/zoho-crm-alternative",
    picks: [
      { name: "HelloGrowthCRM", blurb: "Focused sales CRM with AI, dialer, and messaging included without climbing Zoho tiers—strong when you do not need the full Zoho suite.", isUs: true },
      { name: "HubSpot", blurb: "Marketing-led CRM with broad content tooling—when campaigns and attribution matter as much as pipeline hygiene." },
      { name: "Pipedrive", blurb: "Straightforward pipeline CRM—when you want lighter admin than Zoho but still need a proven SMB sales workflow." },
      { name: "Salesforce", blurb: "Enterprise controls and ecosystem—when Zoho's limits push you toward deeper customization and compliance tooling." },
      { name: "Freshsales", blurb: "Freshworks stack cohesion—when support and marketing already sit on Freshworks products." },
    ],
  },
  freshsales: {
    competitor: "Freshsales",
    route: null,
    picks: [
      { name: "HelloGrowthCRM", blurb: "All-plan AI scoring and dialer without Freddy tier gates—built for teams that want bundled execution and optional RevOps help.", isUs: true },
      { name: "HubSpot", blurb: "Marketing + sales under one roof—when Freshsales feels narrow and you need inbound and nurture depth." },
      { name: "Pipedrive", blurb: "Pipeline-first simplicity—when Freshworks complexity is overkill and you want a crisp sales board." },
      { name: "Zoho CRM", blurb: "Suite economics in APAC—when regional pricing and Zoho Books alignment matter." },
      { name: "Salesforce", blurb: "Enterprise roadmap—when AI, CPQ, and multi-cloud requirements outgrow mid-market Freshsales tiers." },
    ],
  },
  "close-crm": {
    competitor: "Close CRM",
    route: null,
    picks: [
      { name: "HelloGrowthCRM", blurb: "Balances calling with forecasting, AI prioritization, and WhatsApp—when you have graduated from dialer-only workflows to full RevOps discipline.", isUs: true },
      { name: "HubSpot", blurb: "Broader revenue platform—when you need marketing automation alongside sales execution." },
      { name: "Pipedrive", blurb: "Structured pipeline CRM—when calling volume drops and you want lighter-weight deal management." },
      { name: "monday sales CRM", blurb: "Cross-team boards—when sales lives inside a monday.com-first operating model." },
      { name: "Freshsales", blurb: "Freshworks-native CRM—when ticketing and CRM should share vendors and admin practices." },
    ],
  },
  "monday-crm": {
    competitor: "monday sales CRM",
    route: null,
    picks: [
      { name: "HelloGrowthCRM", blurb: "Purpose-built sales CRM with AI, dialer, and messaging ready on day one—without configuring boards across unrelated teams.", isUs: true },
      { name: "HubSpot", blurb: "Marketing + CRM suite—when campaigns and sales alignment justify a separate go-to-market stack." },
      { name: "Pipedrive", blurb: "Sales-native pipeline—when monday's work-OS flexibility slows down pure revenue teams." },
      { name: "Salesforce", blurb: "Enterprise CRM depth—when governance, objects, and AppExchange are non-negotiable." },
      { name: "Zoho CRM", blurb: "Suite value—when APAC pricing and Zoho ecosystem matter more than monday's project workflows." },
    ],
  },
  wati: {
    competitor: "WATI",
    route: "/wati-alternative",
    picks: [
      { name: "HelloGrowthCRM", blurb: "Full CRM with native WhatsApp, dialer, AI lead scoring, and email sequences — replaces WATI and your existing CRM at lower combined cost.", isUs: true },
      { name: "AiSensy", blurb: "WhatsApp-first broadcast and chatbot platform — if you only need messaging without CRM pipeline." },
      { name: "Interakt", blurb: "WhatsApp Business API platform — strong for e-commerce and customer support use cases." },
      { name: "HubSpot", blurb: "CRM suite with WhatsApp via Marketing Hub add-on — when full marketing automation justifies the cost." },
    ],
  },
  aisensy: {
    competitor: "AiSensy",
    route: "/aisensy-alternative",
    picks: [
      { name: "HelloGrowthCRM", blurb: "WhatsApp automation built into a full sales CRM — pipeline, dialer, lead scoring, and sequences in one platform.", isUs: true },
      { name: "WATI", blurb: "WhatsApp Business API with shared inbox and chatbot — similar scope to AiSensy, stronger on team inbox." },
      { name: "Interakt", blurb: "WhatsApp Business platform with basic contact management — good for e-commerce checkout recovery." },
      { name: "Zoho CRM", blurb: "Full CRM with WhatsApp via SalesIQ add-on — when you need CRM depth and are already in the Zoho ecosystem." },
    ],
  },
  interakt: {
    competitor: "Interakt",
    route: "/interakt-alternative",
    picks: [
      { name: "HelloGrowthCRM", blurb: "Native WhatsApp CRM with full pipeline management, AI agents, and built-in calling — not just a WhatsApp inbox.", isUs: true },
      { name: "WATI", blurb: "WhatsApp Business platform with chatbot builder — if you only need messaging without sales pipeline." },
      { name: "AiSensy", blurb: "WhatsApp broadcast and chatbot tool — focused on marketing campaigns rather than sales pipeline." },
      { name: "HubSpot", blurb: "CRM suite with WhatsApp integration via third-party connector — when full marketing automation justifies HubSpot pricing." },
    ],
  },
  bigin: {
    competitor: "Bigin by Zoho",
    route: null,
    picks: [
      { name: "HelloGrowthCRM", blurb: "Full AI sales CRM with dialer, WhatsApp, and lead scoring — for teams that have outgrown Bigin's basic pipeline and need a complete revenue platform.", isUs: true },
      { name: "Zoho CRM", blurb: "Same vendor, broader depth — when Bigin's limits are hit and you want to stay inside the Zoho ecosystem." },
      { name: "Pipedrive", blurb: "Pipeline-centric CRM — clean, visual deal management for small teams that want Bigin-like simplicity with more sales power." },
      { name: "HubSpot", blurb: "Free CRM tier with marketing tools — when you need Bigin-level ease plus email campaign capability." },
    ],
  },
  honeybook: {
    competitor: "HoneyBook",
    route: null,
    picks: [
      { name: "HelloGrowthCRM", blurb: "Sales-first CRM with pipeline, AI lead scoring, dialer, and WhatsApp — for service businesses that need stronger outbound sales beyond proposal management.", isUs: true },
      { name: "Dubsado", blurb: "Client workflow and contract automation for creative freelancers — closer HoneyBook alternative for proposal and invoice flows." },
      { name: "Pipedrive", blurb: "Visual deal pipeline — strong when HoneyBook's project-centric workflows need to evolve into a proper sales funnel." },
      { name: "HubSpot", blurb: "Free CRM with email sequences — when you want HoneyBook's client management plus inbound marketing capability." },
    ],
  },
  servicetitan: {
    competitor: "ServiceTitan",
    route: null,
    picks: [
      { name: "HelloGrowthCRM", blurb: "Lightweight AI CRM with dialer, WhatsApp, and lead scoring — for field-service businesses that need faster sales pipelines without ServiceTitan's enterprise complexity.", isUs: true },
      { name: "Jobber", blurb: "Field service management with quoting and scheduling — closer operational scope to ServiceTitan for smaller crews." },
      { name: "HubSpot", blurb: "CRM + marketing suite — when you want to capture inbound leads and run email nurtures alongside field dispatch." },
      { name: "Salesforce", blurb: "Enterprise CRM with FSM add-ons — for large multi-location operations that have outgrown ServiceTitan's verticals." },
    ],
  },
  jobber: {
    competitor: "Jobber",
    route: null,
    picks: [
      { name: "HelloGrowthCRM", blurb: "AI-powered sales CRM with built-in dialer and WhatsApp — for service businesses ready to scale outbound sales beyond Jobber's scheduling-first model.", isUs: true },
      { name: "ServiceTitan", blurb: "Enterprise field service platform — when Jobber's booking features need deeper dispatch, pricebook, and multi-location management." },
      { name: "HubSpot", blurb: "CRM with marketing automation — when you want inbound lead capture and email sequences alongside field service." },
      { name: "Pipedrive", blurb: "Simple pipeline CRM — for service teams that want Jobber-style simplicity with a sales funnel view." },
    ],
  },
  belay: {
    competitor: "Belay",
    route: null,
    picks: [
      { name: "HelloGrowthCRM", blurb: "AI CRM with AI agents and lead scoring — for teams supplementing or replacing Belay's virtual assistant services with automation.", isUs: true },
      { name: "HubSpot", blurb: "CRM suite with email automation — handles many tasks Belay VAs perform manually: scheduling, follow-up sequences, meeting booking." },
      { name: "Pipedrive", blurb: "Sales pipeline with AI assistant — lightweight CRM automation that reduces the need for manual admin support." },
      { name: "Salesforce", blurb: "Enterprise CRM with workflow automation — for organizations scaling beyond what any virtual assistant service can cover." },
    ],
  },
  "go-high-level": {
    competitor: "GoHighLevel",
    route: "/gohighlevel-alternative",
    picks: [
      { name: "HelloGrowthCRM", blurb: "Native AI sales CRM without white-label reseller complexity — better when your team needs a sales pipeline tool, not an agency platform.", isUs: true },
      { name: "HubSpot", blurb: "Enterprise CRM and marketing platform — when you want Go High Level's breadth with a larger vendor's stability and integrations." },
      { name: "ActiveCampaign", blurb: "Marketing automation and CRM — focused on email drip and segmentation without Go High Level's agency-resale layer." },
      { name: "Pipedrive", blurb: "Sales pipeline CRM — simpler and faster to deploy when your primary need is deal tracking, not full funnel marketing." },
    ],
  },
  dubsado: {
    competitor: "Dubsado",
    route: null,
    picks: [
      { name: "HelloGrowthCRM", blurb: "AI sales CRM with pipeline, dialer, and WhatsApp — for creative businesses that need stronger outbound sales alongside client management.", isUs: true },
      { name: "HoneyBook", blurb: "All-in-one client management for freelancers — closest Dubsado alternative with proposals, contracts, and invoicing." },
      { name: "HubSpot", blurb: "Free CRM with email sequences — when you want Dubsado's client workflow plus inbound marketing lead capture." },
      { name: "Pipedrive", blurb: "Visual deal pipeline — for teams that want Dubsado's simplicity with a proper sales funnel and forecasting." },
    ],
  },
  kommo: {
    competitor: "Kommo",
    route: null,
    picks: [
      { name: "HelloGrowthCRM", blurb: "AI-native sales CRM with WhatsApp, dialer, and lead scoring built in — without Kommo's per-pipeline seat pricing.", isUs: true },
      { name: "Pipedrive", blurb: "Clean visual pipeline — for sales teams that want Kommo's simplicity and messenger integrations without the complexity." },
      { name: "HubSpot", blurb: "CRM suite — when Kommo's messaging-first model needs to grow into a full sales and marketing platform." },
      { name: "Zoho CRM", blurb: "Suite value at lower per-seat cost — strong alternative when Kommo's add-on pricing gets expensive." },
    ],
  },
  leadsquared: {
    competitor: "LeadSquared",
    route: "/leadsquared-alternative",
    picks: [
      { name: "HelloGrowthCRM", blurb: "AI CRM with WhatsApp, dialer, and lead scoring at a fraction of LeadSquared's enterprise pricing — purpose-built for India SMB sales teams.", isUs: true },
      { name: "Salesforce", blurb: "Enterprise CRM — when you need LeadSquared-level customization with global integrations and AppExchange depth." },
      { name: "Zoho CRM", blurb: "India-friendly suite pricing — strong alternative when you want LeadSquared's India-first features inside the Zoho ecosystem." },
      { name: "Freshsales", blurb: "Freshworks-native CRM with phone and email — comparable to LeadSquared for SMB teams already on Freshdesk." },
    ],
  },
  "less-annoying-crm": {
    competitor: "Less Annoying CRM",
    route: null,
    picks: [
      { name: "HelloGrowthCRM", blurb: "Just as fast to set up as LACRM, but adds AI lead scoring, sequences, dialer, and WhatsApp for growing teams — at $10/user/mo vs LACRM's $15.", isUs: true },
      { name: "Pipedrive", blurb: "Visual pipeline with automations — scales better than LACRM when your team adds reps and needs forecasting." },
      { name: "HubSpot", blurb: "Free CRM tier — if you want LACRM simplicity with optional marketing tools available as you grow." },
      { name: "Zoho CRM", blurb: "Entry-level pricing with room to grow — Zoho Bigin or Zoho CRM Free suit teams outgrowing LACRM's static contacts." },
    ],
  },
  keap: {
    competitor: "Keap",
    route: null,
    picks: [
      { name: "HelloGrowthCRM", blurb: "AI lead scoring, dialer, WhatsApp, and sales automation at $10/user/mo — built for revenue-focused SMBs that find Keap's $299/mo base price hard to justify.", isUs: true },
      { name: "ActiveCampaign", blurb: "Automation-first CRM — strong email marketing and segmentation at a lower entry price than Keap." },
      { name: "HubSpot", blurb: "CRM + Marketing Hub — when you want Keap's all-in-one promise with a larger vendor's integrations and free tier." },
      { name: "Pipedrive", blurb: "Sales pipeline CRM — if Keap's marketing automation is underused and you primarily need deal tracking." },
    ],
  },
  activecampaign: {
    competitor: "ActiveCampaign",
    route: null,
    picks: [
      { name: "HelloGrowthCRM", blurb: "Sales CRM with native sequences, WhatsApp, and AI lead scoring — for teams that have outgrown ActiveCampaign's marketing-first model and need a sales pipeline.", isUs: true },
      { name: "HubSpot", blurb: "Marketing + Sales Hub — when you want ActiveCampaign's automation breadth with a proper CRM pipeline and reporting." },
      { name: "Klaviyo", blurb: "E-commerce email and SMS automation — if your ActiveCampaign usage is primarily retention marketing rather than sales." },
      { name: "Pipedrive", blurb: "Pipeline-first CRM — for sales teams who find ActiveCampaign's deal management too shallow." },
    ],
  },
  engagebay: {
    competitor: "EngageBay",
    route: null,
    picks: [
      { name: "HelloGrowthCRM", blurb: "AI CRM with built-in dialer, WhatsApp, and lead scoring — cheaper than EngageBay Growth ($10 vs $14.99/user/mo) with more sales-specific capability.", isUs: true },
      { name: "HubSpot", blurb: "CRM + Marketing Hub — when you want EngageBay's all-in-one promise with a larger vendor's integrations and app marketplace." },
      { name: "ActiveCampaign", blurb: "Automation-first CRM — stronger email segmentation and drip automation than EngageBay at comparable pricing." },
      { name: "Zoho CRM", blurb: "Suite value — if you want EngageBay's breadth inside a larger ecosystem with more third-party integrations." },
    ],
  },
  attio: {
    competitor: "Attio",
    route: null,
    picks: [
      { name: "HelloGrowthCRM", blurb: "AI-powered sales CRM with built-in dialer, WhatsApp, and lead scoring — for teams that want Attio's modern UX plus outbound sales infrastructure.", isUs: true },
      { name: "HubSpot", blurb: "CRM + Marketing Hub — when Attio's data-enrichment model needs to scale into full revenue operations with marketing attribution." },
      { name: "Salesforce", blurb: "Enterprise CRM depth — when Attio's flexibility needs to graduate into AppExchange integrations and enterprise governance." },
      { name: "Pipedrive", blurb: "Visual pipeline CRM — similar modern feel to Attio with mature forecasting and calling integrations." },
    ],
  },
  nutshell: {
    competitor: "Nutshell",
    route: null,
    picks: [
      { name: "HelloGrowthCRM", blurb: "AI lead scoring, built-in dialer, and WhatsApp at $10/user/mo — covers Nutshell's clean UI and reporting at less than a quarter the Pro price.", isUs: true },
      { name: "Pipedrive", blurb: "Visual pipeline CRM — comparable simplicity to Nutshell with strong mobile app and lower per-seat cost." },
      { name: "HubSpot", blurb: "CRM + Marketing Hub — when Nutshell's reporting needs to grow into full funnel attribution and email marketing." },
      { name: "Zoho CRM", blurb: "Suite value — if you want Nutshell's SMB focus inside a broader ecosystem with dialer and AI included." },
    ],
  },
  freshteam: {
    competitor: "Freshteam",
    route: null,
    picks: [
      { name: "HelloGrowthCRM", blurb: "Sales CRM with AI, dialer, and WhatsApp — for HR-adjacent teams that also run a revenue function and need a dedicated sales pipeline alongside Freshteam.", isUs: true },
      { name: "HubSpot", blurb: "CRM + Marketing Hub — when Freshteam's sales pipeline needs to grow into a full go-to-market stack." },
      { name: "Zoho Recruit", blurb: "HR and recruitment CRM — stays within the Zoho ecosystem if you're replacing Freshteam for talent acquisition workflows." },
      { name: "Pipedrive", blurb: "Sales pipeline CRM — for Freshteam users who need a dedicated deal-tracking tool separate from HR." },
    ],
  },
  "copper-crm": {
    competitor: "Copper CRM",
    route: "/copper-crm-alternative",
    picks: [
      { name: "HelloGrowthCRM", blurb: "AI sales CRM with built-in dialer, WhatsApp, and lead scoring — for Google Workspace teams ready to move beyond Copper's contact-management-only model.", isUs: true },
      { name: "HubSpot", blurb: "CRM + Marketing Hub — when you want Copper's Google integration plus email marketing automation and a free tier." },
      { name: "Pipedrive", blurb: "Pipeline-centric CRM — clean deal management and forecasting with strong Google Workspace integration." },
      { name: "Salesforce", blurb: "Enterprise CRM depth — when Copper's simplicity is outgrown and you need AppExchange, custom objects, and multi-cloud." },
    ],
  },
  "dynamics-365": {
    competitor: "Microsoft Dynamics 365",
    route: "/dynamics-365-alternative",
    picks: [
      { name: "HelloGrowthCRM", blurb: "Fast-deploy AI CRM at $10/user/mo — purpose-built for SMB sales teams that need Dynamics-class pipeline management without the Microsoft licensing complexity.", isUs: true },
      { name: "Salesforce", blurb: "Enterprise CRM — the primary Dynamics competitor for large-scale implementations requiring deep customization." },
      { name: "HubSpot", blurb: "CRM + Marketing Hub — when Dynamics' power is overkill and you want a faster-deploying alternative with strong marketing tools." },
      { name: "Zoho CRM", blurb: "Suite value — competes with Dynamics on breadth at a fraction of the Microsoft licensing cost." },
    ],
  },
};

// ── WhatsApp-CRM alternatives detail (per-competitor pages) ──────────────────
// Source: hellocrmwebsite/src/lib/wa-alternatives-data.ts (waAlternatives) — SYNCED_AT 2026-06-11
// faqQuestions mirrors faq questions only (answers summarised away; full answers on the live page).
type WaAlternativeDetail = {
  slug: string;
  name: string;
  route: string;
  h1: string;
  tagline: string;
  reasons: Array<{ title: string; desc: string }>;
  /** [feature, HelloGrowthCRM, competitor] */
  featureRows: [string, string, string][];
  faqQuestions: string[];
  verdict: string;
};

const WA_ALTERNATIVES: WaAlternativeDetail[] = [
  {
    slug: "wati",
    name: "WATI",
    route: "/wati-alternative",
    h1: "Best WATI Alternative — HelloGrowthCRM WhatsApp CRM",
    tagline: "WhatsApp + full CRM in one tool. No separate WATI subscription needed.",
    reasons: [
      { title: "WhatsApp + CRM in one", desc: "WATI handles WhatsApp but needs a separate CRM. HelloGrowthCRM has both in one platform — no sync, no double data entry." },
      { title: "AI lead scoring included", desc: "WATI has no lead intelligence. HelloGrowthCRM ranks every lead by close probability using AI, right inside your CRM." },
      { title: "Built-in dialer", desc: "WATI is WhatsApp-only. HelloGrowthCRM adds a full calling suite — click to call, recordings, and AI summaries — alongside WhatsApp." },
      { title: "Full pipeline management", desc: "WATI has no deal pipeline. HelloGrowthCRM's visual Kanban pipeline tracks every deal from first message to close." },
    ],
    featureRows: [
      ["CRM + pipeline", "Full CRM with Kanban pipeline", "No CRM — WhatsApp inbox only"],
      ["WhatsApp messaging", "Native — included", "Core feature"],
      ["AI lead scoring", "Included — all plans", "Not available"],
      ["Built-in dialer", "Yes — call recording + AI", "Not available"],
      ["Email automation", "Yes — sequences included", "Not available"],
      ["Broadcast messaging", "Yes — via WhatsApp", "Yes — core feature"],
      ["Chatbot / automation", "Workflow automation included", "Chatbot builder available"],
      ["Pricing", "From $10/user/mo (all-in-one)", "From $49/mo (WhatsApp only)"],
    ],
    faqQuestions: [
      "Why should I use HelloGrowthCRM instead of WATI?",
      "Does HelloGrowthCRM support WhatsApp Business API like WATI?",
      "Can I send WhatsApp broadcasts with HelloGrowthCRM?",
      "Is HelloGrowthCRM cheaper than WATI for sales teams?",
      "Does HelloGrowthCRM have chatbots like WATI?",
    ],
    verdict: "HelloGrowthCRM is the best WATI alternative for sales teams that want WhatsApp conversations inside a full CRM — without paying for WATI separately and then stitching it to another CRM.",
  },
  {
    slug: "aisensy",
    name: "AiSensy",
    route: "/aisensy-alternative",
    h1: "Best AiSensy Alternative — HelloGrowthCRM WhatsApp CRM",
    tagline: "All of AiSensy's WhatsApp — plus AI, calling, and a full CRM.",
    reasons: [
      { title: "CRM built in", desc: "AiSensy is a WhatsApp platform, not a CRM. HelloGrowthCRM has full pipeline, lead management, and deal tracking alongside WhatsApp." },
      { title: "AI lead intelligence", desc: "AiSensy has no lead scoring. HelloGrowthCRM's AI ranks every inbound by close probability so your team calls the right people first." },
      { title: "Multi-channel outreach", desc: "AiSensy focuses on WhatsApp campaigns. HelloGrowthCRM adds email sequences, calling, and SMS in one unified inbox." },
      { title: "Sales pipeline", desc: "AiSensy has no deal pipeline. HelloGrowthCRM's Kanban pipeline lets your team track every deal from WhatsApp chat to closed-won." },
    ],
    featureRows: [
      ["CRM + pipeline", "Full CRM with Kanban pipeline", "No CRM — campaign tool"],
      ["WhatsApp messaging", "Native — included", "Core feature"],
      ["AI lead scoring", "Included", "Not available"],
      ["Built-in dialer", "Yes — click to call", "Not available"],
      ["Email automation", "Included", "Not available"],
      ["WhatsApp broadcasts", "Yes", "Yes — core feature"],
      ["Chatbot automation", "Workflow automation", "Chatbot builder available"],
      ["Pricing", "From $10/user/mo", "From ₹999/mo (broadcasts only)"],
    ],
    faqQuestions: [
      "How is HelloGrowthCRM better than AiSensy?",
      "Can I do WhatsApp campaigns with HelloGrowthCRM like AiSensy?",
      "Does HelloGrowthCRM support WhatsApp Business API?",
      "Is HelloGrowthCRM an AiSensy alternative for India?",
      "Does AiSensy have a CRM?",
    ],
    verdict: "HelloGrowthCRM is the best AiSensy alternative for sales teams that want WhatsApp campaigns and CRM in one platform — with AI lead scoring, pipeline management, and calling included.",
  },
  {
    slug: "interakt",
    name: "Interakt",
    route: "/interakt-alternative",
    h1: "Best Interakt Alternative — HelloGrowthCRM WhatsApp CRM",
    tagline: "WhatsApp CRM with AI scoring, calling, and pipeline — all in one place.",
    reasons: [
      { title: "Full CRM, not just WhatsApp", desc: "Interakt is a WhatsApp Business solution. HelloGrowthCRM has a complete CRM with pipeline, leads, and deals alongside WhatsApp." },
      { title: "AI lead scoring", desc: "Interakt has no intelligence layer. HelloGrowthCRM's AI scores and prioritizes leads so your team always calls the hottest ones first." },
      { title: "Unified inbox — all channels", desc: "Interakt is WhatsApp-first. HelloGrowthCRM's inbox combines WhatsApp, email, SMS, and calls in one view." },
      { title: "No separate CRM subscription", desc: "With Interakt, you still need a separate CRM. HelloGrowthCRM eliminates that cost with a single all-in-one platform." },
    ],
    featureRows: [
      ["CRM + pipeline", "Full CRM — leads, deals, pipeline", "WhatsApp inbox — no CRM pipeline"],
      ["WhatsApp messaging", "Native — included", "Core feature"],
      ["AI lead scoring", "Included", "Not available"],
      ["Built-in dialer", "Yes", "Not available"],
      ["Email sequences", "Included", "Not available"],
      ["WhatsApp catalog / commerce", "Limited", "Yes — D2C-focused"],
      ["Shared team inbox", "Yes", "Yes"],
      ["Pricing", "From $10/user/mo", "From $15/mo (WhatsApp only)"],
    ],
    faqQuestions: [
      "Why switch from Interakt to HelloGrowthCRM?",
      "Does HelloGrowthCRM have WhatsApp like Interakt?",
      "Is HelloGrowthCRM better than Interakt for sales teams?",
      "Can I migrate from Interakt to HelloGrowthCRM?",
      "Does HelloGrowthCRM support WhatsApp catalogs like Interakt?",
    ],
    verdict: "HelloGrowthCRM is the best Interakt alternative for B2B sales teams that need a full CRM with AI, calling, and WhatsApp in one platform — rather than a WhatsApp commerce tool that requires a separate CRM.",
  },
  {
    slug: "gallabox",
    name: "Gallabox",
    route: "/gallabox-alternative",
    h1: "Best Gallabox Alternative — HelloGrowthCRM WhatsApp CRM",
    tagline: "All your WhatsApp conversations, inside a real sales CRM.",
    reasons: [
      { title: "CRM included — not separate", desc: "Gallabox is a WhatsApp tool. HelloGrowthCRM is a full CRM with WhatsApp built in — one subscription covers both." },
      { title: "AI lead intelligence", desc: "Gallabox focuses on messaging. HelloGrowthCRM's AI layer scores leads, forecasts revenue, and summarizes calls automatically." },
      { title: "Multi-channel outreach", desc: "Gallabox is WhatsApp-first. HelloGrowthCRM adds email, calling, and SMS — all linked to the same lead record." },
      { title: "Pipeline + WhatsApp together", desc: "Track every deal from WhatsApp chat to closed-won in HelloGrowthCRM's visual pipeline. Gallabox has no deal pipeline." },
    ],
    featureRows: [
      ["CRM + pipeline", "Full CRM with deals and pipeline", "No pipeline — WhatsApp inbox"],
      ["WhatsApp messaging", "Native — included", "Core feature"],
      ["AI lead scoring", "Included", "Not available"],
      ["Built-in dialer", "Yes — included", "Not available"],
      ["Email automation", "Included", "Not available"],
      ["WhatsApp broadcasts", "Yes", "Yes — core feature"],
      ["Bot builder", "Workflow automation", "No-code bot builder"],
      ["Pricing", "From $10/user/mo", "From $40/mo (WhatsApp only)"],
    ],
    faqQuestions: [
      "Why is HelloGrowthCRM a better alternative to Gallabox?",
      "Does HelloGrowthCRM have WhatsApp bots like Gallabox?",
      "Is HelloGrowthCRM cheaper than Gallabox for sales teams?",
      "Can I switch from Gallabox to HelloGrowthCRM?",
      "What's the difference between Gallabox and HelloGrowthCRM?",
    ],
    verdict: "HelloGrowthCRM is the best Gallabox alternative for sales teams who want WhatsApp conversations tracked inside a full AI-powered CRM — without paying for two tools and managing two databases.",
  },
  {
    slug: "doubletick",
    name: "DoubleTick",
    route: "/doubletick-alternative",
    h1: "Best DoubleTick Alternative — HelloGrowthCRM WhatsApp CRM",
    tagline: "WhatsApp selling made smarter — with AI, pipeline, and calling built in.",
    reasons: [
      { title: "CRM + WhatsApp in one", desc: "DoubleTick is a WhatsApp sales tool. HelloGrowthCRM gives you WhatsApp inside a full CRM — no separate subscription, no data fragmentation." },
      { title: "AI lead scoring", desc: "DoubleTick has no AI intelligence. HelloGrowthCRM's AI scores every lead automatically so your team focuses on deals most likely to close." },
      { title: "Full dialer included", desc: "DoubleTick is messaging-only. HelloGrowthCRM adds a built-in dialer with call recording and AI-generated summaries alongside WhatsApp." },
      { title: "Pipeline management", desc: "DoubleTick has no deal pipeline. HelloGrowthCRM's visual Kanban pipeline tracks every deal from first WhatsApp message to signed contract." },
    ],
    featureRows: [
      ["CRM + pipeline", "Full CRM with deals and pipeline", "No CRM — WhatsApp inbox"],
      ["WhatsApp messaging", "Native — included", "Core feature"],
      ["AI lead scoring", "Included", "Not available"],
      ["Built-in dialer", "Yes — call recording + AI summaries", "Not available"],
      ["Email sequences", "Included", "Not available"],
      ["Team inbox", "Yes", "Yes"],
      ["WhatsApp broadcasts", "Yes", "Yes — core feature"],
      ["Pricing", "From $10/user/mo", "From ₹2,500/mo"],
    ],
    faqQuestions: [
      "Why switch from DoubleTick to HelloGrowthCRM?",
      "Does HelloGrowthCRM support WhatsApp like DoubleTick?",
      "Is HelloGrowthCRM better than DoubleTick for B2B sales?",
      "Can I migrate from DoubleTick to HelloGrowthCRM?",
      "Does HelloGrowthCRM have WhatsApp broadcasts like DoubleTick?",
    ],
    verdict: "HelloGrowthCRM is the best DoubleTick alternative for B2B sales teams who want WhatsApp selling inside a real CRM — with AI scoring, a built-in dialer, and pipeline management all in one platform.",
  },
];

// ── /switch-from-* migration guides ──────────────────────────────────────────
// Source: hellocrmwebsite/src/lib/switch-data.ts (switchCRMs, all 22 entries) — SYNCED_AT 2026-06-11
// Mirrored fields: slug, name, h1, tagline, reasons (pain points), featureRows
// (feature comparison), migrationSteps (key steps incl. data mapped), verdict.
// faqQuestions mirrors faq questions only; longform body prose summarised away.
type SwitchGuide = {
  slug: string;
  name: string;
  h1: string;
  tagline: string;
  reasons: Array<{ title: string; desc: string }>;
  /** [feature, HelloGrowthCRM, competitor] */
  featureRows: [string, string, string][];
  migrationSteps: string[];
  verdict: string;
  faqQuestions: string[];
};

const SWITCH_GUIDES: SwitchGuide[] = [
  {
    slug: "zoho",
    name: "Zoho CRM",
    h1: "Switch from Zoho CRM to HelloGrowthCRM",
    tagline: "Leave Zoho's complexity behind. Get AI, dialer, and WhatsApp in one clean CRM.",
    reasons: [
      { title: "One price, all features", desc: "Zoho bundles features across 40+ apps. HelloGrowthCRM includes AI scoring, dialer, and WhatsApp in one plan." },
      { title: "Setup in 15 minutes", desc: "Zoho's multi-module setup takes days. HelloGrowthCRM is live in under 15 minutes with guided onboarding." },
      { title: "Built-in dialer", desc: "Zoho PhoneBridge requires third-party setup. HelloGrowthCRM has a native dialer with recording and AI summaries." },
      { title: "AI that works out of the box", desc: "Zia (Zoho's AI) needs data history and configuration. HelloGrowthCRM's AI lead scoring works from day one." },
    ],
    featureRows: [
      ["Pricing", "From ₹899/user/mo", "Zoho One $37/user/mo; CRM Plus $57/user/mo"],
      ["Built-in dialer", "Included — click to call", "PhoneBridge requires third-party integration"],
      ["AI lead scoring", "Included in all plans", "Zia AI — higher tiers only"],
      ["WhatsApp CRM", "Native — no setup needed", "Zoho SalesIQ or Zoho Cliq add-on"],
      ["Setup time", "15 minutes", "2–5 days (modules, profiles, roles)"],
      ["Mobile app", "Clean iOS & Android", "Multiple Zoho apps needed"],
      ["RevOps support", "Managed RevOps available", "Zoho partner network only"],
      ["Pipeline view", "Kanban + list, AI insights", "Kanban; limited AI in lower tiers"],
    ],
    migrationSteps: [
      "Export contacts and leads from Zoho CRM: go to Contacts / Leads → Actions → Export as CSV.",
      "Upload the CSV in HelloGrowthCRM under Leads → Import; fields are auto-matched to Zoho naming.",
      "Recreate your pipeline stages in Deals → Pipeline, invite your team, and go live.",
    ],
    verdict: "HelloGrowthCRM is the best Zoho CRM alternative for sales-first teams that want one simple, powerful CRM — without Zoho's multi-app complexity, add-on costs, or steep learning curve.",
    faqQuestions: [
      "How long does it take to switch from Zoho to HelloGrowthCRM?",
      "Can I keep my Zoho data when I switch?",
      "Is HelloGrowthCRM cheaper than Zoho?",
      "Does HelloGrowthCRM have WhatsApp like Zoho?",
      "What if I have Zoho custom fields?",
    ],
  },
  {
    slug: "salesforce",
    name: "Salesforce",
    h1: "Switch from Salesforce to HelloGrowthCRM",
    tagline: "End the Salesforce admin tax. Get enterprise power at a fraction of the price.",
    reasons: [
      { title: "No admin team needed", desc: "Salesforce requires dedicated admins and consultants. HelloGrowthCRM is managed by your sales team from day one." },
      { title: "60% lower total cost", desc: "Salesforce licenses, implementation, and add-ons add up fast. HelloGrowthCRM's flat price includes everything." },
      { title: "Days, not months, to go live", desc: "Salesforce implementations take 3–6 months. HelloGrowthCRM is configured and live in under a week." },
      { title: "AI without Einstein costs", desc: "Salesforce Einstein is a paid add-on. HelloGrowthCRM's AI lead scoring and forecasting are included in every plan." },
    ],
    featureRows: [
      ["Pricing", "From ₹899/user/mo", "Professional $165/user/mo; Enterprise $330/user/mo"],
      ["Implementation time", "< 1 week", "3–6 months with consultants"],
      ["Admin requirement", "No dedicated admin needed", "Dedicated Salesforce admin required"],
      ["AI lead scoring", "Included in all plans", "Einstein — paid add-on"],
      ["Built-in dialer", "Included", "Third-party CTI integrations"],
      ["WhatsApp integration", "Native", "Service Cloud add-on"],
      ["Managed RevOps", "Available natively", "Expensive SI partners only"],
      ["Contract flexibility", "Month-to-month", "Annual contracts, high exit cost"],
    ],
    migrationSteps: [
      "In Salesforce, go to Setup → Data Export → Export Now — export Contacts, Leads, Accounts, and Opportunities as CSV.",
      "Upload each CSV in HelloGrowthCRM under Leads → Import; AI auto-maps Salesforce field names.",
      "Set up your pipeline in Deals, configure your team, and go live — no consultant needed.",
    ],
    verdict: "HelloGrowthCRM is the ideal Salesforce alternative for growing businesses that want enterprise-grade AI, automation, and pipeline management without the enterprise price tag, admin overhead, or 6-month implementation.",
    faqQuestions: [
      "How hard is it to switch from Salesforce to HelloGrowthCRM?",
      "Will I lose data switching from Salesforce?",
      "Do I need a Salesforce admin to migrate?",
      "Is HelloGrowthCRM cheaper than Salesforce?",
      "Can HelloGrowthCRM replace Salesforce for a 20-person sales team?",
    ],
  },
  {
    slug: "freshsales",
    name: "Freshsales",
    h1: "Switch from Freshsales to HelloGrowthCRM",
    tagline: "More AI, real WhatsApp, managed RevOps. Everything Freshsales promised, delivered.",
    reasons: [
      { title: "Better AI lead scoring", desc: "Freshsales Freddy AI is limited in lower plans. HelloGrowthCRM's AI scoring works across all tiers from day one." },
      { title: "Native WhatsApp (not an add-on)", desc: "Freshsales integrates WhatsApp via third-party. HelloGrowthCRM has native WhatsApp conversations linked to every lead." },
      { title: "Managed RevOps", desc: "Freshsales offers software support. HelloGrowthCRM's Growth Engine gives you a dedicated RevOps specialist." },
      { title: "Simpler pricing", desc: "Freshsales tiers lock key features. HelloGrowthCRM's flat pricing gives every user full feature access." },
    ],
    featureRows: [
      ["Pricing", "From ₹899/user/mo", "Growth $11/user/mo; Pro $47/user/mo for full AI"],
      ["AI lead scoring", "All plans — no upgrade needed", "Freddy AI — Pro plan only ($47/user/mo)"],
      ["WhatsApp integration", "Native — zero setup", "Third-party via integrations"],
      ["Built-in dialer", "Included with AI summaries", "Included — limited call intelligence"],
      ["Pipeline forecasting", "AI-powered — included", "Limited — Pro plan only"],
      ["RevOps support", "Managed RevOps available", "Software support only"],
      ["Mobile app", "iOS & Android", "iOS & Android"],
      ["Email sequences", "Included", "Included — higher plans only"],
    ],
    migrationSteps: [
      "In Freshsales, go to Contacts → More → Export to download contacts and leads as CSV.",
      "Upload the CSV in HelloGrowthCRM under Leads → Import; Freshsales headers are auto-detected.",
      "Recreate your pipeline stages in Deals → Pipeline and configure automations via Workflows.",
    ],
    verdict: "HelloGrowthCRM is the best Freshsales alternative for teams that need AI scoring on all plans, native WhatsApp, and optional done-for-you RevOps — without upgrading to Freshsales Pro just to unlock core features.",
    faqQuestions: [
      "How is HelloGrowthCRM better than Freshsales?",
      "How do I migrate from Freshsales to HelloGrowthCRM?",
      "Is HelloGrowthCRM cheaper than Freshsales Pro?",
      "Does HelloGrowthCRM have WhatsApp like Freshsales?",
      "Can I keep my Freshsales deal history?",
    ],
  },
  {
    slug: "pipedrive",
    name: "Pipedrive",
    h1: "Switch from Pipedrive to HelloGrowthCRM",
    tagline: "Beyond the pipeline view. Get AI, calling, and WhatsApp in one place.",
    reasons: [
      { title: "AI that does more than score", desc: "Pipedrive's AI is basic pipeline prediction. HelloGrowthCRM's AI scores leads, summarizes calls, and forecasts revenue." },
      { title: "Built-in calling", desc: "Pipedrive calling requires add-ons or integrations. HelloGrowthCRM has a full dialer with recording and AI call summaries included." },
      { title: "Native WhatsApp", desc: "Pipedrive needs third-party connectors for WhatsApp. HelloGrowthCRM has WhatsApp built in, linked to every lead." },
      { title: "Optional managed RevOps", desc: "Pipedrive is a self-serve tool. HelloGrowthCRM's Growth Engine gives you a dedicated specialist to run your pipeline." },
    ],
    featureRows: [
      ["Pricing", "From ₹899/user/mo", "Essential $24/user/mo; Advanced $44/user/mo for AI"],
      ["AI lead scoring", "Included — all plans", "LeadBooster add-on or higher tiers"],
      ["Built-in dialer", "Included with call recording", "Add-on or third-party integration"],
      ["WhatsApp integration", "Native — zero setup", "Third-party via Zapier or Make"],
      ["Email automation", "Included", "Advanced/Professional plans only"],
      ["RevOps support", "Managed RevOps available", "Self-serve only"],
      ["Pipeline forecasting", "AI-powered", "Revenue forecasting — higher tiers"],
      ["Mobile app", "iOS & Android", "Good iOS & Android app"],
    ],
    migrationSteps: [
      "In Pipedrive, go to Contacts → People and export as CSV; do the same for Deals.",
      "Upload the CSV in HelloGrowthCRM under Leads → Import; Pipedrive naming conventions auto-map.",
      "Recreate your deal stages in Deals → Pipeline and invite your team. You're live.",
    ],
    verdict: "HelloGrowthCRM is the best Pipedrive alternative for teams that have outgrown a pipeline-only CRM and need AI lead scoring, a built-in dialer, WhatsApp, and optional RevOps execution — all without add-ons.",
    faqQuestions: [
      "Why should I switch from Pipedrive to HelloGrowthCRM?",
      "How do I migrate from Pipedrive to HelloGrowthCRM?",
      "Is HelloGrowthCRM cheaper than Pipedrive Advanced?",
      "Does HelloGrowthCRM have a visual pipeline like Pipedrive?",
      "Can I bring my Pipedrive deals and notes into HelloGrowthCRM?",
    ],
  },
  {
    slug: "leadsquared",
    name: "LeadSquared",
    h1: "Switch from LeadSquared to HelloGrowthCRM",
    tagline: "Cut your CRM bill by 96%. Get native WhatsApp, AI scoring, and zero implementation complexity.",
    reasons: [
      { title: "₹99 vs ₹2,500 per user", desc: "HelloGrowthCRM includes AI lead scoring, WhatsApp CRM, and a built-in dialer at ₹99/user/month — 25x cheaper than LeadSquared's entry plan." },
      { title: "Live in 15 minutes — no implementation team", desc: "LeadSquared requires weeks of setup with an implementation partner. HelloGrowthCRM is self-serve and live in under 15 minutes." },
      { title: "Native WhatsApp — not a third-party add-on", desc: "LeadSquared's WhatsApp is a third-party integration that breaks. HelloGrowthCRM's WhatsApp is fully native — conversations link directly to leads and deals." },
      { title: "AI lead scoring in every plan", desc: "LeadSquared gates its best AI features behind enterprise tiers. HelloGrowthCRM includes AI lead scoring from ₹99/user/month with no upgrade required." },
    ],
    featureRows: [
      ["Pricing", "From ₹99/user/month — all features included", "Basic ₹2,500/user/month; Enterprise ₹8,000+/user/month"],
      ["Free plan", "Yes — up to 200 leads, forever", "No free plan"],
      ["Setup time", "15 minutes — no implementation partner", "Weeks with paid implementation team"],
      ["WhatsApp CRM", "Native — zero setup, full pipeline integration", "Third-party integration — separate configuration"],
      ["AI lead scoring", "Included in all plans", "Higher tiers only"],
      ["Built-in dialer", "Included with call recording and AI summaries", "Field Force module — additional cost"],
      ["DPDPA compliance", "Included — consent management + data rights", "Enterprise tier only"],
      ["Managed RevOps", "Growth Engine — dedicated RevOps specialist", "LeadSquared partners — extra cost"],
    ],
    migrationSteps: [
      "Export your leads from LeadSquared: go to Leads → Export → Download as CSV (all fields). Do the same for Contacts and Opportunities.",
      "Upload your CSV in HelloGrowthCRM under Leads → Import — the import wizard auto-maps LeadSquared field names including email, phone, lead source, and custom fields.",
      "Recreate your pipeline stages in Deals → Pipeline, configure your WhatsApp and email automation workflows, and invite your team. You're live — with no implementation partner required.",
    ],
    verdict: "HelloGrowthCRM is the best LeadSquared alternative for Indian SMBs and mid-market sales teams that want AI lead scoring, native WhatsApp, and a built-in dialer at a price that doesn't require a CFO approval — and a setup process that doesn't require a six-week implementation project.",
    faqQuestions: [
      "How much can I save by switching from LeadSquared to HelloGrowthCRM?",
      "Will I lose any features switching from LeadSquared to HelloGrowthCRM?",
      "How do I migrate my data from LeadSquared?",
      "Does HelloGrowthCRM handle the same volume of leads as LeadSquared?",
      "Is HelloGrowthCRM compliant with Indian data regulations like DPDPA?",
    ],
  },
  {
    slug: "monday-com",
    name: "Monday.com",
    h1: "Switch from Monday.com to HelloGrowthCRM",
    tagline: "Stop using a work OS as a CRM. Get a real sales platform with AI, dialer, and WhatsApp built in.",
    reasons: [
      { title: "Built for selling, not for tracking tasks", desc: "Monday.com is a project management tool. HelloGrowthCRM is a purpose-built sales CRM with pipeline stages, deal forecasting, and lead prioritization — not generic boards." },
      { title: "AI lead scoring out of the box", desc: "Monday.com has no native lead scoring. HelloGrowthCRM scores every lead by conversion probability so your team calls the right people first." },
      { title: "Built-in dialer and WhatsApp", desc: "Monday.com requires third-party integrations for calling and messaging. HelloGrowthCRM has both natively — click to call, auto-log, WhatsApp threads linked to leads." },
      { title: "One price that makes sense for sales teams", desc: "Monday.com charges per seat with limits on automation runs and boards. HelloGrowthCRM has unlimited leads and automation in one flat plan." },
    ],
    featureRows: [
      ["Primary use case", "Sales CRM — pipeline, leads, deals", "Project / work management"],
      ["AI lead scoring", "Included in all plans", "Not available"],
      ["Built-in dialer", "Yes — click-to-call with recording", "No — requires integration"],
      ["WhatsApp CRM", "Native inbox, no setup required", "Requires third-party integration"],
      ["Email sequences", "Multi-step sequences with AI drafting", "Basic — no native sequences"],
      ["Sales forecasting", "AI-powered revenue forecasting", "Manual — no forecasting engine"],
      ["Pricing", "From ₹899/user/month — all features", "From $9/user/month — automation run limits"],
      ["Free plan", "Yes — 200 leads, forever", "14-day trial only"],
    ],
    migrationSteps: [
      "Export your Monday.com CRM boards as CSV: open each board → Menu → Export → Excel/CSV. Download contacts, leads, and deals separately.",
      "Import into HelloGrowthCRM: go to Leads → Import, upload your CSV, and map Monday.com columns (Name, Email, Phone, Status) to HelloGrowthCRM fields. The import wizard handles custom columns too.",
      "Recreate your automations: build follow-up sequences in Automation → Sequences and set pipeline stage triggers. Your team gets a full CRM in place of a work board — with calling, WhatsApp, and AI scoring already on.",
    ],
    verdict: "If your team is using Monday.com as a sales CRM, you're fighting the tool's design. HelloGrowthCRM is built specifically for revenue teams — with AI scoring, dialer, WhatsApp, and pipeline automation that Monday simply doesn't have.",
    faqQuestions: [
      "Is Monday.com actually a CRM?",
      "How hard is it to migrate from Monday.com?",
      "Will I lose my automation workflows when switching?",
      "Is HelloGrowthCRM cheaper than Monday.com for sales teams?",
      "Can I use HelloGrowthCRM for project management too?",
    ],
  },
  {
    slug: "microsoft-dynamics-365",
    name: "Microsoft Dynamics 365",
    h1: "Switch from Microsoft Dynamics 365 to HelloGrowthCRM",
    tagline: "Enterprise CRM complexity at SMB prices? There's a better way. HelloGrowthCRM is live in 15 minutes.",
    reasons: [
      { title: "90% lower cost", desc: "Dynamics 365 Sales Professional starts at $65/user/month; Enterprise is $95–$135/user/month. HelloGrowthCRM starts at ₹899/user/mo with all features included." },
      { title: "No implementation project required", desc: "Dynamics 365 typically requires a 3–6 month implementation with a Microsoft partner. HelloGrowthCRM is self-serve and live in 15 minutes." },
      { title: "Built-in dialer and WhatsApp", desc: "Dynamics 365 requires additional licenses and integrations for calling and messaging. HelloGrowthCRM includes both natively." },
      { title: "AI that works from day one", desc: "Dynamics AI requires data history and Copilot add-ons. HelloGrowthCRM's AI lead scoring works immediately on import with no configuration required." },
    ],
    featureRows: [
      ["Pricing", "From ₹899/user/month — all features", "$65–$135/user/month + add-ons"],
      ["Implementation time", "15 minutes — self-serve", "3–6 months with implementation partner"],
      ["Built-in dialer", "Yes — click-to-call, recording, AI summaries", "Requires Phone System + Teams add-on"],
      ["WhatsApp CRM", "Native — no third-party setup", "Requires third-party integration"],
      ["AI lead scoring", "Included in all plans", "Dynamics 365 Copilot — additional cost"],
      ["Free plan", "Yes — 200 leads, no credit card", "No free plan"],
      ["India pricing (INR)", "₹99/user/month — GST-inclusive", "USD only — no INR pricing"],
      ["Managed RevOps", "Growth Engine included — from $1,499/month", "Requires certified Microsoft partner"],
    ],
    migrationSteps: [
      "Export your Dynamics 365 data: Settings → Data Management → Export Data (or use Advanced Find → Export to Excel). Export Accounts, Contacts, Leads, and Opportunities.",
      "Import into HelloGrowthCRM: Leads → Import → Upload CSV. The import wizard maps standard Dynamics field names (Full Name, Email, Phone, Lead Source, Status) automatically.",
      "Configure your pipeline and automations in HelloGrowthCRM — typically 2–4 hours. No implementation partner, no project plan, no consulting fees.",
    ],
    verdict: "Dynamics 365 is designed for enterprise organizations with IT teams and implementation budgets. If you're an SMB or mid-market team paying enterprise prices for a system your reps resist using, HelloGrowthCRM delivers the same pipeline visibility, AI, and automation at a fraction of the cost.",
    faqQuestions: [
      "How much can we save switching from Dynamics 365 to HelloGrowthCRM?",
      "Can HelloGrowthCRM replace Dynamics 365 for a B2B sales team?",
      "How long does migration from Dynamics 365 take?",
      "Does HelloGrowthCRM integrate with Microsoft tools?",
      "Is HelloGrowthCRM compliant for regulated industries?",
    ],
  },
  {
    slug: "copper-crm",
    name: "Copper CRM",
    h1: "Switch from Copper CRM to HelloGrowthCRM",
    tagline: "Copper is a Gmail sidebar. HelloGrowthCRM is a full AI CRM with dialer and WhatsApp.",
    reasons: [
      { title: "Works beyond Google Workspace", desc: "Copper only works inside Gmail and Google Calendar. HelloGrowthCRM works with any email client, phone system, and messaging tool your team uses." },
      { title: "AI lead scoring — not just data entry", desc: "Copper auto-fills contact details from Gmail. HelloGrowthCRM scores every lead by conversion probability and surfaces the ones most likely to close." },
      { title: "Built-in dialer — not a Google Voice workaround", desc: "Copper requires external dialer integrations. HelloGrowthCRM has a native click-to-call dialer with recording, AI summaries, and voicemail drop." },
      { title: "WhatsApp and SMS natively", desc: "Copper has no WhatsApp support. HelloGrowthCRM includes a full WhatsApp CRM inbox linked to your lead pipeline." },
    ],
    featureRows: [
      ["Works without Google Workspace", "Yes — any email client", "No — Gmail-only"],
      ["AI lead scoring", "Included in all plans", "Not available"],
      ["Built-in dialer", "Yes — click-to-call, recording, AI summaries", "No — requires integration"],
      ["WhatsApp CRM", "Native inbox", "Not supported"],
      ["Email sequences", "Multi-step with AI drafting", "Basic email tracking only"],
      ["Pricing", "From ₹899/user/month — all features", "From $9/user/month — Google Workspace required"],
      ["Free plan", "Yes — 200 leads, no credit card", "No free plan"],
      ["India/INR pricing", "₹99/user/month", "USD only"],
    ],
    migrationSteps: [
      "Export from Copper: Settings → Data → Export. Download People, Companies, and Opportunities as CSV files.",
      "Import into HelloGrowthCRM: Leads → Import → Upload your Copper CSV. The import wizard maps Copper's standard fields (Name, Email, Phone, Stage, Pipeline) automatically.",
      "Connect your email and set up sequences. HelloGrowthCRM works with Gmail, Outlook, and any IMAP/SMTP provider — your team isn't locked into Google.",
    ],
    verdict: "Copper CRM is a good choice for teams that live entirely inside Google Workspace and need basic CRM features. If you've outgrown Gmail-only CRM, need AI lead scoring, a dialer, WhatsApp, or want to work across multiple email platforms, HelloGrowthCRM is the natural next step.",
    faqQuestions: [
      "Why switch from Copper if it's already integrated with Google?",
      "Can I still use Gmail with HelloGrowthCRM?",
      "How hard is migration from Copper?",
      "Does HelloGrowthCRM work better for non-Google teams?",
      "Is HelloGrowthCRM more expensive than Copper?",
    ],
  },
  {
    slug: "insightly",
    name: "Insightly",
    h1: "Switch from Insightly to HelloGrowthCRM",
    tagline: "Insightly is a CRM with projects. HelloGrowthCRM is a CRM with AI, dialer, and WhatsApp.",
    reasons: [
      { title: "AI lead scoring that works from day one", desc: "Insightly has no native AI lead scoring. HelloGrowthCRM scores every lead by conversion probability on import — no configuration, no waiting for data." },
      { title: "Built-in dialer — not an add-on", desc: "Insightly's Voice product is a separate paid add-on. HelloGrowthCRM includes a native dialer with recording, AI summaries, and voicemail drop in all plans." },
      { title: "WhatsApp CRM natively", desc: "Insightly has no WhatsApp support. HelloGrowthCRM's native WhatsApp inbox links conversations directly to leads and pipeline stages." },
      { title: "Simpler pricing", desc: "Insightly Plus ($29/user/month) lacks automation depth. Insightly Professional ($49/user/month) is where most teams land. HelloGrowthCRM delivers more at ₹899/user/mo." },
    ],
    featureRows: [
      ["Pricing", "From ₹899/user/month — all features", "$29–$99/user/month"],
      ["AI lead scoring", "Included in all plans", "Not available"],
      ["Built-in dialer", "Yes — recording, AI summaries, voicemail drop", "Insightly Voice — additional cost"],
      ["WhatsApp CRM", "Native inbox", "Not supported"],
      ["Email sequences", "Multi-step with AI drafting", "Basic email automation"],
      ["Sales forecasting", "AI-powered", "Manual / basic"],
      ["Free plan", "Yes — 200 leads, no credit card", "No free plan"],
      ["India/INR pricing", "₹99/user/month", "USD only"],
    ],
    migrationSteps: [
      "Export from Insightly: Reports → Data Exports. Download Contacts, Organizations, Opportunities, and Tasks as CSV files.",
      "Import into HelloGrowthCRM: Leads → Import → Upload CSV. The import wizard maps Insightly's field names (First Name, Last Name, Email, Phone, Opportunity Stage) automatically.",
      "Set up your pipeline stages, email sequences, and automations. Enable the dialer and WhatsApp integration. Most teams are fully live within 2–3 business days.",
    ],
    verdict: "Insightly suits teams that want lightweight CRM plus project tracking in one tool. If you've outgrown basic CRM features and need AI prioritization, a calling system, and WhatsApp at a lower price, HelloGrowthCRM is the better fit.",
    faqQuestions: [
      "Can HelloGrowthCRM replace both Insightly CRM and Insightly projects?",
      "How do I migrate from Insightly?",
      "Is HelloGrowthCRM cheaper than Insightly?",
      "Does HelloGrowthCRM have a free plan?",
      "Does HelloGrowthCRM work for B2B teams like Insightly?",
    ],
  },
  {
    slug: "vtiger",
    name: "vTiger",
    h1: "Switch from vTiger to HelloGrowthCRM",
    tagline: "vTiger was built for 2004. Your sales team needs a 2026 CRM.",
    reasons: [
      { title: "10x Cheaper, More Features Included", desc: "vTiger One charges ₹3,500/user/month. HelloGrowthCRM is ₹99/user/month with AI scoring, WhatsApp, and dialer included — not as paid add-ons." },
      { title: "Native WhatsApp — No Add-Ons", desc: "vTiger requires a third-party WhatsApp connector that breaks with every vTiger update. HelloGrowthCRM's WhatsApp integration is native, always on, and included." },
      { title: "15-Minute Setup vs Months of Customisation", desc: "vTiger is built for IT teams to configure over weeks. HelloGrowthCRM works out of the box — pipeline, automation, and WhatsApp configured in one onboarding session." },
      { title: "Tally Sync Built In", desc: "vTiger has no Tally integration. HelloGrowthCRM syncs customer records, invoice status, and outstanding balances with Tally — critical for Indian SMBs." },
    ],
    featureRows: [
      ["AI Lead Scoring", "Included", "Paid add-on only"],
      ["WhatsApp Business API", "Native, included", "Third-party connector, extra cost"],
      ["Tally Integration", "Yes — bidirectional sync", "Not available"],
      ["GSTIN/PAN Verification", "Built-in", "Not available"],
      ["Mobile App Quality", "Modern, fast", "Dated, slow"],
      ["Onboarding Time", "15 minutes", "Weeks of customisation"],
      ["India Support (IST)", "Yes, dedicated", "Limited"],
      ["Base Price (India)", "₹99/user/month", "₹3,500/user/month"],
    ],
    migrationSteps: [
      "Export from vTiger: Go to vTiger Settings → Data Management → Export. Export Contacts, Organisations, Leads, and Deals as CSV files. This takes about 10 minutes.",
      "Import to HelloGrowthCRM: Upload each CSV in HelloGrowthCRM → Contacts → Import. The importer auto-maps vTiger field names. Custom modules become custom fields in HelloGrowthCRM.",
      "Configure Automation: Recreate your vTiger workflows as HelloGrowthCRM automation sequences — typically 30 minutes. Our migration team provides a workflow mapping template.",
    ],
    verdict: "vTiger is a legacy open-source CRM that served Indian SMBs well in the 2000s. HelloGrowthCRM is built for the WhatsApp-first, AI-assisted sales team of 2026. Most teams complete the migration in under 2 days.",
    faqQuestions: [
      "How long does migrating from vTiger take?",
      "Does HelloGrowthCRM replace vTiger's workflow automation?",
      "What about vTiger's open-source version — is it better?",
      "Does HelloGrowthCRM have vTiger's help desk module?",
      "What does HelloGrowthCRM cost compared to vTiger?",
    ],
  },
  {
    slug: "bitrix24",
    name: "Bitrix24",
    h1: "Switch from Bitrix24 to HelloGrowthCRM",
    tagline: "Bitrix24 has 35 features. You need 10. HelloGrowthCRM has the right 10.",
    reasons: [
      { title: "CRM-First, Not Everything-App", desc: "Bitrix24 bundles CRM with project management, HR, websites, and internal comms. The result is a complex tool most sales teams never fully learn. HelloGrowthCRM does sales CRM and does it well." },
      { title: "WhatsApp Included at Base Price", desc: "Bitrix24 charges extra for WhatsApp Business API. HelloGrowthCRM includes native WhatsApp sending, templates, and bulk broadcasts in all paid plans." },
      { title: "5-Minute Setup vs Days of Configuration", desc: "Bitrix24 requires configuration of CRM, deals, pipelines, roles, and integrations before it is usable. HelloGrowthCRM has a working pipeline in 5 minutes." },
      { title: "India-Specific Features Bitrix24 Lacks", desc: "Bitrix24 has no Tally integration, no GSTIN/PAN verification, and no Hindi interface. HelloGrowthCRM is built for Indian SMBs with all three included." },
    ],
    featureRows: [
      ["Tally Integration", "Yes — bidirectional", "Not available"],
      ["WhatsApp Business API", "Native, all plans", "Paid add-on"],
      ["AI Lead Scoring", "Included", "Not available"],
      ["Setup Time", "5 minutes", "1–3 days"],
      ["CRM Complexity", "Sales-focused, simple", "Overwhelming (35+ modules)"],
      ["GSTIN/PAN Verification", "Built-in", "Not available"],
      ["India Support (IST)", "Yes", "No dedicated India support"],
      ["Free Plan", "200 contacts, forever", "Free but feature-gated"],
    ],
    migrationSteps: [
      "Export from Bitrix24: In Bitrix24, go to CRM → Settings → Data Export. Export contacts, companies, deals, and activities as CSV. The export wizard walks you through each module.",
      "Import into HelloGrowthCRM: Upload CSVs in HelloGrowthCRM's import wizard. Field mapping handles Bitrix24's standard field names automatically. Activities and deal notes are importable via the notes import.",
      "Recreate Automations: Map your Bitrix24 business processes to HelloGrowthCRM automation sequences. Most Bitrix24 CRM automations have a direct equivalent — our team provides a migration template.",
    ],
    verdict: "Bitrix24's free plan wins teams over with no upfront cost, then loses them to complexity, unexpected upgrade walls, and the chaos of a bloated tool. HelloGrowthCRM is the focused CRM for teams who tried Bitrix24, used 20% of its features, and want something that does sales well without the noise.",
    faqQuestions: [
      "Can HelloGrowthCRM replace Bitrix24's project management features?",
      "How long does migrating from Bitrix24 take?",
      "Does HelloGrowthCRM have a free plan like Bitrix24?",
      "What about Bitrix24's internal team messaging?",
      "Is Bitrix24 free plan really free?",
    ],
  },
  {
    slug: "close-crm",
    name: "Close CRM",
    h1: "Switch from Close CRM to HelloGrowthCRM",
    tagline: "Close CRM is built for US SaaS outbound. HelloGrowthCRM is built for every market.",
    reasons: [
      { title: "5x Cheaper With More Features", desc: "Close CRM Startup plan costs $49/user/month. HelloGrowthCRM costs ₹899/user/mo with AI lead scoring, WhatsApp, and a built-in dialer. A 10-person team saves $4,680/year." },
      { title: "WhatsApp + Dialer in One Platform", desc: "Close CRM has a built-in dialer but no WhatsApp support. HelloGrowthCRM includes both — native WhatsApp API and a sales dialer — in the same platform." },
      { title: "AI Lead Scoring Built In", desc: "Close CRM has no AI lead scoring. HelloGrowthCRM scores every lead by close probability using AI enrichment and engagement signals, so your team calls the hottest leads first." },
      { title: "India and Emerging Market Ready", desc: "Close CRM is US-centric — no Tally, no GSTIN, no INR pricing, no multilingual support. HelloGrowthCRM is built for India and global markets." },
    ],
    featureRows: [
      ["AI Lead Scoring", "Yes — included", "Not available"],
      ["WhatsApp Business API", "Native, included", "Not available"],
      ["Built-in Sales Dialer", "Yes", "Yes"],
      ["Tally Integration", "Yes", "Not available"],
      ["INR / Local Pricing", "₹99/user/month", "USD only, $49+/user"],
      ["Multilingual (Hindi etc.)", "Yes", "English only"],
      ["Free Plan", "200 contacts forever", "No free plan"],
      ["India Data Hosting", "Available", "US-only"],
    ],
    migrationSteps: [
      "Export from Close CRM: In Close CRM, go to Settings → Export Data. Export your contacts, leads, opportunities, and activities. Close exports clean CSV files that map well to HelloGrowthCRM.",
      "Import into HelloGrowthCRM: Use HelloGrowthCRM's import wizard to upload your Close CRM exports. Contact, company, and deal records import in minutes. Email sequences and call logs import as activities.",
      "Set Up Sequences and Dialer: Recreate your Close CRM email sequences as HelloGrowthCRM automation flows. Configure the dialer with your business number. Total setup time: approximately 2 hours.",
    ],
    verdict: "Close CRM is excellent for US-based SaaS teams running high-volume cold outbound. It is expensive and lacks WhatsApp, AI scoring, and India-specific features. HelloGrowthCRM is the natural choice for teams in India or global markets where WhatsApp is the primary sales channel.",
    faqQuestions: [
      "How long does it take to migrate from Close CRM?",
      "Does HelloGrowthCRM match Close CRM's calling features?",
      "How does HelloGrowthCRM's WhatsApp work where Close CRM has none?",
      "Is there a free plan to evaluate before switching?",
      "We use Close CRM for outbound email sequences. Does HelloGrowthCRM match that?",
    ],
  },
  {
    slug: "airtable",
    name: "Airtable",
    h1: "Switch from Airtable to HelloGrowthCRM",
    tagline: "Airtable is a beautiful spreadsheet. Your pipeline needs a real CRM.",
    reasons: [
      { title: "Automated Follow-Ups Airtable Cannot Do", desc: "Airtable stores your contacts but cannot send a WhatsApp message when a lead goes cold. HelloGrowthCRM automates follow-up sequences so no lead goes quiet without a touchpoint." },
      { title: "AI Lead Scoring Out of the Box", desc: "Airtable requires complex Zapier integrations to get near lead scoring. HelloGrowthCRM scores every lead by close probability natively — no integrations, no maintenance." },
      { title: "Native WhatsApp Without Zapier", desc: "Connecting WhatsApp to Airtable requires 3–4 tools and breaks constantly. HelloGrowthCRM includes WhatsApp Business API natively — every conversation logged automatically." },
      { title: "Built for Sales Teams, Not Ops Teams", desc: "Airtable is built for operations and databases. HelloGrowthCRM is built for sales — pipeline stages, deal values, activity timelines, and team quotas are first-class features." },
    ],
    featureRows: [
      ["Automated Follow-Up Sequences", "Yes — built in", "Requires Zapier + 3rd party"],
      ["AI Lead Scoring", "Yes — included", "Not available natively"],
      ["WhatsApp Integration", "Native", "Third-party workaround"],
      ["Sales Pipeline View", "Kanban + list + forecast", "Grid view only"],
      ["Built-in Sales Dialer", "Yes", "Not available"],
      ["CRM-Native Activity Timeline", "Yes", "Manual entry only"],
      ["Free Plan for CRM Use", "200 contacts, forever", "Free but not CRM-native"],
      ["India Features (Tally, GSTIN)", "Yes", "Not available"],
    ],
    migrationSteps: [
      "Export from Airtable: In your Airtable CRM base, click the grid view and select Download CSV. Export each table (Contacts, Deals, Companies) separately. The CSV will have all your column data intact.",
      "Import into HelloGrowthCRM: Go to HelloGrowthCRM → Contacts → Import CSV. Upload your Airtable export. The importer maps your column headers to HelloGrowthCRM fields. Custom Airtable fields become custom CRM fields.",
      "Set Up Automation: Recreate your Airtable automations as HelloGrowthCRM native sequences — without Zapier. Follow-up, WhatsApp, email sequences, and task creation all work natively.",
    ],
    verdict: "Airtable is excellent for operations, content calendars, and databases. As a CRM it has fundamental gaps — no automated follow-up, no native WhatsApp, no AI scoring, no sales-native pipeline. Teams who outgrow their Airtable CRM base typically switch to HelloGrowthCRM because the migration is simple and the sales automation capabilities are immediately useful.",
    faqQuestions: [
      "How do I export my Airtable CRM to HelloGrowthCRM?",
      "Can HelloGrowthCRM replace my Airtable automations?",
      "We built a complex Airtable CRM with linked records. Will we lose that structure?",
      "Does HelloGrowthCRM work for teams that like Airtable's flexibility?",
      "What does HelloGrowthCRM cost compared to Airtable?",
    ],
  },
  {
    slug: "notion",
    name: "Notion",
    h1: "Switch from Notion CRM to HelloGrowthCRM",
    tagline: "Notion is a great wiki. Your customers deserve a real CRM.",
    reasons: [
      { title: "Automated Follow-Up Sequences", desc: "Notion cannot send a follow-up email or WhatsApp when a lead goes quiet. HelloGrowthCRM sends automated sequences on a schedule — so every lead gets contacted even when your team is busy." },
      { title: "AI Prioritisation of Your Pipeline", desc: "Notion has no lead scoring. HelloGrowthCRM's AI scores every lead by close probability, so your team spends time on the most likely deals instead of working through a flat database." },
      { title: "Team Visibility and Notifications", desc: "Notion lacks deal-stage notifications, team assignment alerts, and pipeline health dashboards. HelloGrowthCRM gives every sales rep and manager a real-time view of the pipeline." },
      { title: "WhatsApp and Dialer Built In", desc: "Connecting WhatsApp to Notion requires three tools and breaks on every API update. HelloGrowthCRM includes native WhatsApp and a sales dialer — all inside the same platform." },
    ],
    featureRows: [
      ["Automated Follow-Up", "Yes — built in", "Not available natively"],
      ["AI Lead Scoring", "Yes — included", "Not available"],
      ["WhatsApp Integration", "Native", "Third-party required"],
      ["Sales Pipeline View", "Kanban + forecasting", "Kanban only (no deal values)"],
      ["Built-in Sales Dialer", "Yes", "Not available"],
      ["Team Activity Notifications", "Yes — real-time", "Manual @mentions only"],
      ["Revenue Forecasting", "AI-powered", "Not available"],
      ["Free Plan", "200 contacts forever", "Free but not CRM-native"],
    ],
    migrationSteps: [
      "Export from Notion: In your Notion customer database, click the three dots then Export then CSV. Export each database (Contacts, Companies, Deals) separately. Notion exports clean CSVs with all your properties.",
      "Import into HelloGrowthCRM: Upload each CSV in HelloGrowthCRM → Contacts → Import. The importer maps Notion property names to CRM fields automatically. Tags, statuses, and custom properties become custom fields.",
      "Build Your First Automation: Create a simple follow-up sequence: if a lead does not respond in 3 days, send a WhatsApp. This single automation recovers more leads than your entire Notion CRM could — and takes 5 minutes to set up.",
    ],
    verdict: "Notion is a powerful knowledge management tool that many early-stage teams repurpose as a CRM because it is familiar and free. The core problem is that Notion is passive — it stores data but does not act on it. HelloGrowthCRM is active: it sends follow-ups, scores leads, dispatches notifications, and forecasts revenue without anyone manually checking the database.",
    faqQuestions: [
      "How do I move my Notion customer database to HelloGrowthCRM?",
      "We use Notion for everything — do we have to replace it entirely?",
      "Notion has a free plan. What does HelloGrowthCRM's free plan offer?",
      "Can HelloGrowthCRM do what my Notion automations do via Zapier?",
      "Is HelloGrowthCRM suitable for early-stage startups who use Notion as their CRM?",
    ],
  },
  {
    slug: "go-high-level",
    name: "GoHighLevel",
    h1: "Switch from GoHighLevel to HelloGrowthCRM",
    tagline: "GoHighLevel is a marketing agency platform. HelloGrowthCRM is a sales CRM built for your team.",
    reasons: [
      { title: "Built for sales teams, not agencies", desc: "GoHighLevel's sub-account model and funnel builder are designed for agencies managing client campaigns. HelloGrowthCRM is built for sales reps — pipeline, leads, calling, and WhatsApp in one focused tool." },
      { title: "Indian integrations out of the box", desc: "GoHighLevel has no IndiaMART, JustDial, or Razorpay integrations. HelloGrowthCRM captures leads directly from IndiaMART and JustDial and syncs payments via Razorpay — essential for Indian SMBs." },
      { title: "Transparent per-user pricing", desc: "GoHighLevel charges $97–$297/month flat regardless of team size — expensive for small teams and confusing to scale. HelloGrowthCRM is ₹99/user/month with no hidden per-location or per-sub-account fees." },
      { title: "15-minute setup without an onboarding consultant", desc: "GoHighLevel's learning curve takes weeks — funnels, workflows, triggers, sub-accounts. HelloGrowthCRM has a working sales pipeline in 15 minutes with guided onboarding." },
    ],
    featureRows: [
      ["Designed for", "Sales teams — pipeline, leads, deals", "Agencies managing client funnels"],
      ["IndiaMART / JustDial integration", "Yes — native lead capture", "Not available"],
      ["Razorpay payment sync", "Yes — included", "Not available"],
      ["AI lead scoring", "Included in all plans", "Not available natively"],
      ["Native WhatsApp CRM", "Yes — included", "Via WhatsApp integration (US-centric)"],
      ["Built-in dialer", "Yes — click-to-call with AI summaries", "Yes — US/Canada VoIP focused"],
      ["Pricing", "From ₹99/user/month", "$97–$297/month flat (not per-user)"],
      ["Setup time", "15 minutes", "Days to weeks with full configuration"],
    ],
    migrationSteps: [
      "Export your contacts from GoHighLevel: go to Contacts → Bulk Actions → Export CSV. Download all contacts and opportunities.",
      "Import into HelloGrowthCRM: go to Leads → Import → Upload CSV. The import wizard maps GoHighLevel's standard field names (First Name, Last Name, Email, Phone, Pipeline Stage) automatically.",
      "Recreate your automations as HelloGrowthCRM workflows — follow-up sequences, WhatsApp triggers, and lead assignment rules. Most GoHighLevel CRM workflows have a direct equivalent. Setup typically takes 2–4 hours.",
    ],
    verdict: "GoHighLevel is a powerful platform for digital marketing agencies running client campaigns. If you are a sales team — not an agency — paying for a tool designed around sub-accounts and funnel builders, HelloGrowthCRM gives you everything you actually use: pipeline management, AI lead scoring, WhatsApp, and a dialer, without the agency overhead.",
    faqQuestions: [
      "Is GoHighLevel a CRM or a marketing tool?",
      "Can HelloGrowthCRM replace GoHighLevel for an Indian sales team?",
      "How much does GoHighLevel actually cost vs HelloGrowthCRM?",
      "How do I migrate my GoHighLevel contacts to HelloGrowthCRM?",
      "Does HelloGrowthCRM have GoHighLevel's automation builder?",
    ],
  },
  {
    slug: "activecampaign",
    name: "ActiveCampaign",
    h1: "Switch from ActiveCampaign to HelloGrowthCRM",
    tagline: "ActiveCampaign is email marketing with a CRM bolted on. HelloGrowthCRM is a CRM first.",
    reasons: [
      { title: "Sales CRM as the primary product", desc: "ActiveCampaign was built as an email marketing tool. Its CRM is a secondary module with limited pipeline depth. HelloGrowthCRM is CRM-first — pipeline management, AI scoring, and sales automation are the core product." },
      { title: "Built-in dialer with AI call summaries", desc: "ActiveCampaign has no built-in calling. HelloGrowthCRM includes a native click-to-call dialer with recording, AI call summaries, and voicemail drop — all linked to the lead record." },
      { title: "Native WhatsApp — not an email-first channel", desc: "ActiveCampaign does not have a native WhatsApp CRM inbox. HelloGrowthCRM's WhatsApp integration is fully native — two-way conversations, broadcast campaigns, and automation sequences built in." },
      { title: "Flat per-user pricing — no contact tier jumps", desc: "ActiveCampaign charges by contact count — your bill doubles when you hit 5,000 or 25,000 contacts. HelloGrowthCRM charges per user with unlimited leads, so your costs are predictable as you grow." },
    ],
    featureRows: [
      ["Primary product focus", "Sales CRM — pipeline, AI scoring, calling", "Email marketing automation"],
      ["Built-in sales dialer", "Yes — click-to-call, recording, AI summaries", "Not available"],
      ["Native WhatsApp CRM", "Yes — two-way inbox, broadcasts", "Not available natively"],
      ["AI lead scoring", "Included in all plans", "Contact scoring — email engagement only"],
      ["Pricing model", "Per user — unlimited contacts", "Per contact tier — price jumps at thresholds"],
      ["Pipeline management depth", "Kanban + AI forecasting + deal health", "Basic deal CRM — limited pipeline views"],
      ["India / INR pricing", "₹99/user/month", "USD only — no INR pricing"],
      ["Free plan", "Yes — 200 leads forever", "14-day trial only"],
    ],
    migrationSteps: [
      "Export from ActiveCampaign: go to Contacts → Export. Select all fields and download as CSV. Export deal/pipeline data separately under Deals → Export.",
      "Import into HelloGrowthCRM: use Leads → Import to upload your contacts CSV. The import wizard maps ActiveCampaign field names (First Name, Last Name, Email, Phone, Tags, Status) to HelloGrowthCRM fields automatically.",
      "Recreate your automations as HelloGrowthCRM sequences: map your ActiveCampaign email sequences to multi-step workflows with email, WhatsApp, and call steps. Configure the dialer and invite your sales team — most teams are fully live in 1–2 days.",
    ],
    verdict: "ActiveCampaign is one of the best email marketing automation tools available. As a sales CRM it has significant gaps — no dialer, no WhatsApp, contact-count pricing that escalates unpredictably, and a pipeline module that was clearly not the primary design focus. If your team needs a genuine sales CRM with calling, WhatsApp, and AI scoring, HelloGrowthCRM is the cleaner choice.",
    faqQuestions: [
      "Is ActiveCampaign a CRM or an email marketing tool?",
      "Why does ActiveCampaign's pricing become expensive?",
      "How do I migrate from ActiveCampaign to HelloGrowthCRM?",
      "Does HelloGrowthCRM match ActiveCampaign's email automation?",
      "Can I keep using ActiveCampaign for marketing while switching CRM to HelloGrowthCRM?",
    ],
  },
  {
    slug: "keap",
    name: "Keap",
    h1: "Switch from Keap to HelloGrowthCRM",
    tagline: "Keap charges $299/month for 2 users. HelloGrowthCRM costs ₹99/user/month with more features.",
    reasons: [
      { title: "97% cheaper with a better feature set", desc: "Keap Pro costs $299/month for 2 users — $149.50 per user. HelloGrowthCRM includes AI lead scoring, a built-in dialer, and WhatsApp from ₹99/user/month. A 5-person team saves over $8,000/year." },
      { title: "Built for Indian SMBs — not just US small businesses", desc: "Keap is designed exclusively for US small businesses — USD pricing, US phone integrations, no IndiaMART or JustDial, no Tally or GST compliance. HelloGrowthCRM is built for Indian markets with local integrations included." },
      { title: "Native WhatsApp — the channel Keap doesn't have", desc: "Keap has no WhatsApp support. HelloGrowthCRM includes native two-way WhatsApp with broadcast campaigns, automation sequences, and all conversations linked to the lead record." },
      { title: "Simple automation without a certification required", desc: "Keap's Campaign Builder is powerful but famously steep. Many teams hire Keap-certified consultants just to set up basic automations. HelloGrowthCRM's automation builder is visual, intuitive, and requires no external help." },
    ],
    featureRows: [
      ["Pricing", "From ₹99/user/month — all features", "$299/month for 2 users ($149.50/user)"],
      ["WhatsApp CRM", "Native — two-way inbox, broadcasts", "Not available"],
      ["AI lead scoring", "Included in all plans", "Not available"],
      ["Built-in dialer", "Yes — click-to-call, AI summaries", "US/Canada calling — additional cost"],
      ["India integrations (IndiaMART, Tally)", "Yes — native", "Not available"],
      ["Setup complexity", "15 minutes — no consultant needed", "Complex — often requires certified partner"],
      ["Free plan", "Yes — 200 leads, no credit card", "No free plan"],
      ["INR pricing", "₹99/user/month", "USD only"],
    ],
    migrationSteps: [
      "Export from Keap: go to Contacts → Export → All Contacts to CSV. Export Deals and Opportunities separately under Reports → Exports.",
      "Import into HelloGrowthCRM: upload your contacts CSV at Leads → Import. The wizard auto-maps Keap's standard field names including First Name, Last Name, Email, Phone, Tags, and Contact Type.",
      "Recreate key automations: map your Keap campaign steps to HelloGrowthCRM automation sequences. Email follow-up, task creation, lead assignment, and WhatsApp triggers all have native equivalents. Most teams complete the switch in 2–3 days.",
    ],
    verdict: "Keap (formerly Infusionsoft) is a US-market CRM with deep automation capabilities at a high price point. For Indian SMBs, it has three fundamental problems: no WhatsApp, no Indian integrations, and pricing that starts at $299/month before your third user joins. HelloGrowthCRM delivers the same sales automation at a fraction of the cost, with the WhatsApp and Indian integrations that Keap simply does not have.",
    faqQuestions: [
      "Why is Keap so expensive compared to other CRMs?",
      "Does Keap work for Indian businesses?",
      "How hard is the migration from Keap?",
      "Does HelloGrowthCRM match Keap's automation depth?",
      "What happens to my Keap campaign history when I switch?",
    ],
  },
  {
    slug: "kommo",
    name: "Kommo",
    h1: "Switch from Kommo to HelloGrowthCRM",
    tagline: "Kommo handles WhatsApp. HelloGrowthCRM handles WhatsApp, calling, AI scoring, and your pipeline.",
    reasons: [
      { title: "Full CRM — not just a messaging hub", desc: "Kommo is built around consolidating messenger conversations. HelloGrowthCRM includes all of that plus a full sales pipeline, AI lead scoring, deal forecasting, and activity tracking — a complete CRM, not just a chat inbox." },
      { title: "Built-in dialer Kommo doesn't have", desc: "Kommo has no built-in calling. HelloGrowthCRM includes a native click-to-call dialer with call recording, AI call summaries, and post-call automation — all linked to the same lead record as your WhatsApp messages." },
      { title: "AI lead scoring to prioritise your pipeline", desc: "Kommo has no AI lead scoring. HelloGrowthCRM scores every lead by close probability using AI enrichment and engagement signals — so your team works the hottest leads first, not just the most recent WhatsApp message." },
      { title: "Managed RevOps — execution, not just software", desc: "Kommo is self-serve software with no done-for-you option. HelloGrowthCRM's Growth Engine gives you a dedicated RevOps specialist who runs your pipeline, sequences, and outreach — ideal for teams who want results, not just tools." },
    ],
    featureRows: [
      ["Primary strength", "Full sales CRM — pipeline, AI, calling, WhatsApp", "Messenger consolidation (WhatsApp, Instagram, etc.)"],
      ["Built-in sales dialer", "Yes — click-to-call, recording, AI summaries", "Not available"],
      ["AI lead scoring", "Included in all plans", "Not available"],
      ["Pipeline management", "Kanban + list + AI deal forecasting", "Kanban — basic pipeline"],
      ["Lead enrichment", "Yes — AI enrichment from multiple signals", "Not available"],
      ["Managed RevOps", "Growth Engine — dedicated specialist", "Not available"],
      ["India pricing (INR)", "₹99/user/month", "USD only — $15+/user/month"],
      ["IndiaMART / JustDial integration", "Yes — native lead capture", "Not available"],
    ],
    migrationSteps: [
      "Export from Kommo: go to Settings → Data → Export. Download contacts and deals as CSV files. Kommo exports standard field sets including name, email, phone, pipeline stage, and responsible user.",
      "Import into HelloGrowthCRM: upload your Kommo CSV at Leads → Import. The import wizard maps Kommo's contact and deal fields automatically. WhatsApp conversation history is not transferable but all lead records come across cleanly.",
      "Enable WhatsApp and the dialer: connect your WhatsApp Business API number and configure your dialer in HelloGrowthCRM settings. Your team gets a single inbox for WhatsApp and calls — plus the full CRM pipeline — in one place.",
    ],
    verdict: "Kommo solves a real problem — consolidating messenger conversations into a CRM view. But once your team needs to call leads, score them by quality, forecast revenue, or get hands-on RevOps support, Kommo's scope ends and the gaps start. HelloGrowthCRM includes Kommo's messaging strengths plus the dialer, AI scoring, and RevOps execution layer that growing sales teams need.",
    faqQuestions: [
      "Does HelloGrowthCRM have the same WhatsApp features as Kommo?",
      "Can HelloGrowthCRM handle Instagram and other messengers like Kommo?",
      "Why switch from Kommo if WhatsApp is already working?",
      "How do I migrate from Kommo without losing my contact history?",
      "Is HelloGrowthCRM cheaper than Kommo?",
    ],
  },
  {
    slug: "streak",
    name: "Streak CRM",
    h1: "Switch from Streak CRM to HelloGrowthCRM",
    tagline: "Upgrade from a Gmail plugin to a real CRM with AI, dialer, and WhatsApp.",
    reasons: [
      { title: "A real standalone CRM", desc: "Streak lives inside Gmail. HelloGrowthCRM is a dedicated CRM with its own app, mobile client, and pipeline view that works independently of your email client." },
      { title: "Built-in dialer", desc: "Streak has no dialer. HelloGrowthCRM includes click-to-call, recording, and AI call summaries so your sales team can call, log, and follow up without switching tools." },
      { title: "AI lead scoring", desc: "Streak has no AI lead prioritisation. HelloGrowthCRM scores every lead automatically so your team focuses on the highest-value opportunities first." },
      { title: "Native WhatsApp messaging", desc: "Streak has no WhatsApp integration. HelloGrowthCRM includes native two-way WhatsApp linked to every lead and deal." },
    ],
    featureRows: [
      ["Pricing", "From ₹899/user/mo", "Solo $15/mo; Pro $49/user/mo"],
      ["Standalone app", "Yes — full CRM outside Gmail", "No — Gmail sidebar only"],
      ["Built-in dialer", "Included — click to call, AI summaries", "No dialer"],
      ["AI lead scoring", "Included in all plans", "No AI lead scoring"],
      ["WhatsApp CRM", "Native two-way WhatsApp", "No WhatsApp integration"],
      ["Mobile app", "Dedicated iOS and Android app", "Gmail mobile app dependency"],
      ["Team collaboration", "Shared pipeline, role-based access", "Shared pipelines — limited permissions"],
      ["Free plan", "Yes — up to 200 leads", "Free tier — very limited (1 pipeline only)"],
    ],
    migrationSteps: [
      "Export your Streak pipelines: open a pipeline in Streak, click Export, and download as CSV. Repeat for each pipeline.",
      "Import into HelloGrowthCRM under Leads then Import. Map your Streak columns to HelloGrowthCRM fields using the import wizard.",
      "Recreate your pipeline stages, configure WhatsApp and email automations, and invite your team.",
    ],
    verdict: "HelloGrowthCRM is the best Streak CRM alternative for growing sales teams that have outgrown a Gmail sidebar. You get a purpose-built CRM with a standalone app, AI lead scoring, a built-in dialer, and native WhatsApp at a price that beats Streak Pro by over $39 per user per month.",
    faqQuestions: [
      "Why switch from Streak to HelloGrowthCRM?",
      "How do I export my data from Streak?",
      "Is HelloGrowthCRM cheaper than Streak Pro?",
      "Does HelloGrowthCRM work if my team uses Gmail?",
      "Can Streak users adapt quickly to HelloGrowthCRM?",
    ],
  },
  {
    slug: "kylas",
    name: "Kylas CRM",
    h1: "Switch from Kylas CRM to HelloGrowthCRM",
    tagline: "Move from a conventional India CRM to an AI-first CRM with WhatsApp, dialer, and simpler pricing.",
    reasons: [
      { title: "Lower per-user cost", desc: "Kylas is priced for growing Indian sales teams, but HelloGrowthCRM keeps the entry price lower while including core CRM, WhatsApp, calling, and AI features." },
      { title: "Built-in dialer and call context", desc: "HelloGrowthCRM includes click-to-call workflows, call logging, and AI call summaries so reps can work leads without jumping between phone tools." },
      { title: "AI lead scoring from day one", desc: "HelloGrowthCRM prioritises leads using engagement and pipeline signals, helping teams call the hottest opportunities first." },
      { title: "WhatsApp-first follow-up", desc: "Two-way WhatsApp conversations, templates, and follow-up sequences live directly on the lead and deal timeline." },
    ],
    featureRows: [
      ["Pricing", "From Rs.99/user/month, free plan available", "Higher paid tiers for growing teams"],
      ["WhatsApp CRM", "Native two-way WhatsApp plus sequences", "WhatsApp support available"],
      ["Built-in dialer", "Included with call logging and summaries", "Often requires separate telephony setup"],
      ["AI lead scoring", "Included", "Limited AI-led prioritisation"],
      ["Migration support", "Free CSV import and onboarding help", "Manual export/import required"],
      ["India integrations", "Razorpay, Tally, IndiaMART, JustDial workflows", "India-focused CRM basics"],
      ["Setup time", "Same-day setup for most teams", "Depends on pipeline and role configuration"],
      ["RevOps support", "Optional managed RevOps available", "Software-first implementation"],
    ],
    migrationSteps: [
      "Export contacts, leads, deals, and activities from Kylas as CSV files from the relevant list views or reports.",
      "Import each CSV into HelloGrowthCRM using Leads -> Import and Deals -> Import; map Kylas fields to matching CRM fields or create custom fields during import.",
      "Recreate your pipeline stages, connect WhatsApp and calling, invite users, and run both systems in parallel for a short validation window before switching fully.",
    ],
    verdict: "Kylas is a capable India-focused CRM, but HelloGrowthCRM is a better fit for teams that want lower entry pricing, built-in calling, WhatsApp-first follow-up, AI lead scoring, and hands-on migration support in one simpler system.",
    faqQuestions: [
      "Can I migrate Kylas CRM data to HelloGrowthCRM?",
      "Is HelloGrowthCRM cheaper than Kylas?",
      "Does HelloGrowthCRM support WhatsApp like Kylas?",
      "How long does switching from Kylas take?",
      "Will my Kylas custom fields transfer?",
    ],
  },
  {
    slug: "jira",
    name: "Jira",
    h1: "Your Devs Use Jira. Your Sales Team Deserves a Real CRM.",
    tagline: "Your devs use Jira. Your sales and ops teams deserve a CRM — with WhatsApp, Kanban, and a built-in dialer, all in one India-first platform.",
    reasons: [
      { title: "Built for sales teams, not engineering sprints", desc: "Jira's sprint model is designed for developers. HelloGrowthCRM gives your sales and ops teams a purpose-built pipeline with Kanban, leads, deals, and WhatsApp — not dev tickets and epics." },
      { title: "₹899 vs ₹750 — but HelloGrowthCRM includes a full CRM", desc: "Jira Standard costs ~₹750/user/month with zero CRM, no WhatsApp, and no dialer. HelloGrowthCRM is ₹899/user/month with full CRM, project management, WhatsApp, and calling in one plan." },
      { title: "Set up in 30 minutes, not 30 days", desc: "Jira takes weeks to configure for non-technical teams. HelloGrowthCRM has a working sales pipeline, WhatsApp inbox, and dialer live in 30 minutes — no admin training or consultant required." },
      { title: "India-first: GST invoices, INR billing, IndiaMART leads", desc: "Jira has no INR billing, no GST invoice, and no Indian lead-source integrations. HelloGrowthCRM is built for India — Tally sync, IndiaMART/JustDial lead capture, and DPDPA compliance included." },
    ],
    featureRows: [
      ["Pricing (India)", "₹899/user/month — CRM + PM + WhatsApp + Dialer", "~₹750/user/month — project management only, no CRM"],
      ["CRM / lead pipeline", "Yes — full pipeline with AI scoring", "Not available"],
      ["WhatsApp Business", "Native — two-way conversations + templates", "Not available"],
      ["Built-in dialer", "Yes — click-to-call, recording, AI summaries", "Not available"],
      ["Project management / Kanban", "Yes — tasks, sprints, boards", "Yes — Jira's core feature"],
      ["Onboarding time", "30 minutes — guided self-serve", "Weeks for non-technical teams"],
      ["INR billing + GST invoice", "Yes — fully India-compliant", "USD billing only, no GST invoice"],
      ["IndiaMART / JustDial leads", "Yes — auto-captured into pipeline", "Not available"],
    ],
    migrationSteps: [
      "Export your Jira data: go to the relevant Jira project → Issues → Export as CSV. This captures current tasks, assignees, statuses, and any contact data your team has stored in issue fields.",
      "Import into HelloGrowthCRM: upload the CSV at Leads → Import. Map Jira field names (Summary, Reporter, Assignee, Status) to HelloGrowthCRM pipeline fields. Contacts and deals are live immediately.",
      "Set up your sales pipeline: recreate your Jira stages as HelloGrowthCRM pipeline stages, connect WhatsApp Business API and your calling number, and invite your sales team. You're fully live in under a day.",
    ],
    verdict: "Jira is the right tool for your developers. HelloGrowthCRM is the right tool for your sales, client success, and ops teams — with CRM, WhatsApp, dialer, and project management in one India-first platform at ₹899/user/month.",
    faqQuestions: [
      "Is Jira a CRM?",
      "Can HelloGrowthCRM replace Jira for both project management and CRM?",
      "How much does HelloGrowthCRM cost compared to Jira for a sales team?",
      "Does HelloGrowthCRM have Jira's Kanban and board features?",
      "We're an IT services company — can HelloGrowthCRM handle both client projects and sales pipeline?",
    ],
  },
  {
    slug: "trello",
    name: "Trello",
    h1: "Trello Gives You Boards. We Give You Boards + CRM + WhatsApp.",
    tagline: "Trello shows you the pipeline. HelloGrowthCRM works the pipeline — with CRM, WhatsApp, and AI scoring built in.",
    reasons: [
      { title: "Full CRM that Trello simply doesn't have", desc: "Trello has no contacts, no deal values, no pipeline forecasting, and no AI lead scoring. HelloGrowthCRM is a complete sales CRM — contacts, deals, AI scoring, and pipeline analytics — with Kanban boards included." },
      { title: "Native WhatsApp at no extra cost", desc: "Trello has no WhatsApp integration on any plan. HelloGrowthCRM includes native two-way WhatsApp — conversations logged against leads automatically, broadcast campaigns, and sequence automation." },
      { title: "Free-plan limits you hit in week 3", desc: "Trello free caps at 10 boards and 10 users. Butler automations exhaust their monthly quota in days. HelloGrowthCRM's free plan has unlimited boards, pipelines, and automation for up to 200 leads." },
      { title: "INR billing with GST invoice every cycle", desc: "Trello bills in USD with no GST invoice. HelloGrowthCRM charges ₹899/user/month with a GST-compliant tax invoice every billing cycle — required for Indian business accounting and input tax credit." },
    ],
    featureRows: [
      ["Sales CRM (contacts, pipeline, deals)", "Full CRM — AI scoring, pipeline, forecasting", "Not available — Trello is PM-only"],
      ["Kanban boards", "Yes — unlimited boards + swimlanes", "Yes — Kanban only"],
      ["Sprint + burndown + time tracking", "Yes — built in", "Not available natively"],
      ["WhatsApp CRM", "Native — no third-party required", "Not available on any plan"],
      ["IndiaMART / JustDial lead import", "Yes — native lead capture", "Not available"],
      ["Built-in dialer", "Yes — click-to-call, recording, AI summaries", "Not available"],
      ["AI lead scoring", "Included in all plans", "Not available"],
      ["INR billing + GST invoice", "₹899/user/month — GST-compliant", "USD only — no GST invoice"],
      ["Automation quota", "Unlimited on all paid plans", "Free: 250 runs/month; Standard: limited"],
    ],
    migrationSteps: [
      "Export from Trello: Open each board you use as a sales pipeline → Board Menu → More → Print and Export → Export as JSON. Use a free Trello-to-CSV tool to convert to a spreadsheet. Export all card names, labels, descriptions, and custom fields.",
      "Import into HelloGrowthCRM: Go to Leads → Import → Upload CSV. Map card names to Lead Name, card labels to Lead Tags, and any custom fields to HelloGrowthCRM fields. The import wizard handles all field mapping in a single screen.",
      "Set up your sales pipeline: Recreate your Trello board lists as HelloGrowthCRM pipeline stages (New Lead → Contacted → Proposal → Won). Enable AI lead scoring, connect WhatsApp Business API, and invite your team. Most teams are fully live in under 4 hours.",
    ],
    verdict: "Trello is genuinely the best Kanban board tool for pure task management. For sales teams that need contacts, deal values, WhatsApp, a dialer, AI lead scoring, and INR billing, Trello is missing the entire CRM layer. HelloGrowthCRM gives you everything Trello does — Kanban boards, task management, sprints — plus the full CRM and WhatsApp stack that Indian sales teams actually need.",
    faqQuestions: [
      "Can HelloGrowthCRM replace Trello for project and task management?",
      "How much does Trello cost vs HelloGrowthCRM for a 10-person team?",
      "How do I migrate my Trello boards to HelloGrowthCRM?",
      "Does HelloGrowthCRM support IndiaMART and JustDial lead import?",
      "Will I lose my Trello Butler automations when switching?",
      "Does HelloGrowthCRM have a free plan like Trello?",
    ],
  },
];

// Switch pages that exist as standalone routes but are NOT driven by switch-data.ts.
// Source: hellocrmwebsite/src/app/(public)/ directory listing — SYNCED_AT 2026-06-11
const SWITCH_PAGE_ONLY: Array<{ slug: string; competitor: string; route: string }> = [
  { slug: "excel", competitor: "Excel / Spreadsheets", route: "/switch-from-excel" },
  { slug: "hubspot", competitor: "HubSpot", route: "/switch-from-hubspot" },
  { slug: "tally", competitor: "Tally", route: "/switch-from-tally" },
  { slug: "whatsapp", competitor: "WhatsApp (plain app)", route: "/switch-from-whatsapp" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tools
// ─────────────────────────────────────────────────────────────────────────────

// ── alternatives_list ────────────────────────────────────────────────────────

export const alternativesList = defineTool({
  schema: z.object({
    search: z.string().optional().describe("Filter by keyword in competitor name, slug, route, or positioning line."),
  }),
  definition: {
    name: "alternatives_list",
    description:
      "List all competitor alternative pages and curated alternatives shortlists on hellogrowthcrm.com — competitor name, slug, website route, and a one-line HelloGrowthCRM positioning where available.",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Keyword filter on competitor name, slug, route, or positioning." },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    const seen = new Set<string>();
    const rows: Array<{ slug: string; competitor: string; route: string | null; url: string | null; positioning: string | null; note?: string }> = [];

    for (const [slug, entry] of Object.entries(ALTERNATIVES_SHORTLIST)) {
      const us = entry.picks.find((p) => p.isUs);
      rows.push({
        slug,
        competitor: entry.competitor,
        route: entry.route,
        url: entry.route ? `${SITE}${entry.route}` : null,
        positioning: us ? us.blurb : null,
      });
      seen.add(slug);
      if (entry.route) seen.add(entry.route);
    }

    for (const wa of WA_ALTERNATIVES) {
      if (seen.has(wa.slug)) continue;
      rows.push({
        slug: wa.slug,
        competitor: wa.name,
        route: wa.route,
        url: `${SITE}${wa.route}`,
        positioning: wa.tagline,
      });
      seen.add(wa.slug);
      seen.add(wa.route);
    }

    for (const page of ALTERNATIVE_PAGES) {
      if (seen.has(page.route)) continue;
      rows.push({
        slug: page.route.replace(/^\//, ""),
        competitor: page.competitor,
        route: page.route,
        url: `${SITE}${page.route}`,
        positioning: null,
        ...(page.note ? { note: page.note } : {}),
      });
    }

    let filtered = rows;
    if (args.search) {
      const q = args.search.toLowerCase();
      filtered = rows.filter(
        (r) =>
          r.competitor.toLowerCase().includes(q) ||
          r.slug.includes(q) ||
          (r.route ?? "").includes(q) ||
          (r.positioning ?? "").toLowerCase().includes(q),
      );
    }

    return ok({
      synced_at: SYNCED_AT,
      total: rows.length,
      filtered_count: filtered.length,
      alternatives: filtered,
    });
  },
});

// ── alternatives_get ─────────────────────────────────────────────────────────

const ALTERNATIVE_SLUG_ALIASES: Record<string, string> = {
  "zoho-crm": "zoho",
  gohighlevel: "go-high-level",
  "monday-com": "monday-crm",
  monday: "monday-crm",
  "microsoft-dynamics-365": "dynamics-365",
};

export const alternativesGet = defineTool({
  schema: z.object({
    slug: z.string().describe("Competitor slug, e.g. hubspot, zoho, wati, leadsquared, dynamics-365, gallabox."),
  }),
  definition: {
    name: "alternatives_get",
    description:
      "Get the full mirrored alternatives entry for a competitor: curated alternatives shortlist (HelloGrowthCRM + other picks with positioning blurbs) and, for WhatsApp-CRM competitors, the detailed page content (reasons, feature comparison, verdict).",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Competitor slug." },
      },
      required: ["slug"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    let slug = args.slug.toLowerCase().trim().replace(/^\//, "");
    slug = slug.replace(/-alternative-india$/, "").replace(/-alternative$/, "");
    slug = ALTERNATIVE_SLUG_ALIASES[slug] ?? slug;

    const shortlist = ALTERNATIVES_SHORTLIST[slug];
    const waDetail = WA_ALTERNATIVES.find((w) => w.slug === slug);

    if (!shortlist && !waDetail) {
      const valid = [
        ...new Set([...Object.keys(ALTERNATIVES_SHORTLIST), ...WA_ALTERNATIVES.map((w) => w.slug)]),
      ].sort();
      return fail(`Alternative "${args.slug}" not found. Valid slugs: ${valid.join(", ")}`);
    }

    const route = shortlist?.route ?? waDetail?.route ?? null;
    return ok({
      synced_at: SYNCED_AT,
      slug,
      competitor: shortlist?.competitor ?? waDetail?.name,
      route,
      url: route ? `${SITE}${route}` : null,
      shortlist: shortlist
        ? { source: "alternatives-shortlist.ts", picks: shortlist.picks }
        : null,
      whatsapp_detail: waDetail
        ? {
            source: "wa-alternatives-data.ts",
            h1: waDetail.h1,
            tagline: waDetail.tagline,
            reasons: waDetail.reasons,
            feature_rows: waDetail.featureRows.map(([feature, hellogrowthcrm, competitor]) => ({ feature, hellogrowthcrm, competitor })),
            faq_questions: waDetail.faqQuestions,
            verdict: waDetail.verdict,
          }
        : null,
    });
  },
});

// ── switch_list_competitors ──────────────────────────────────────────────────

export const switchListCompetitors = defineTool({
  schema: z.object({}),
  definition: {
    name: "switch_list_competitors",
    description:
      "List all /switch-from-* CRM migration pages on hellogrowthcrm.com — competitor, slug, website route, and one-line summary. Use switch_get_guide for the full migration guide.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  async handle(_args) {
    const guides = SWITCH_GUIDES.map((g) => ({
      slug: g.slug,
      competitor: g.name,
      route: `/switch-from-${g.slug}`,
      url: `${SITE}/switch-from-${g.slug}`,
      summary: g.tagline,
      has_guide_data: true,
    }));
    const pageOnly = SWITCH_PAGE_ONLY.map((p) => ({
      slug: p.slug,
      competitor: p.competitor,
      route: p.route,
      url: `${SITE}${p.route}`,
      summary: "Standalone migration page (content lives in the page component, not in switch-data.ts).",
      has_guide_data: false,
    }));
    return ok({
      synced_at: SYNCED_AT,
      total: guides.length + pageOnly.length,
      switch_pages: [...guides, ...pageOnly],
    });
  },
});

// ── switch_get_guide ─────────────────────────────────────────────────────────

export const switchGetGuide = defineTool({
  schema: z.object({
    slug: z.string().describe("Switch-from slug, e.g. zoho, salesforce, pipedrive, leadsquared, vtiger, trello."),
  }),
  definition: {
    name: "switch_get_guide",
    description:
      "Get the mirrored migration guide for a /switch-from-* page: reasons to switch (pain points), feature comparison rows, key migration steps (data mapped), verdict, and FAQ topics.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Switch-from competitor slug." },
      },
      required: ["slug"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    const slug = args.slug.toLowerCase().trim().replace(/^\//, "").replace(/^switch-from-/, "");
    const guide = SWITCH_GUIDES.find((g) => g.slug === slug);
    if (!guide) {
      const pageOnly = SWITCH_PAGE_ONLY.find((p) => p.slug === slug);
      if (pageOnly) {
        return fail(
          `"${pageOnly.route}" exists as a standalone page but its content is not in switch-data.ts, so no mirrored guide is available. Slugs with guide data: ${SWITCH_GUIDES.map((g) => g.slug).join(", ")}`,
        );
      }
      return fail(`Switch guide "${args.slug}" not found. Valid slugs: ${SWITCH_GUIDES.map((g) => g.slug).join(", ")}`);
    }
    return ok({
      synced_at: SYNCED_AT,
      slug: guide.slug,
      competitor: guide.name,
      route: `/switch-from-${guide.slug}`,
      url: `${SITE}/switch-from-${guide.slug}`,
      h1: guide.h1,
      tagline: guide.tagline,
      reasons_to_switch: guide.reasons,
      feature_comparison: guide.featureRows.map(([feature, hellogrowthcrm, competitor]) => ({ feature, hellogrowthcrm, competitor })),
      migration_steps: guide.migrationSteps,
      verdict: guide.verdict,
      faq_questions: guide.faqQuestions,
    });
  },
});
