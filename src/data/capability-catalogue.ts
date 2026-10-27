/**
 * Verified capability catalogue for hellogrowthcrm.com.
 *
 * Why this file exists: `features_list` carried 58 hand-written entries that
 * were last edited 2026-06-19 and omitted most of what the product ships
 * (ads trackers, dialers, field visits, sandbox, payroll, ticketing depth...).
 * Each entry here was read from the product code (hellocrm `master`, reviewed
 * read-only on 2026-10-24) and states WHO can use it and WHAT IT DOES NOT DO,
 * so an AI assistant does not over-promise.
 *
 * Rules for editing this file:
 *   - Add an entry only after reading the code. No marketing wording.
 *   - `availability_note` says how a buyer gets it. If the plan gate was not
 *     found in code, say so ("plan entitlement not confirmed"); never guess.
 *   - `limitations` lists what a buyer might assume but the code does not do.
 *   - Bump `CATALOGUE_VERIFIED_AT` only when the entries were re-read.
 */

export const CATALOGUE_VERIFIED_AT = "2026-10-24";
export const CATALOGUE_SOURCE = "HelloGrowthCRM product code (hellocrm master), read-only review";

export type CatalogueCategory =
  | "Calling & AI Voice"
  | "Ads, Lead Sources & Tracking"
  | "Messaging & Inbox"
  | "Productivity, Documents & Scheduling"
  | "Field, Inventory & Operations"
  | "Commerce, Finance & HR"
  | "Reporting & Prospecting"
  | "Platform, Security & Developers";

export interface CatalogueEntry {
  title: string;
  category: CatalogueCategory;
  summary: string;
  bullets: string[];
  availability_note: string;
  limitations: string[];
  aliases?: string[];
  learnMoreHref?: string;
}

const NOT_CONFIRMED = "Plan entitlement not confirmed in code; ask sales before promising it on a specific plan.";

export const CAPABILITY_CATALOGUE: CatalogueEntry[] = [
  // ── Calling & AI Voice ────────────────────────────────────────────────────
  {
    title: "India Dialer & Telephony Providers",
    category: "Calling & AI Voice",
    summary: "Click-to-call and an in-browser dialer for Indian teams, with call logs per lead, using the telephony provider the business already has.",
    bullets: [
      "Provider connections for Exotel, Airtel IQ, Knowlarity, MyOperator, Zoho Voice and Superfone",
      "In-browser web dialer and a tenant-wide choice of which provider the Call button uses",
      "Call Logs tab with a provider label per call",
    ],
    availability_note: "Admin sets it up under Settings > Dialer / Integrations. Growth and above (inherited from the dialer modules); live per-tenant state not confirmed.",
    limitations: ["Needs the customer's own provider account", "Some list-view Call buttons do not log a call when no dialer is configured (internal note dated 2026-09-29)"],
    aliases: ["Local dialer", "Click to call", "Exotel", "Knowlarity"],
    learnMoreHref: "/product/built-in-dialer",
  },
  {
    title: "International Calling (Twilio & SIP)",
    category: "Calling & AI Voice",
    summary: "Calls to numbers outside India through the customer's own Twilio account or a SIP trunk, with optional recording.",
    bullets: [
      "Connect your own Twilio account (Account SID, API key, TwiML app) in Settings > Dialer > VoIP / Calling",
      "SIP trunk tab to route chosen country codes through your SIP provider",
      "Per-call choice between the CRM dialer (domestic) and Twilio (international) where both are enabled",
    ],
    availability_note: "Admin self-serve with the customer's own Twilio or SIP account. The per-call selector is enabled per workspace by Meru. " + NOT_CONFIRMED,
    limitations: ["Meru does not resell Twilio minutes in the product today", "No country allow/deny list was found in the dialer code"],
    aliases: ["International dialer", "Twilio", "SIP trunk"],
  },
  {
    title: "Own Numbers & Business KYC (India)",
    category: "Calling & AI Voice",
    summary: "Dedicated Indian calling numbers for a workspace, with a business KYC upload to activate them.",
    bullets: ["'Verify your business' KYC upload is self-serve", "Number purchase and talk-time top-up are handled through Meru"],
    availability_note: "Enabled per workspace by Meru (feature flag); buying a number is 'contact us'.",
    limitations: ["Not self-serve end to end", "Indian numbers only"],
  },
  {
    title: "AI Calling Center & Campaigns",
    category: "Calling & AI Voice",
    summary: "AI voice agents place and receive calls, run call campaigns, respect a do-not-call list, and write summaries back to the lead.",
    bullets: [
      "Call Hub tabs: AI Calling Center (live, scheduled, failed today, minutes remaining) and AI Call Campaign",
      "Settings > AI Agent: voice, language, DNC list, AI call coaching toggle",
      "Providers in the stack: Kupe (default), Sarvam, Telnyx",
      "Growth plan includes call-seconds per seat; extra AI numbers and minutes are bought through Meru",
    ],
    availability_note: "Growth and above (AI calling flag set at Growth in plan modules). AI numbers and minute add-ons are 'contact us'.",
    limitations: ["Language and voice coverage is focused on Indian languages; confirm before promising other languages", "Which provider a workspace runs on is provisioned by Meru"],
    aliases: ["AI calling", "AI voice agent", "Outbound AI calls"],
  },
  {
    title: "Live Call Coaching",
    category: "Calling & AI Voice",
    summary: "A live overlay during calls that nudges the rep with talking points and a checklist.",
    bullets: ["Configured per organisation in Dialer settings > Call Coaching", "Nudges come from the AI router during the call"],
    availability_note: NOT_CONFIRMED,
    limitations: ["There is no call-quality scorecard per rep; the rep scorecard covers leads, tasks, visits and deals"],
  },
  {
    title: "Call Transcription & Analysis",
    category: "Calling & AI Voice",
    summary: "Live-call transcription, AI summaries, sentiment, action items and buying signals on call logs, plus transcription of voice notes and WhatsApp voice messages in Indian languages.",
    bullets: [
      "Live transcription with speaker separation during a call (Deepgram)",
      "'Analyze with AI' on a call: summary, key points, sentiment, objections, buying signals, competitor mentions and follow-up tasks",
      "Voice notes and inbound WhatsApp voice messages are transcribed (Hindi, Gujarati, Marathi, Tamil, Telugu, Bengali, Kannada, Malayalam, Punjabi, Odia, Assamese, English)",
      "Conversation Intelligence page: keyword rules and a mentions feed",
    ],
    availability_note: "Analysis and live transcription are credit-metered. " + NOT_CONFIRMED,
    limitations: [
      "Automatic speech-to-text of a stored call recording is not generally available; analysis needs a transcript from live transcription or another source",
      "There is no AI meeting-bot note taker (Otter and Fireflies are 'coming soon' cards only)",
    ],
    aliases: ["AI transcription", "Call summaries", "Conversation intelligence"],
  },
  {
    title: "WhatsApp Calling",
    category: "Calling & AI Voice",
    summary: "Place WhatsApp voice calls from the browser over the Meta Cloud API.",
    bullets: ["'WhatsApp Call' dialog and a Calls tab in the WhatsApp Hub"],
    availability_note: "Enabled per workspace by Meru. Meta must enable calling on the number and require a messaging limit of at least 2,000 per day.",
    limitations: ["Not self-serve"],
  },

  // ── Ads, Lead Sources & Tracking ──────────────────────────────────────────
  {
    title: "Meta Ads Analytics",
    category: "Ads, Lead Sources & Tracking",
    summary: "See Meta ad spend, impressions and campaign performance next to your leads.",
    bullets: ["Meta Ads Analytics page with 7/30/90-day and custom ranges", "Ad account picker; shows 'Meta Ads not connected' until connected", "Daily spend and impressions chart plus a campaigns table"],
    availability_note: NOT_CONFIRMED,
    limitations: ["Reads spend and delivery; lead cost by source is not computed"],
    aliases: ["Meta ads tracker", "Facebook ads tracker"],
  },
  {
    title: "Meta Lead Ads & Conversions API",
    category: "Ads, Lead Sources & Tracking",
    summary: "Leads from Meta Lead Ad forms arrive in the CRM, and CRM outcomes are sent back to Meta through the Conversions API.",
    bullets: ["Meta Lead Ads card with OAuth connection and status badges", "Leads show 'From Meta Lead Ad' with page and form", "Meta Conversions API card (Pixel ID, access token, test event code, send test event)"],
    availability_note: "Admin self-serve in Settings > Integrations. " + NOT_CONFIRMED,
    limitations: [],
  },
  {
    title: "Google Ads Integration",
    category: "Ads, Lead Sources & Tracking",
    summary: "Bring Google Ads lead-form leads into the CRM and upload offline conversions (qualified, won) back to Google Ads.",
    bullets: ["Inbound: webhook for Google Ads lead forms with a ledger of what arrived", "Outbound: conversion upload with developer token, OAuth and CRM-event-to-conversion-action mapping", "Upload status and health summary"],
    availability_note: "Admin credentials in Settings > Integrations. " + NOT_CONFIRMED,
    limitations: ["Automatic conversion upload is switched off by default and enabled per tenant", "Does not pull Google Ads spend or campaign reports", "gclid is stored on leads when it arrives with the form"],
    aliases: ["Google Ads tracker"],
  },
  {
    title: "Click-to-WhatsApp Ads Tracker",
    category: "Ads, Lead Sources & Tracking",
    summary: "Track which Meta click-to-WhatsApp ads produce real leads, deals and revenue, and send outcomes back to Meta.",
    bullets: [
      "'WhatsApp Ads' tab in the WhatsApp Hub: per-ad leads, conversations, qualified, deals won, revenue, spend, CPL, cost per qualified lead and ROAS",
      "Attribution reconciliation: Meta conversations started versus CRM leads captured, with a warning for ads pointing at an unconnected number",
      "Conversions API milestones: Interested, Meeting Fixed and Converted are mapped to Meta events by default and can be remapped",
      "Leads are tagged 'Click to WhatsApp' / 'From WhatsApp Ad'",
    ],
    availability_note: NOT_CONFIRMED,
    limitations: ["Milestone events fire only for leads that carry a click id and only if the Conversions API is enabled"],
    aliases: ["WhatsApp ads tracker", "CTWA"],
  },
  {
    title: "Lead Source Tracking & Attribution",
    category: "Ads, Lead Sources & Tracking",
    summary: "Every lead keeps its source and first-touch campaign data, with reports on where leads and response times come from.",
    bullets: [
      "Tenant-defined lead sources (Settings > Lead Sources) and a source label on every lead",
      "First-touch UTM source, medium, campaign, term, content, gclid and referrer stored once and never overwritten",
      "'Website Attribution' snippet adds hidden UTM and click-id fields to your existing forms; landing pages have an embed tab",
      "Reports: 'Where your leads came from' widget, Sources and Channels tabs in Analytics, 'First response by source', Campaign attribution (first, last, linear, time-decay)",
      "Lead-source connectors: Meta Lead Ads, IndiaMART, JustDial, Sulekha, Shiksha, Naukri, 99acres, MagicBricks, Housing.com, Typeform, Google Forms, LinkedIn Lead Gen, Tally, JotForm, TradeIndia, Eventbrite",
    ],
    availability_note: NOT_CONFIRMED,
    limitations: ["No cost or ROI per lead source (cost exists per campaign and per click-to-WhatsApp ad)", "fbclid is not stored on leads", "The Channels tab is computed on a single page of leads, so it is unreliable for workspaces with more than 50 leads"],
    aliases: ["Lead sources", "UTM tracking", "Source reports"],
  },
  {
    title: "Website Visitor Tracking",
    category: "Ads, Lead Sources & Tracking",
    summary: "A paste-in script records anonymous visitors, their pages, referrer and UTM data, and shows live visitors.",
    bullets: ["Visitor ID, session, UTM source/medium/campaign, referrer, device, browser, scroll depth, time on page and CTA clicks", "Honours Do-Not-Track"],
    availability_note: "Off by default; shown to workspaces where it is enabled. Growth and Enterprise plan mapping not re-confirmed.",
    limitations: ["Does not capture gclid, fbclid, utm_term or utm_content", "Visitor-to-lead conversion linkage could not be confirmed in code"],
    aliases: ["Traffic tracking"],
  },
  {
    title: "WhatsApp Reporting & Delivery Tracking",
    category: "Ads, Lead Sources & Tracking",
    summary: "Delivery and read tracking for every WhatsApp message and a reporting tab for volume, response time, AI replies, agents and templates.",
    bullets: [
      "Sent, delivered, read and failed status per message",
      "Analytics tab: reply rate, median and 90th-percentile first reply, SLA breaches, conversion funnel, messages per day, agent performance, template performance, CSV export",
      "Broadcast status tiles (sent, delivered, read, failed) and a separate omnichannel Inbox Analytics view",
    ],
    availability_note: "Part of the WhatsApp Hub, enabled per workspace. " + NOT_CONFIRMED,
    limitations: ["No per-broadcast funnel, failure breakdown or flow drop-off report yet (planned only)"],
    aliases: ["WhatsApp tracking", "WhatsApp analytics"],
  },

  // ── Messaging & Inbox ─────────────────────────────────────────────────────
  {
    title: "Web Chat Assistant",
    category: "Messaging & Inbox",
    summary: "A website chat widget with live visitors, proactive triggers, a knowledge base and AI answers that hand over to a human.",
    bullets: [
      "Copy-paste embed script; optional pre-chat form, FAQs, 'Continue on WhatsApp' and a booking button",
      "AI Auto-Response answers from your knowledge base when agents are offline; the first human reply switches the AI off for that chat",
      "Business hours and an offline message; chats can create leads automatically",
      "Inbox, Live Visitors, Widgets, Knowledge Base, Triggers, Analytics, Settings",
    ],
    availability_note: "Starter-and-above module (so Growth and Enterprise); whether Free includes it is not confirmed. AI replies spend AI credits.",
    limitations: ["The routing method setting (round robin, least busy, skills) could not be confirmed as enforced on the server; agents can assign chats manually"],
    aliases: ["Live chat", "Chatbot", "Website chat"],
  },
  {
    title: "WhatsApp AI Auto-Reply & Flows",
    category: "Messaging & Inbox",
    summary: "AI replies to inbound WhatsApp messages (suggest or auto-send) and a visual flow builder with an AI flow generator.",
    bullets: ["Modes: Off, Suggest only, Auto-send; handoff keywords; stand-down after a human replies", "An open AI-to-human escalation mutes the bot until 'Resume AI'", "WhatsApp Flows: node-graph builder with delays"],
    availability_note: "AI chatbot feature is Growth and above. WhatsApp Flows is admin-only and enabled per workspace.",
    limitations: ["No human-handoff node was found inside Flows"],
    aliases: ["WhatsApp bot", "WhatsApp chatbot"],
  },
  {
    title: "Instagram DM & Comment Management",
    category: "Messaging & Inbox",
    summary: "Instagram DMs and post comments in one inbox, with replies, comment moderation and direct publishing.",
    bullets: ["DM inbox, replies and lead creation from DMs", "Comments inbox with reply, hide and delete", "Posts tab for direct publishing", "Connect through Facebook login or Instagram direct login"],
    availability_note: NOT_CONFIRMED,
    limitations: ["Automatic reply rules, keyword triggers and comment-to-DM automation are not built", "AI triage only suggests replies to the rep"],
    aliases: ["Instagram inbox"],
  },
  {
    title: "Shared Inbox, Mailbox Sync & Email Deliverability",
    category: "Messaging & Inbox",
    summary: "Team inbox across WhatsApp, email, SMS and social, Gmail and Outlook mailbox sync, and tooling to protect sending reputation.",
    bullets: [
      "Gmail and Outlook mailbox sync with push watch and backfill, plus IMAP and send-only Gmail",
      "Open and click tracking, DMARC report ingest, sender blacklist check, IP warm-up, email verification and suppression lists",
      "Consent records, double opt-in and one-click unsubscribe",
      "AI triage and inbox autopilot policies for inbound conversations",
    ],
    availability_note: NOT_CONFIRMED,
    limitations: ["Inbox autopilot drafts and sends only on the email channel"],
    aliases: ["Team inbox", "Omnichannel inbox"],
    learnMoreHref: "/product/hello-mail",
  },

  // ── Productivity, Documents & Scheduling ──────────────────────────────────
  {
    title: "Notes (My Notes)",
    category: "Productivity, Documents & Scheduling",
    summary: "Personal notes with tags, pinning, search and one-click conversion into tasks.",
    bullets: ["Autosave with 'Saved HH:MM' indicator", "'Make a task' from a note", "Download a note as PDF; Trash with restore"],
    availability_note: "Enabled per workspace by Meru (super-admin feature flag, off by default). Automatically available in TaskSiddhi mode.",
    limitations: ["No permanent-delete button in Trash", "No voice notes inside Notes"],
    aliases: ["Note taking", "Notes"],
  },
  {
    title: "Voice Notes & Voice Capture",
    category: "Productivity, Documents & Scheduling",
    summary: "Record voice notes on leads, visits and exhibitions, or speak a lead into existence from the command palette.",
    bullets: ["Lead voice notes with optional transcription", "Quick Voice Capture transcribes speech and pre-fills a new lead", "Field-visit and exhibition voice notes; team-chat voice messages"],
    availability_note: "Voice transcription is credit-metered and enabled per workspace.",
    limitations: ["No voice notes on tasks or in Notes"],
    aliases: ["Voice note capturing"],
  },
  {
    title: "Business Card Scanner",
    category: "Productivity, Documents & Scheduling",
    summary: "Scan business cards into leads with duplicate detection and quality warnings.",
    bullets: ["'Scan Card' in the New Lead menu and on the dashboard", "Multi-card sessions; exhibition variant and an assistant tool", "Vision model extraction using AI credits"],
    availability_note: "Growth tier (not re-confirmed). Default quota 100 scans per workspace, then 'Free scan quota exceeded'.",
    limitations: [],
    aliases: ["Card scanner", "OCR visiting card"],
  },
  {
    title: "Task Boards Depth",
    category: "Productivity, Documents & Scheduling",
    summary: "Task boards with table, kanban, calendar, Gantt and analytics views, dependencies, recurrence and stage automation.",
    bullets: [
      "Subtasks, dependencies, multi-assignee, assignee availability, time tracking, custom fields, formulas, sprints",
      "Recurring tasks (RRULE), reminders, board templates, saved views, bulk actions, CSV import and export",
      "Email-to-task inbox, intake forms for clients, board webhooks, approvals",
      "Stage automation: send email, AI call, send WhatsApp, create quote draft or invoice, book a field visit, schedule a reminder",
      "One-way task sync to Google Calendar; field-visit check-in with photo on a task",
    ],
    availability_note: "Task Boards is a Growth-tier module (Free has a capped basic task board). Some automation flags are enabled per workspace.",
    limitations: ["No voice notes on tasks"],
    aliases: ["Tasks", "Task management"],
  },
  {
    title: "Document Attachments & Templates",
    category: "Productivity, Documents & Scheduling",
    summary: "Attach files to leads, tasks, quotes and invoices, and generate documents from templates with merge fields.",
    bullets: ["Lead attachments (default 25 MB per file) shareable by WhatsApp or email; read-only Google Drive links", "Document templates with {{lead / tenant / user}} placeholders: quote, contract, follow-up, introduction, letter", "DocuSign, Adobe Sign and Aadhaar eSign connectors"],
    availability_note: "File attachments are available on Free; templates from the Starter-and-above seed. E-sign needs the customer's provider account.",
    limitations: ["Attachments on deals and accounts were not found as a dedicated component"],
    aliases: ["Document attachment", "File upload"],
  },
  {
    title: "AI Proposal Builder",
    category: "Productivity, Documents & Scheduling",
    summary: "Generate research-grounded proposals with an outline, section drafts and an approval step, and export them.",
    bullets: ["Depth modes: quick, standard, deep, enterprise", "Lead Documents tab: 'From Template' and 'AI Proposal (one-shot)'", "Public proposal pages; PDF and DOCX export; Better Proposals connector"],
    availability_note: "Growth tier, enforced server-side. Uses AI credits.",
    limitations: [],
    aliases: ["AI proposals", "Proposal generator"],
  },
  {
    title: "Scheduler & Booking Pages",
    category: "Productivity, Documents & Scheduling",
    summary: "Branded booking pages with several meeting types, routing forms, meeting polls, reminders and an API.",
    bullets: [
      "Event types: one-to-one, round-robin host pools, collective (co-hosts) and seat-capped groups",
      "Routing forms, meeting polls, public booking and self-service manage/reschedule pages, embeddable widgets",
      "Zoom links, Slack and Zapier hooks, a booking API, availability for people and teams",
      "Tabs: Home, Calendar, Event Types, Scheduled Events, Scheduled Messages, Availability, Routing, Analytics, Integrations, Settings",
    ],
    availability_note: "Growth and Enterprise. Scheduler workflows, WhatsApp reminders and external-calendar read-back are enabled per workspace by Meru and off by default.",
    limitations: ["Two-way free/busy sync with external calendars could not be confirmed"],
    aliases: ["Scheduler", "Appointment booking", "Calendly alternative"],
    learnMoreHref: "/product/scheduling",
  },
  {
    title: "Calendar Sync (Google & Outlook)",
    category: "Productivity, Documents & Scheduling",
    summary: "Meetings and tasks are pushed to the user's Google or Outlook calendar.",
    bullets: ["Google: create, delete, list and retry sync, health check, lead appointment slots", "Outlook: connect, create, list, delete, disconnect", "Vertical calendars exist for hotels (booking calendar), CA firms (compliance calendar) and agencies (content calendar)"],
    availability_note: "Per user connection. " + NOT_CONFIRMED,
    limitations: ["Task sync to Google is one-way, CRM to calendar"],
    aliases: ["Google Calendar", "Outlook calendar", "Calendar"],
  },

  // ── Field, Inventory & Operations ─────────────────────────────────────────
  {
    title: "Field Visits",
    category: "Field, Inventory & Operations",
    summary: "Field reps check in and out with GPS and photo proof; managers see a map, reports and exports.",
    bullets: ["GPS check-in and check-out; proof photo required at check-out", "Guards: no check-in more than an hour early, minimum visit length", "Field Visit Map, Field Visit Reports, export, notifications, prospect capture on the spot", "Works offline through a device queue"],
    availability_note: "Growth-tier module, enabled at onboarding.",
    limitations: ["Offline support covers field visits, exhibition capture and Field Sales; other modules are online-only"],
    aliases: ["Field trip", "Field force", "Visit tracking"],
  },
  {
    title: "Field Sales & Sales Planning (Agri Inputs)",
    category: "Field, Inventory & Operations",
    summary: "A full field-sales workspace for agri-input distributors: monthly sales plans, budgets, routes, visit evidence, dealer stock, orders and an SAP connector.",
    bullets: [
      "Sales planning: monthly plan, spreadsheet import, annual budget, plan roll-up, plan vs budget vs actual, forecast drill-down, manager approvals",
      "Routes and visits: route plans with manager approval, visit calendar, route adherence, plan vs actual working, visit map, check-ins with photos and voice notes",
      "Dealer stock with weeks of cover, order desk, dealer portal, field customers and prospects, field campaigns",
      "SAP S/4HANA connector: pulls partners, materials, stock, billing documents and delivery status; pushes sales orders, price conditions and business partners; modes off, sandbox, live",
      "Offline queue with a sync screen and conflict choices",
    ],
    availability_note: "Only for workspaces onboarded with the Agri Inputs industry. Access is by role sections (own, team, all). Plan entitlement not confirmed.",
    limitations: ["Not a general-purpose feature of every workspace", "SAP connector defaults to off and runs a simulation until live credentials are set; use against a live SAP system is not confirmed"],
    aliases: ["Sales planning", "Beat plan", "Route plan", "Primary sales SAP"],
  },
  {
    title: "Offline Working",
    category: "Field, Inventory & Operations",
    summary: "The app shell loads offline and field data entry is queued on the device and synced when the network returns.",
    bullets: ["Service-worker app shell and offline sign-in restore", "Write queue for Field Sales, Field Visits and Exhibition capture, including photos and voice notes, with retry, 'Sync now' and duplicate protection", "Read-only cache of recent leads"],
    availability_note: "Field Sales offline screens are part of that workspace; wider offline packs are enabled per workspace by Meru.",
    limitations: ["Everything outside Field Sales, Field Visits and Exhibition is online-only", "A general offline day-pack architecture is planned, not shipped"],
    aliases: ["Offline mode", "PWA offline"],
  },
  {
    title: "Material & Stock Tracking",
    category: "Field, Inventory & Operations",
    summary: "Track materials across warehouses, customer sites and rep vans with an append-only movement ledger.",
    bullets: ["Locations: Warehouse, Customer Site, Rep/Van", "Movements: receipt, transfer, consumption, wastage, adjustment (reversible); batch and expiry on receipts", "Consumption per job in the task drawer; reports by site, by job and cost", "Manufacturing adds Lots & Serials, reservations and shortages; Field Sales adds dealer stock counts"],
    availability_note: "Material Tracking is switched on per workspace (Field Service badge). Plan entitlement not confirmed.",
    limitations: ["No serial numbers or barcodes in Material Tracking itself (serials exist in the manufacturing module)"],
    aliases: ["Materials movement tracking", "Inventory"],
  },

  // ── Commerce, Finance & HR ────────────────────────────────────────────────
  {
    title: "Invoicing, Payment Links & GST Reports",
    category: "Commerce, Finance & HR",
    summary: "Create invoices from quotes or leads, collect through payment links, and run GST reports.",
    bullets: ["Quote-to-invoice, invoice requests, lead invoices, recurring invoices", "Payment links through Razorpay, Cashfree, Stripe and others; pay-by-link from the customer portal", "Overdue-invoice reminders", "GST Reports; vertical billing variants (hotel folios, clinic and CA billing, milestone and instalment billing)"],
    availability_note: "Invoices are Starter-and-above in the feature catalogue. Several billing variants are enabled per industry or workspace.",
    limitations: ["The public REST API has no invoice or quote endpoints; invoices are exposed as webhook events only"],
    aliases: ["Invoicing", "Billing", "GST"],
  },
  {
    title: "Commission Management",
    category: "Commerce, Finance & HR",
    summary: "Automatic commission on closed-won deals from rules, with an approval and payout ledger.",
    bullets: ["Rules: percentage or flat, by deal-value band, stage and rep scope; per-deal rule override or 'no commission'", "Ledger statuses pending, approved, paid; totals per currency; manual commissions", "Vertical payout engines: loan DSA (lender, product and volume slabs, sub-DSA with 2% TDS), insurance, real-estate channel partners, study-abroad"],
    availability_note: "Admin-only. Plan entitlement not confirmed.",
    limitations: ["Rep commission has no slabs, tiers, clawback or quota plans", "No automatic link into payroll; commission is typed into payroll by hand"],
    aliases: ["Rep commission", "Incentives"],
  },
  {
    title: "Payroll",
    category: "Commerce, Finance & HR",
    summary: "Pay runs from attendance with India statutory deductions and payslips.",
    bullets: ["Salary components fixed or percent of basic; prorated by paid days from attendance; additional pay such as bonus and reimbursement", "PF 12% on basic up to 15,000, ESI with the 21,000 threshold, professional tax flat or by your slab table", "Run workflow draft, submitted, approved, locked; payslip PDF, CSV register, mark paid with audit log"],
    availability_note: "Available to workspaces onboarded with the Recruitment industry and the payroll permission. Plan entitlement not confirmed.",
    limitations: ["TDS is a flat-percentage estimate, not a slab or regime calculation", "No ECR, challan or Form 16 output, no loans or advances, no gratuity, no bank transfer file", "No per-state professional-tax library"],
    aliases: ["Payroll calculation", "Salary"],
  },
  {
    title: "Leave, Attendance & Appraisals",
    category: "Commerce, Finance & HR",
    summary: "HR basics for the Recruitment industry: leave, attendance grid and regularizations, appraisal cycles, and a learning module.",
    bullets: ["Leave types, balances and requests", "Attendance grid with manual entries and regularizations", "Appraisal templates, cycles and reviews; LMS courses, enrollments and certificates"],
    availability_note: "Enabled per workspace by Meru (HR flags are super-admin controlled).",
    limitations: ["No biometric or geo-based attendance capture found"],
    aliases: ["HRMS", "Attendance", "Leave management"],
  },
  {
    title: "Customer Portal",
    category: "Commerce, Finance & HR",
    summary: "A branded, passwordless portal where customers see invoices, quotes, orders, tickets, bookings and statements and can pay online.",
    bullets: ["One-time-code login", "Invoices with pay-now, quotes with accept or reject, orders, support requests with satisfaction rating, bookings, statements, profile and documents", "Per-customer and per-module toggles"],
    availability_note: "Growth and above in the feature catalogue; modules are toggled per workspace.",
    limitations: ["A vendor or supplier portal is not built (drafted in a product requirements document only)"],
    aliases: ["Client portal", "Self-service portal"],
  },
  {
    title: "eCommerce Module",
    category: "Commerce, Finance & HR",
    summary: "Online-store operations inside the CRM: dashboard, orders, customers, abandoned carts, returns and store integrations.",
    bullets: ["Shopify, WooCommerce and BigCommerce connections", "Orders can create invoices and payment links"],
    availability_note: "Enabled per workspace. " + NOT_CONFIRMED,
    limitations: ["WhatsApp catalogue commerce is enabled per workspace by Meru and not self-serve"],
  },
  {
    title: "Ticketing & SLA",
    category: "Commerce, Finance & HR",
    summary: "Support tickets with SLA policies, escalations, watchers, internal notes and customer satisfaction.",
    bullets: [
      "Create tickets from the Team Inbox on any channel including WhatsApp; optional auto-ticket on every new inbound conversation",
      "Assignee set by hand; department transfer to a shared queue",
      "SLA policies with escalation to notify, reassign or both; checked every 5 minutes",
      "Tags, category and subcategory, channel, internal versus public replies, watchers, close survey and CSAT",
    ],
    availability_note: "Support module is Growth; SLA policies are Growth. Customer-portal tickets need the portal tickets module switched on.",
    limitations: ["No round-robin or automatic assignment of tickets", "No dedicated email-to-ticket parser (auto-ticket on the email channel is the nearest option)"],
    aliases: ["Tickets", "Assign tickets", "Helpdesk"],
  },

  // ── Reporting & Prospecting ───────────────────────────────────────────────
  {
    title: "Report Builder",
    category: "Reporting & Prospecting",
    summary: "Build, save and export lead and pipeline reports with comparison and breakdowns, plus per-industry report pages.",
    bullets: [
      "About 24 reports: leads by stage, source, user, team, territory, channel, tag and custom field; funnel, ageing, stage velocity, lost reasons, first response and SLA, follow-up discipline, contactability, consent",
      "Date presets, compare to previous period, second-dimension breakdown, drill-down to leads, saved and shared reports",
      "Export to CSV, PNG, PDF and Excel; about 17 industry-specific report pages",
    ],
    availability_note: "Admin-only by default (reports permission). Dashboards widgets, the Business Review and the Custom Report explorer (cross-module group-by, filters, saved versions, metric alerts) are enabled per workspace by Meru.",
    limitations: ["Scheduled or emailed reports are not built, even though some upsell copy mentions them", "The explorer exports CSV only", "No natural-language report creation screen; the AI assistant can answer report questions where enabled"],
    aliases: ["Reporting", "Dynamic reporting", "AI report builder", "Custom reports"],
  },
  {
    title: "Prospecting & Lead Finder",
    category: "Reporting & Prospecting",
    summary: "Search a business database, review and approve prospects, enrich them and message them in bulk.",
    bullets: ["Tabs: Search, Results, Approved, Runs, Health, Settings; saved searches, export, email verify, import", "Monthly search caps by plan: Free 10, Starter 100, Growth 500, Enterprise unlimited (enforced server-side)", "Enrichment through the customer's own Apollo, Clearbit, Hunter, Lusha, Snov.io, ZoomInfo, Cognism or Coresignal keys; automatic enrichment on new leads", "Saving a prospect costs 5 AI credits"],
    availability_note: "Plan caps as listed. Hidden for some industries.",
    limitations: ["Truecaller lookup is unverified against a real account"],
    aliases: ["Prospecting", "Lead finder", "Lead enrichment"],
  },

  // ── Platform, Security & Developers ───────────────────────────────────────
  {
    title: "Public REST API & Webhooks",
    category: "Platform, Security & Developers",
    summary: "Create and read leads, deals, tasks, notes and orders over a REST API with scoped keys, and receive outbound webhooks.",
    bullets: ["Leads, deals, tasks and notes: get, create, update, delete; orders: read, upsert on source order id, patch; AI calls endpoint", "x-api-key or user bearer token; scopes entity:read and entity:write; rate limits 120 reads and 60 writes per minute", "Outbound webhooks include invoice.created, invoice.sent, invoice.paid, invoice.cancelled, quote.created, quote.sent, quote.accepted, quote.rejected and payment.received", "Live OpenAPI document generated by the API"],
    availability_note: "Enabled per workspace by Meru (integrations flag, off by default). " + NOT_CONFIRMED,
    limitations: ["No endpoints to create or read invoices or quotes", "Invoices can be linked to an order by id and read back embedded in the order"],
    aliases: ["API", "Invoicing via API", "Webhooks"],
  },
  {
    title: "Developer Portal & API Sandbox",
    category: "Platform, Security & Developers",
    summary: "A developer portal with sandbox workspaces, test keys, an API console, request logs and OAuth apps.",
    bullets: ["Sandboxes with synthetic data (up to 5 per workspace), resettable, with test-only API keys", "API Console with confirmation before writing to live data; request log kept for 7 days", "Webhook delivery history; OAuth developer apps with scopes and a review step to go live"],
    availability_note: "Same enablement as the REST API (integrations flag).",
    limitations: ["Request bodies are not stored"],
    aliases: ["API sandbox", "Developer platform"],
  },
  {
    title: "Roles, Permissions & Data Scope (RBAC)",
    category: "Platform, Security & Developers",
    summary: "Custom roles with per-module permissions, own/team/all data scope and field-level hiding.",
    bullets: ["Built-in admin, user and caller roles plus custom roles ('Create Custom Role')", "Around 100 modules each with view, create, edit, delete and export", "Data scope own, team, all or none, enforced in the database", "Field visibility hides deal value, invoice amount, payment status and commission per role", "Teams with several managers, departments and a rep manager hierarchy"],
    availability_note: NOT_CONFIRMED,
    limitations: [],
    aliases: ["RBAC", "User roles", "Permissions"],
    learnMoreHref: "/product/role-permissions",
  },
  {
    title: "Audit Trails & Record History",
    category: "Platform, Security & Developers",
    summary: "History of changes on records, a trash with audit log, AI action logs and a security audit trail.",
    bullets: ["Lead and deal history with record versions", "Trash & Audit Log: restore or permanently delete leads, deals and accounts", "AI Audit Log with CSV export; AI approvals page", "Security page: Audit Trail, Two-Factor Auth and GDPR tools; lead audit logs are purged after a configurable retention (3 years)"],
    availability_note: "Trash & Audit Log is admin-only. Newer lead audit feed is enabled per workspace. " + NOT_CONFIRMED,
    limitations: ["No export on the Trash & Audit Log view"],
    aliases: ["Audit logs"],
  },
  {
    title: "AI Assistant (Command Chat)",
    category: "Platform, Security & Developers",
    summary: "An in-app assistant that answers questions and, when the admin allows it, edits records.",
    bullets: ["Floating 'AI Assistant' panel", "Admin toggles: assistant button, 'AI Assistant: Edit Records', open once", "Can answer report questions through the governed report engine where reports are enabled"],
    availability_note: "Free includes a small allowance; Growth is unlimited (in-app copy). Credit-metered.",
    limitations: ["No escalation to a human; it is an internal tool"],
    aliases: ["AI copilot", "CRM assistant"],
    learnMoreHref: "/product/ai-copilot",
  },

  // ── Marketing add-ons (kept in the same category list as Ads) ─────────────
  {
    title: "Social Publishing & Content Calendar",
    category: "Ads, Lead Sources & Tracking",
    summary: "Plan, generate and schedule social posts from the CRM.",
    bullets: ["Post Ideas with AI idea and image generation", "Publish or schedule to LinkedIn, Meta pages and Instagram, YouTube, Pinterest and Telegram", "Content calendar for agencies"],
    availability_note: NOT_CONFIRMED,
    limitations: ["Scope of blog and content automation (tenant-facing or internal) not confirmed"],
    aliases: ["Post ideas", "Social media scheduler"],
  },
  {
    title: "Local SEO: Google Business Profile Audit & Rank Tracking",
    category: "Ads, Lead Sources & Tracking",
    summary: "Audit a connected Google Business Profile and track local map rankings.",
    bullets: ["Weekly Google Business Profile audit and health snapshot", "Local rank scans across several keywords"],
    availability_note: NOT_CONFIRMED,
    limitations: ["Part of the Business Listings area"],
    aliases: ["Business listings", "Local rank tracker"],
  },
];
