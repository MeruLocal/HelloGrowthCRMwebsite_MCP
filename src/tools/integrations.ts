import { z } from "zod";
import { defineTool, ok, fail } from "./tool-types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Static read-mirror data — integrations catalog.
//
// Source: hellocrmwebsite/src/lib/integrations-catalog-data.ts — SYNCED_AT 2026-06-17
//   Mirrors the merged INTEGRATIONS_CATALOG exactly as the website serves it:
//   the curated catalog merged with the parser-filtered entries from
//   hellocrmwebsite/src/lib/generated-integrations-report-catalog.ts AND
//   hellocrmwebsite/src/lib/generated-integrations-app-catalog.ts
//   (isValidIntegrationEntry + mergeCatalogs, first-slug-wins dedupe).
//   Descriptions mirror each entry's `whatItDoes` copy, shortened to one sentence.
// Source: hellocrmwebsite/src/lib/integration-routes.ts — SYNCED_AT 2026-06-17
//   Routes apply getIntegrationPath(), including the slug aliases that 301 to a
//   canonical app page (whatsapp-meta→whatsapp, gmail-google-workspace→gmail,
//   meta-lead-ads→meta-ads, zoom-google-meet→google-meet, accounting→quickbooks,
//   ecommerce→shopify, email-marketing→mailchimp, calendar→google-calendar).
// Public-facing count: INTEGRATIONS_CATALOG_SUMMARY.publicCount = 630
//   (derived from the real catalog total) — single source of truth for the
//   "630+" integrations claim.
//
// This is a READ-MIRROR: data is copied verbatim from website files, never invented.
// ─────────────────────────────────────────────────────────────────────────────

const SYNCED_AT = "2026-06-17";
const SITE = "https://hellogrowthcrm.com";

/** Canonical public-facing integration count (derived from the merged catalog total). */
const PUBLIC_INTEGRATION_COUNT = 630;

interface IntegrationCategory {
  slug: string;
  title: string;
  shortLabel: string;
}

interface IntegrationRecord {
  slug: string;
  name: string;
  /** Category slug — see INTEGRATION_CATEGORIES. */
  category: string;
  /** One-sentence summary mirrored from the catalog's `whatItDoes` copy. */
  description: string;
  /** Mirrored where the catalog sets it: "live" | "backend-ready" | "scaffolded". Generated long-tail entries without a status are planned/scaffolded directory pages. */
  status?: "live" | "backend-ready" | "scaffolded";
  /** Page route on hellogrowthcrm.com (alias slugs already resolved). */
  route: string;
}

// Source: hellocrmwebsite/src/lib/integrations-catalog-data.ts (category list of the
// merged INTEGRATIONS_CATALOG) — SYNCED_AT 2026-06-17
const INTEGRATION_CATEGORIES: IntegrationCategory[] = [
  { slug: "email-marketing", title: "Email marketing & CRM sync", shortLabel: "Email marketing" },
  { slug: "communication", title: "Communication & messaging", shortLabel: "Communication" },
  { slug: "voice-telephony", title: "Voice & telephony", shortLabel: "Voice" },
  { slug: "calendar", title: "Calendar & scheduling", shortLabel: "Calendar" },
  { slug: "analytics-ads", title: "Analytics & ad tracking", shortLabel: "Analytics & ads" },
  { slug: "lead-capture", title: "Lead capture", shortLabel: "Lead capture" },
  { slug: "automation", title: "Automation & webhooks", shortLabel: "Automation" },
  { slug: "crm-platform-sync", title: "CRM platform sync", shortLabel: "CRM sync" },
  { slug: "pm-support", title: "Project management & support", shortLabel: "PM & support" },
  { slug: "e-sign", title: "E-signatures", shortLabel: "E-signatures" },
  { slug: "ecommerce", title: "eCommerce", shortLabel: "eCommerce" },
  { slug: "accounting", title: "Accounting & finance", shortLabel: "Accounting" },
  { slug: "indic-ai-identity", title: "Indic AI & India identity", shortLabel: "Indic AI & KYC" },
  { slug: "crm-migration-competitors", title: "Switch from another CRM", shortLabel: "CRM migration" },
  { slug: "real-estate", title: "Real estate", shortLabel: "Real estate" },
  { slug: "manufacturing", title: "Manufacturing & distribution", shortLabel: "Manufacturing" },
  { slug: "ai-speech", title: "AI & speech intelligence", shortLabel: "AI & speech" },
  { slug: "crm-platforms", title: "CRM Platforms", shortLabel: "CRM Platforms" },
  { slug: "email-system-transactional", title: "Email — System / Transactional", shortLabel: "Email — System / Transactional" },
  { slug: "email-marketing-and-campaigns", title: "Email Marketing & Campaigns", shortLabel: "Email Marketing & Campaigns" },
  { slug: "sms-voice-telephony", title: "SMS / Voice / Telephony", shortLabel: "SMS / Voice / Telephony" },
  { slug: "calendar-and-meetings", title: "Calendar & Meetings", shortLabel: "Calendar & Meetings" },
  { slug: "payments", title: "Payments", shortLabel: "Payments" },
  { slug: "lead-gen-sources", title: "Lead-gen Sources", shortLabel: "Lead-gen Sources" },
  { slug: "chat-help-desk", title: "Chat / Help Desk", shortLabel: "Chat / Help Desk" },
  { slug: "logistics-shipping", title: "Logistics / Shipping", shortLabel: "Logistics / Shipping" },
  { slug: "workflow-automation-platforms", title: "Workflow / Automation Platforms", shortLabel: "Workflow / Automation Platforms" },
  { slug: "analytics-and-observability", title: "Analytics & Observability", shortLabel: "Analytics & Observability" },
  { slug: "accounting-erp", title: "Accounting / ERP", shortLabel: "Accounting / ERP" },
  { slug: "lead-enrichment", title: "Lead Enrichment", shortLabel: "Lead Enrichment" },
  { slug: "utility", title: "Utility", shortLabel: "Utility" },
  { slug: "backend-ready-integrations", title: "Backend-ready integrations", shortLabel: "Backend-ready integrations" },
  { slug: "education-lms", title: "Education / LMS", shortLabel: "Education / LMS" },
  { slug: "restaurant-pos-delivery", title: "Restaurant POS / Delivery", shortLabel: "Restaurant POS / Delivery" },
  { slug: "hospitality", title: "Hospitality", shortLabel: "Hospitality" },
  { slug: "pharma-healthcare", title: "Pharma / Healthcare", shortLabel: "Pharma / Healthcare" },
  { slug: "hr-payroll", title: "HR / Payroll", shortLabel: "HR / Payroll" },
  { slug: "indian-kyc-identity", title: "Indian KYC / Identity", shortLabel: "Indian KYC / Identity" },
  { slug: "indian-banking-and-payment", title: "Indian Banking & Payment", shortLabel: "Indian Banking & Payment" },
  { slug: "latam", title: "LATAM", shortLabel: "LATAM" },
  { slug: "middle-east", title: "Middle East", shortLabel: "Middle East" },
  { slug: "apac", title: "APAC", shortLabel: "APAC" },
  { slug: "advanced-sales-enrichment", title: "Advanced Sales / Enrichment", shortLabel: "Advanced Sales / Enrichment" },
  { slug: "marketing-automation", title: "Marketing Automation", shortLabel: "Marketing Automation" },
  { slug: "helpdesk-customer-success", title: "Helpdesk / Customer Success", shortLabel: "Helpdesk / Customer Success" },
  { slug: "sales-engagement-dialer", title: "Sales Engagement / Dialer", shortLabel: "Sales Engagement / Dialer" },
  { slug: "email-calendar-extras", title: "Email / Calendar Extras", shortLabel: "Email / Calendar Extras" },
  { slug: "esign-document", title: "ESign / Document", shortLabel: "ESign / Document" },
  { slug: "storage-file", title: "Storage / File", shortLabel: "Storage / File" },
  { slug: "webhook-workflow", title: "Webhook / Workflow", shortLabel: "Webhook / Workflow" },
  { slug: "survey-nps-feedback", title: "Survey / NPS / Feedback", shortLabel: "Survey / NPS / Feedback" },
  { slug: "project-task-management", title: "Project / Task Management", shortLabel: "Project / Task Management" },
  { slug: "other-vertical-misc", title: "Other Vertical / Misc", shortLabel: "Other Vertical / Misc" },
  { slug: "steps-for-engineering", title: "Steps for engineering", shortLabel: "Steps for engineering" },
  { slug: "what-customers-see", title: "What customers see", shortLabel: "What customers see" },
  { slug: "lead-sources", title: "Lead Sources", shortLabel: "Lead Sources" },
  { slug: "telephony", title: "Telephony", shortLabel: "Telephony" },
  { slug: "scheduling-and-video", title: "Scheduling & Video", shortLabel: "Scheduling & Video" },
  { slug: "email-and-inbox", title: "Email & Inbox", shortLabel: "Email & Inbox" },
  { slug: "messaging", title: "Messaging", shortLabel: "Messaging" },
  { slug: "crm-sync", title: "CRM Sync", shortLabel: "CRM Sync" },
  { slug: "automation-and-webhooks", title: "Automation & Webhooks", shortLabel: "Automation & Webhooks" },
  { slug: "commerce-and-payments", title: "Commerce & Payments", shortLabel: "Commerce & Payments" },
  { slug: "marketing-and-email", title: "Marketing & Email", shortLabel: "Marketing & Email" },
  { slug: "analytics-and-attribution", title: "Analytics & Attribution", shortLabel: "Analytics & Attribution" },
  { slug: "productivity-and-documents", title: "Productivity & Documents", shortLabel: "Productivity & Documents" },
  { slug: "kyc-and-compliance", title: "KYC & Compliance", shortLabel: "KYC & Compliance" },
  { slug: "support", title: "Support", shortLabel: "Support" },
  { slug: "ai-and-transcription", title: "AI & Transcription", shortLabel: "AI & Transcription" },
  { slug: "live-chat", title: "Live Chat", shortLabel: "Live Chat" },
  { slug: "other", title: "Other", shortLabel: "Other" },
  { slug: "voice-call-and-sms", title: "Voice, Call & SMS", shortLabel: "Voice, Call & SMS" },
  { slug: "live-chat-and-team-messaging", title: "Live Chat & Team Messaging", shortLabel: "Live Chat & Team Messaging" },
  { slug: "hospitality-and-travel", title: "Hospitality & Travel", shortLabel: "Hospitality & Travel" },
  { slug: "food-and-beverage-restaurant", title: "Food & Beverage / Restaurant", shortLabel: "Food & Beverage / Restaurant" },
  { slug: "erp-and-manufacturing", title: "ERP & Manufacturing", shortLabel: "ERP & Manufacturing" },
  { slug: "india-payments-and-fintech", title: "India Payments & Fintech", shortLabel: "India Payments & Fintech" },
  { slug: "india-kyc-and-government", title: "India KYC & Government", shortLabel: "India KYC & Government" },
  { slug: "south-and-east-asia", title: "South & East Asia", shortLabel: "South & East Asia" },
  { slug: "ai-llm", title: "AI / LLM", shortLabel: "AI / LLM" },
  { slug: "ipaas-and-automation", title: "iPaaS & Automation", shortLabel: "iPaaS & Automation" },
  { slug: "lead-enrichment-pro", title: "Lead Enrichment Pro", shortLabel: "Lead Enrichment Pro" },
  { slug: "maps-and-location", title: "Maps & Location", shortLabel: "Maps & Location" },
  { slug: "nps-and-surveys", title: "NPS & Surveys", shortLabel: "NPS & Surveys" },
  { slug: "files-and-storage", title: "Files & Storage", shortLabel: "Files & Storage" },
  { slug: "browser-and-desktop-extensions", title: "Browser & Desktop Extensions", shortLabel: "Browser & Desktop Extensions" },
  { slug: "developer-and-auth", title: "Developer & Auth", shortLabel: "Developer & Auth" },
  { slug: "coming-soon-ecommerce", title: "Coming Soon · eCommerce", shortLabel: "Coming Soon · eCommerce" },
  { slug: "coming-soon-accounting", title: "Coming Soon · Accounting", shortLabel: "Coming Soon · Accounting" },
  { slug: "coming-soon-hr-and-payroll", title: "Coming Soon · HR & Payroll", shortLabel: "Coming Soon · HR & Payroll" },
  { slug: "coming-soon-real-estate", title: "Coming Soon · Real Estate (Extras)", shortLabel: "Coming Soon · Real Estate (Extras)" },
  { slug: "coming-soon-customer-data-platforms", title: "Coming Soon · Customer Data Platforms", shortLabel: "Coming Soon · Customer Data Platforms" },
  { slug: "coming-soon-gifting-and-direct-mail", title: "Coming Soon · Gifting & Direct Mail", shortLabel: "Coming Soon · Gifting & Direct Mail" },
  { slug: "coming-soon-document-and-signing", title: "Coming Soon · Document & Signing", shortLabel: "Coming Soon · Document & Signing" },
  { slug: "coming-soon-helpdesk-extras", title: "Coming Soon · Helpdesk Extras", shortLabel: "Coming Soon · Helpdesk Extras" },
  { slug: "coming-soon-identity-and-auth", title: "Coming Soon · Identity & Auth", shortLabel: "Coming Soon · Identity & Auth" },
  { slug: "coming-soon-social-media-extras", title: "Coming Soon · Social Media Extras", shortLabel: "Coming Soon · Social Media Extras" },
  { slug: "coming-soon-more-crms", title: "Coming Soon · More CRMs", shortLabel: "Coming Soon · More CRMs" },
  { slug: "coming-soon-more-email-marketing", title: "Coming Soon · More Email Marketing", shortLabel: "Coming Soon · More Email Marketing" },
  { slug: "coming-soon-product-ux-analytics", title: "Coming Soon · Product / UX Analytics", shortLabel: "Coming Soon · Product / UX Analytics" },
  { slug: "coming-soon-finance-and-spend", title: "Coming Soon · Finance & Spend", shortLabel: "Coming Soon · Finance & Spend" },
  { slug: "coming-soon-design-and-creative", title: "Coming Soon · Design & Creative", shortLabel: "Coming Soon · Design & Creative" },
  { slug: "coming-soon-dev-tools-and-code", title: "Coming Soon · Dev Tools & Code", shortLabel: "Coming Soon · Dev Tools & Code" },
  { slug: "coming-soon-hr-and-recruiting-extras", title: "Coming Soon · HR & Recruiting Extras", shortLabel: "Coming Soon · HR & Recruiting Extras" },
  { slug: "coming-soon-events-and-webinars", title: "Coming Soon · Events & Webinars", shortLabel: "Coming Soon · Events & Webinars" },
  { slug: "coming-soon-security-and-compliance", title: "Coming Soon · Security & Compliance", shortLabel: "Coming Soon · Security & Compliance" },
  { slug: "coming-soon-ai-coding-and-productivity", title: "Coming Soon · AI Coding & Productivity", shortLabel: "Coming Soon · AI Coding & Productivity" },
  { slug: "coming-soon-payment-gateways", title: "Coming Soon · Payment Gateways", shortLabel: "Coming Soon · Payment Gateways" },
  { slug: "coming-soon-whatsapp-and-sms-providers", title: "Coming Soon · WhatsApp & SMS Providers", shortLabel: "Coming Soon · WhatsApp & SMS Providers" },
  { slug: "coming-soon-scheduling-extras", title: "Coming Soon · Scheduling Extras", shortLabel: "Coming Soon · Scheduling Extras" },
  { slug: "coming-soon-pm-and-task-extras", title: "Coming Soon · PM & Task Extras", shortLabel: "Coming Soon · PM & Task Extras" },
  { slug: "coming-soon-retail-restaurant-pos", title: "Coming Soon · Retail / Restaurant POS", shortLabel: "Coming Soon · Retail / Restaurant POS" },
  { slug: "coming-soon-marketing-attribution", title: "Coming Soon · Marketing Attribution", shortLabel: "Coming Soon · Marketing Attribution" },
  { slug: "coming-soon-dam-and-brand-assets", title: "Coming Soon · DAM & Brand Assets", shortLabel: "Coming Soon · DAM & Brand Assets" },
  { slug: "coming-soon-conversation-intelligence", title: "Coming Soon · Conversation Intelligence", shortLabel: "Coming Soon · Conversation Intelligence" },
  { slug: "coming-soon-people-mgmt-and-engagement", title: "Coming Soon · People Mgmt & Engagement", shortLabel: "Coming Soon · People Mgmt & Engagement" },
];

// Source: hellocrmwebsite/src/lib/integrations-catalog-data.ts (merged
// INTEGRATIONS_CATALOG, 630 entries) — SYNCED_AT 2026-06-17
const INTEGRATIONS: IntegrationRecord[] = [
  // ── Email marketing & CRM sync (7) ──
  { slug: "mailchimp", name: "Mailchimp", category: "email-marketing", description: "Syncs CRM leads and contacts to Mailchimp audiences with a one-way push.", route: "/integrations/mailchimp" },
  { slug: "brevo", name: "Brevo (Sendinblue)", category: "email-marketing", description: "Creates and updates contacts in Brevo lists with field mapping and tags.", route: "/integrations/brevo" },
  { slug: "klaviyo", name: "Klaviyo", category: "email-marketing", description: "Pushes customer profiles and CRM lifecycle events (lead created, deal won, etc.) to Klaviyo.", route: "/integrations/klaviyo" },
  { slug: "constant-contact", name: "Constant Contact", category: "email-marketing", description: "Syncs CRM contacts to Constant Contact lists for email campaigns, event marketing, and list segmentation with field mapping.", route: "/integrations/constant-contact" },
  { slug: "sendgrid", name: "SendGrid", category: "email-marketing", description: "High-volume transactional and marketing email delivery with CRM-triggered sends and bounce/engagement webhooks.", route: "/integrations/sendgrid" },
  { slug: "activecampaign", name: "ActiveCampaign", category: "email-marketing", description: "Contact sync and marketing automation triggers so CRM stages and tags drive ActiveCampaign automations.", route: "/integrations/activecampaign" },
  { slug: "resend", name: "Resend Email API", category: "email-marketing", description: "Developer-friendly transactional email API with high deliverability for CRM notifications and system mail.", route: "/integrations/resend" },

  // ── Communication & messaging (11) ──
  { slug: "slack", name: "Slack", category: "communication", description: "Rich CRM notifications in Slack channels (new leads, deal updates, task reminders).", route: "/integrations/slack" },
  { slug: "discord", name: "Discord", category: "communication", description: "CRM notifications with rich embeds via webhook to your server channels.", route: "/integrations/discord" },
  { slug: "microsoft-teams", name: "Microsoft Teams", category: "communication", description: "Adaptive Card notifications in Teams channels for CRM events and deep links to records.", route: "/integrations/microsoft-teams" },
  { slug: "whatsapp-meta", name: "WhatsApp Business API", category: "communication", description: "Template messages with delivery tracking; send and receive WhatsApp conversations with leads (sent, delivered, read).", route: "/integrations/whatsapp" },
  { slug: "intercom", name: "Intercom", category: "communication", description: "Creates and updates Intercom contacts from CRM records; adds internal notes for support context.", route: "/integrations/intercom" },
  { slug: "gmail-google-workspace", name: "Gmail & Google Workspace", category: "communication", description: "Gmail, Calendar, Sheets, and Drive integration: mailbox sync to leads and contacts plus Workspace productivity context alongside pipeline work.", route: "/integrations/gmail" },
  { slug: "outlook-microsoft-365", name: "Microsoft Outlook", category: "communication", description: "Outlook email and calendar sync: mailboxes on Microsoft 365 log to CRM records with deals and contacts; pairs with Outlook Calendar for meetings.", route: "/integrations/outlook-microsoft-365" },
  { slug: "instagram-facebook-messenger", name: "Instagram & Facebook Messenger", category: "communication", description: "Social messaging integration: route Meta inbox conversations into CRM threads with contact linkage.", route: "/integrations/instagram-facebook-messenger" },
  { slug: "telegram-bot", name: "Telegram Bot", category: "communication", description: "Bot integration for messaging and notifications from CRM events to Telegram chats or channels.", route: "/integrations/telegram-bot" },
  { slug: "crisp-tidio", name: "Crisp & Tidio", category: "communication", description: "Third-party live chat integration: sync visitors and transcripts into CRM leads and activities.", route: "/integrations/crisp-tidio" },
  { slug: "built-in-live-chat-widget", name: "Built-in Live Chat Widget", category: "communication", description: "Embeddable on-site chat with AI auto-responses and human handoff to CRM owners.", route: "/integrations/built-in-live-chat-widget" },

  // ── Voice & telephony (5) ──
  { slug: "twilio", name: "Twilio (Voice, SMS, SIP)", category: "voice-telephony", description: "Browser calling, SMS, recording, and SIP trunking for programmable voice and messaging with full CRM logging.", route: "/integrations/twilio" },
  { slug: "elevenlabs", name: "ElevenLabs AI Voice", category: "voice-telephony", description: "Ultra-realistic AI voice agents for automated outbound and inbound call flows.", route: "/integrations/elevenlabs" },
  { slug: "vapi", name: "Vapi AI Voice", category: "voice-telephony", description: "AI voice agent platform for automated outbound calls and conversational telephony.", route: "/integrations/vapi" },
  { slug: "exotel", name: "Exotel", category: "voice-telephony", description: "Cloud telephony for Indian businesses: virtual numbers, IVR, and call flows integrated with CRM activity.", route: "/integrations/exotel" },
  { slug: "myoperator", name: "MyOperator", category: "voice-telephony", description: "Cloud call center for Indian SMBs with distributed agents and CRM-tied call analytics.", route: "/integrations/myoperator" },

  // ── Calendar & scheduling (5) ──
  { slug: "google-calendar", name: "Google Calendar", category: "calendar", description: "Two-way sync of events; can auto-generate Google Meet links for meetings.", route: "/integrations/google-calendar" },
  { slug: "outlook-calendar", name: "Outlook Calendar", category: "calendar", description: "Syncs events with Microsoft Outlook.", route: "/integrations/outlook-calendar" },
  { slug: "calendly", name: "Calendly", category: "calendar", description: "Ingests bookings as CRM activities and leads via webhook.", route: "/integrations/calendly" },
  { slug: "cal-com", name: "Cal.com", category: "calendar", description: "Same pattern as Calendly — bookings ingested with deduplication rules.", route: "/integrations/cal-com" },
  { slug: "zoom-google-meet", name: "Zoom & Google Meet", category: "calendar", description: "Video meeting scheduling: generate and sync conference links with CRM activities (Zoom and Google Meet).", route: "/integrations/google-meet" },

  // ── Analytics & ad tracking (3) ──
  { slug: "google-ads-offline", name: "Google Ads", category: "analytics-ads", description: "Offline conversions and performance data: upload CRM milestones (qualified lead, won deal) to Google Ads using GCLID.", route: "/integrations/google-ads-offline" },
  { slug: "meta-capi", name: "Meta Conversions API (CAPI)", category: "analytics-ads", description: "Server-side events to Meta with hashed user data for attribution.", route: "/integrations/meta-capi" },
  { slug: "ga4-measurement", name: "Google Analytics (GA4)", category: "analytics-ads", description: "GA4 Measurement Protocol: send CRM lifecycle events (e.g.", route: "/integrations/ga4-measurement" },

  // ── Lead capture (7) ──
  { slug: "meta-lead-ads", name: "Meta Lead Ads", category: "lead-capture", description: "Auto-ingest leads from Meta Lead Ads (Facebook and Instagram) with campaign and form attribution.", route: "/integrations/meta-ads" },
  { slug: "google-lead-forms", name: "Google Lead Forms", category: "lead-capture", description: "Auto-ingest leads from Google Ads lead form extensions and in-ad capture.", route: "/integrations/google-lead-forms" },
  { slug: "indiamart", name: "IndiaMART", category: "lead-capture", description: "Auto-imports buyer inquiries from IndiaMART Lead Manager into CRM leads with source attribution.", route: "/integrations/indiamart" },
  { slug: "justdial", name: "JustDial", category: "lead-capture", description: "Turns JustDial notification emails into CRM leads via forwarding rules or a direct webhook POST to the ingestion URL shown in the app.", route: "/integrations/justdial" },
  { slug: "linkedin-lead-gen", name: "LinkedIn Lead Gen", category: "lead-capture", description: "B2B lead capture from LinkedIn Lead Gen Forms and sponsored campaigns into CRM with UTM and campaign IDs.", route: "/integrations/linkedin-lead-gen" },
  { slug: "form-tools-typeform-tally-google", name: "Typeform, Tally.so & Google Forms", category: "lead-capture", description: "Form submission ingestion to CRM leads via native connectors or webhooks (Typeform, Tally.so, Google Forms).", route: "/integrations/form-tools-typeform-tally-google" },
  { slug: "lead-enrichment-providers", name: "Apollo, Hunter, Clearbit, ZoomInfo, Lusha & Snov.io", category: "lead-capture", description: "Lead data enrichment from 6+ providers: firmographics, verified emails, and social profiles on CRM records.", route: "/integrations/lead-enrichment-providers" },

  // ── Automation & webhooks (5) ──
  { slug: "zapier", name: "Zapier", category: "automation", description: "Connects the CRM to thousands of apps via outbound webhooks and triggers.", route: "/integrations/zapier" },
  { slug: "make-com", name: "Make.com", category: "automation", description: "Make.com (formerly Integromat) lets you build visual scenarios that connect HelloGrowthCRM to thousands of apps using modules, webhooks, and routers—with branching and error handling beyond simple one-step automations.", route: "/integrations/make-com" },
  { slug: "integrately", name: "Integrately", category: "automation", description: "One-click automation recipes connecting HelloGrowthCRM webhooks and REST API to popular SaaS tools with minimal setup.", route: "/integrations/integrately" },
  { slug: "google-sheets-sync", name: "Google Sheets Sync", category: "automation", description: "Pushes CRM reports or record lists to Google Sheets on a schedule, or ingests rows as leads via a mapped sheet and webhook.", route: "/integrations/google-sheets-sync" },
  { slug: "hubspot-migration", name: "HubSpot Migration Tool", category: "automation", description: "Guided migration from HubSpot: contacts, companies, deals, owners, and pipelines are mapped into HelloGrowthCRM with deduplication and stage mapping.", route: "/integrations/hubspot-migration" },

  // ── CRM platform sync (4) ──
  { slug: "hubspot-sync", name: "HubSpot Sync", category: "crm-platform-sync", description: "Bidirectional contact and deal sync with HubSpot so both systems stay aligned during coexistence or phased migration.", route: "/integrations/hubspot-sync" },
  { slug: "salesforce-sync", name: "Salesforce Sync", category: "crm-platform-sync", description: "Enterprise CRM sync for accounts, contacts, opportunities, and activities with field-level mapping.", route: "/integrations/salesforce-sync" },
  { slug: "pipedrive-sync", name: "Pipedrive Sync", category: "crm-platform-sync", description: "Contact and deal sync with Pipedrive pipelines, stages, and owners.", route: "/integrations/pipedrive-sync" },
  { slug: "multi-crm-sync-zoho-freshsales-copper-insightly", name: "Freshsales, Zoho, Copper & Insightly", category: "crm-platform-sync", description: "Multi-CRM bidirectional sync for popular SMB platforms including Zoho CRM, Freshsales, Copper, and Insightly.", route: "/integrations/multi-crm-sync-zoho-freshsales-copper-insightly" },

  // ── Project management & support (7) ──
  { slug: "jira", name: "Jira", category: "pm-support", description: "Creates Jira issues from CRM tasks for engineering and bug tracking.", route: "/integrations/jira" },
  { slug: "linear", name: "Linear", category: "pm-support", description: "Creates Linear issues from CRM tasks via the GraphQL API.", route: "/integrations/linear" },
  { slug: "zendesk", name: "Zendesk", category: "pm-support", description: "Creates support tickets from CRM records.", route: "/integrations/zendesk" },
  { slug: "freshdesk", name: "Freshdesk", category: "pm-support", description: "Creates Freshdesk tickets from CRM records.", route: "/integrations/freshdesk" },
  { slug: "notion", name: "Notion", category: "pm-support", description: "Pushes CRM data to Notion databases with custom field mapping.", route: "/integrations/notion" },
  { slug: "asana", name: "Asana", category: "pm-support", description: "Creates and updates Asana tasks and projects from CRM deals and tasks; syncs status and due dates so implementation and sales stay aligned.", route: "/integrations/asana" },
  { slug: "airtable", name: "Airtable", category: "pm-support", description: "Push CRM data to Airtable bases and tables for stakeholder views, partner reporting, and lightweight apps.", route: "/integrations/airtable" },

  // ── E-signatures (3) ──
  { slug: "docusign", name: "DocuSign", category: "e-sign", description: "Send documents for e-signature and track status (sent, viewed, signed, declined).", route: "/integrations/docusign" },
  { slug: "zoho-sign", name: "Zoho Sign", category: "e-sign", description: "E-signature workflows with status tracking, similar to DocuSign.", route: "/integrations/zoho-sign" },
  { slug: "signeasy", name: "Signeasy", category: "e-sign", description: "Digital document signing with mobile-friendly flows and status synced back to CRM records.", route: "/integrations/signeasy" },

  // ── eCommerce (10) ──
  { slug: "shopify", name: "Shopify", category: "ecommerce", description: "Syncs customers, products, orders, abandoned carts, and order history.", route: "/integrations/shopify" },
  { slug: "stripe", name: "Stripe", category: "ecommerce", description: "Syncs payment status, failed charges, refunds, and transaction history.", route: "/integrations/stripe" },
  { slug: "razorpay", name: "Razorpay", category: "ecommerce", description: "Payment events with HMAC-SHA256 webhook verification.", route: "/integrations/razorpay" },
  { slug: "woocommerce", name: "WooCommerce", category: "ecommerce", description: "Syncs WooCommerce customers, orders, products, and abandoned carts to HelloGrowthCRM so sales and support see full purchase history on the contact record.", route: "/integrations/woocommerce" },
  { slug: "paypal", name: "PayPal", category: "ecommerce", description: "International payment capture and status sync for PayPal transactions linked to CRM accounts and orders.", route: "/integrations/paypal" },
  { slug: "cashfree", name: "Cashfree", category: "ecommerce", description: "Indian payments with UPI, cards, and netbanking; webhooks update CRM payment status on orders and invoices.", route: "/integrations/cashfree" },
  { slug: "phonepe", name: "PhonePe", category: "ecommerce", description: "UPI payment collection for invoices and payment links with CRM-tied settlement status.", route: "/integrations/phonepe" },
  { slug: "instamojo", name: "Instamojo", category: "ecommerce", description: "Payment links and storefront checkout for Indian SMBs; sync paid orders and customers into CRM.", route: "/integrations/instamojo" },
  { slug: "bigcommerce", name: "BigCommerce", category: "ecommerce", description: "Connects HelloGrowthCRM with BigCommerce for ecommerce workflows.", status: "live", route: "/integrations/bigcommerce" },
  { slug: "wix", name: "Wix", category: "ecommerce", description: "Connects HelloGrowthCRM with Wix for ecommerce workflows.", status: "live", route: "/integrations/wix" },

  // ── Accounting & finance (9) ──
  { slug: "quickbooks", name: "QuickBooks Online", category: "accounting", description: "Syncs customers, invoices, payments, and items between HelloGrowthCRM and QuickBooks Online for aligned AR and revenue recognition.", route: "/integrations/quickbooks" },
  { slug: "xero", name: "Xero", category: "accounting", description: "Connects contacts and invoices to Xero (UK, AU, NZ, global) so finance and sales share one customer record and payment status.", route: "/integrations/xero" },
  { slug: "freshbooks", name: "FreshBooks", category: "accounting", description: "Creates and updates FreshBooks clients and invoices from CRM accounts and won deals, with payment status sync.", route: "/integrations/freshbooks" },
  { slug: "wave-accounting", name: "Wave Accounting", category: "accounting", description: "Syncs CRM contacts to Wave customers and pushes invoice events for simple AR tracking for very small businesses.", route: "/integrations/wave-accounting" },
  { slug: "tally", name: "Tally (India)", category: "accounting", description: "Imports or exports ledger-aligned customer and invoice data with TallyPrime / Tally ERP via bridge or file connector for Indian GST compliance.", route: "/integrations/tally" },
  { slug: "zoho-books", name: "Zoho Books", category: "accounting", description: "Accounting software sync for contacts, estimates, invoices, and payments alongside Zoho ecosystem tools.", route: "/integrations/zoho-books" },
  { slug: "gstin-pan-verification", name: "GSTIN & PAN Verification", category: "accounting", description: "KYC compliance for Indian businesses: validate GSTIN and PAN before high-value deals or invoicing.", route: "/integrations/gstin-pan-verification" },
  { slug: "quickbooks-online", name: "QuickBooks Online", category: "accounting", description: "Two-way customer & invoice sync with QuickBooks Online.", status: "live", route: "/integrations/quickbooks-online" },
  { slug: "myob", name: "MYOB", category: "accounting", description: "Two-way customer & invoice sync with MYOB accounting.", status: "live", route: "/integrations/myob" },

  // ── Indic AI & India identity (4) ──
  { slug: "sarvam-ai", name: "Sarvam AI", category: "indic-ai-identity", description: "Indic-language voice notes, speech-to-text transcription, and regional-language AI across Hindi, Tamil, Telugu, and 9 more languages.", status: "live", route: "/integrations/sarvam-ai" },
  { slug: "digilocker", name: "DigiLocker", category: "indic-ai-identity", description: "Paperless KYC via India's government-backed document platform — pull verified Aadhaar, PAN, driving licence, and other documents directly into CRM records.", status: "live", route: "/integrations/digilocker" },
  { slug: "hyperverge", name: "HyperVerge", category: "indic-ai-identity", description: "AI-powered face match and document OCR for fast KYC — verify selfies against Aadhaar or PAN photos and extract structured data from ID documents.", status: "live", route: "/integrations/hyperverge" },
  { slug: "cleartax", name: "ClearTax", category: "indic-ai-identity", description: "GST-compliant invoice generation, GSTIN validation, and e-invoicing (IRN) directly from CRM deals — no separate tax portal login needed.", status: "live", route: "/integrations/cleartax" },

  // ── Switch from another CRM (5) ──
  { slug: "microsoft-dynamics-365", name: "Microsoft Dynamics 365", category: "crm-migration-competitors", description: "Migrate contacts, accounts, opportunities, activities, and custom fields from Microsoft Dynamics 365 to HelloGrowthCRM with full field mapping and historical data.", status: "live", route: "/integrations/microsoft-dynamics-365" },
  { slug: "monday-com", name: "Monday.com", category: "crm-migration-competitors", description: "Migrate boards, items, contacts, and pipeline data from Monday.com CRM to HelloGrowthCRM — converting Monday's board structure to CRM pipelines.", status: "live", route: "/integrations/monday-com" },
  { slug: "freshsales-migration", name: "Freshsales", category: "crm-migration-competitors", description: "Migrate leads, contacts, accounts, deals, emails, notes, and activities from Freshsales to HelloGrowthCRM with owner attribution and timeline preserved.", status: "live", route: "/integrations/freshsales-migration" },
  { slug: "copper-crm-migration", name: "Copper CRM", category: "crm-migration-competitors", description: "Migrate Copper CRM contacts, opportunities, activities, and Google Workspace-linked data to HelloGrowthCRM.", status: "live", route: "/integrations/copper-crm-migration" },
  { slug: "insightly-migration", name: "Insightly", category: "crm-migration-competitors", description: "Migrate Insightly contacts, leads, opportunities, projects, and custom fields to HelloGrowthCRM with relationship mapping preserved.", status: "live", route: "/integrations/insightly-migration" },

  // ── Real estate (65) ──
  { slug: "99acres", name: "99acres", category: "real-estate", description: "Ingests property inquiry leads from the 99acres portal.", route: "/integrations/99acres" },
  { slug: "magicbricks", name: "MagicBricks", category: "real-estate", description: "Syncs leads from MagicBricks listings.", route: "/integrations/magicbricks" },
  { slug: "housing-com", name: "Housing.com", category: "real-estate", description: "Captures leads from Housing.com listings with webhook ingestion.", route: "/integrations/housing-com" },
  { slug: "google-maps-api", name: "Google Maps API", category: "real-estate", description: "Embeds maps on property or project pages and supports directions for site visits.", route: "/integrations/google-maps-api" },
  { slug: "nobroker", name: "NoBroker", category: "real-estate", description: "Creates a planned NoBroker integration page for HelloGrowthCRM so teams can discover Indian rental marketplace workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/nobroker" },
  { slug: "commonfloor", name: "CommonFloor", category: "real-estate", description: "Creates a planned CommonFloor integration page for HelloGrowthCRM so teams can discover Indian real-estate portal workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/commonfloor" },
  { slug: "mmt-b2b", name: "MMT B2B", category: "real-estate", description: "Creates a planned MMT B2B integration page for HelloGrowthCRM so teams can discover India travel/property B2B workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/mmt-b2b" },
  { slug: "quikr-homes", name: "Quikr Homes", category: "real-estate", description: "Creates a planned Quikr Homes integration page for HelloGrowthCRM so teams can discover Indian classifieds (real estate) workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/quikr-homes" },
  { slug: "olx-real-estate", name: "OLX Real Estate", category: "real-estate", description: "Creates a planned OLX Real Estate integration page for HelloGrowthCRM so teams can discover India classifieds (real estate) workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/olx-real-estate" },
  { slug: "sulekha-real-estate", name: "Sulekha Real Estate", category: "real-estate", description: "Creates a planned Sulekha Real Estate integration page for HelloGrowthCRM so teams can discover Indian local services workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/sulekha-real-estate" },
  { slug: "proptiger", name: "PropTiger", category: "real-estate", description: "Creates a planned PropTiger integration page for HelloGrowthCRM so teams can discover Indian real-estate portal workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/proptiger" },
  { slug: "proptiger-builder", name: "PropTiger Builder", category: "real-estate", description: "Creates a planned PropTiger Builder integration page for HelloGrowthCRM so teams can discover Builder-specific portal workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/proptiger-builder" },
  { slug: "squareyards", name: "SquareYards", category: "real-estate", description: "Creates a planned SquareYards integration page for HelloGrowthCRM so teams can discover Indian real-estate portal workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/squareyards" },
  { slug: "makaan", name: "Makaan", category: "real-estate", description: "Creates a planned Makaan integration page for HelloGrowthCRM so teams can discover Indian real-estate portal workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/makaan" },
  { slug: "re-locality", name: "RE Locality", category: "real-estate", description: "Creates a planned RE Locality integration page for HelloGrowthCRM so teams can discover Generic locality data sync workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/re-locality" },
  { slug: "realtor-com", name: "Realtor.com", category: "real-estate", description: "Creates a planned Realtor.com integration page for HelloGrowthCRM so teams can discover US real-estate portal workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/realtor-com" },
  { slug: "zillow", name: "Zillow", category: "real-estate", description: "Creates a planned Zillow integration page for HelloGrowthCRM so teams can discover US real-estate portal workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/zillow" },
  { slug: "realscout", name: "Realscout", category: "real-estate", description: "Creates a planned Realscout integration page for HelloGrowthCRM so teams can discover US real-estate buyer platform workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/realscout" },
  { slug: "real-geeks", name: "Real Geeks", category: "real-estate", description: "Creates a planned Real Geeks integration page for HelloGrowthCRM so teams can discover US real-estate CRM (sync + webhook) workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/real-geeks" },
  { slug: "realpage", name: "RealPage", category: "real-estate", description: "Creates a planned RealPage integration page for HelloGrowthCRM so teams can discover US property management workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/realpage" },
  { slug: "rentspree", name: "Rentspree", category: "real-estate", description: "Creates a planned Rentspree integration page for HelloGrowthCRM so teams can discover US rental marketplace workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/rentspree" },
  { slug: "roomkey", name: "Roomkey", category: "real-estate", description: "Creates a planned Roomkey integration page for HelloGrowthCRM so teams can discover Hospitality / rental workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/roomkey" },
  { slug: "sierra-interactive", name: "Sierra Interactive", category: "real-estate", description: "Creates a planned Sierra Interactive integration page for HelloGrowthCRM so teams can discover US real-estate CRM workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/sierra-interactive" },
  { slug: "skyslope", name: "Skyslope", category: "real-estate", description: "Creates a planned Skyslope integration page for HelloGrowthCRM so teams can discover US real-estate transaction workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/skyslope" },
  { slug: "spark", name: "Spark", category: "real-estate", description: "Creates a planned Spark integration page for HelloGrowthCRM so teams can discover US real-estate platform workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/spark" },
  { slug: "trestle", name: "Trestle", category: "real-estate", description: "Creates a planned Trestle integration page for HelloGrowthCRM so teams can discover Real-estate listing API workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/trestle" },
  { slug: "vulcan7", name: "Vulcan7", category: "real-estate", description: "Creates a planned Vulcan7 integration page for HelloGrowthCRM so teams can discover US real-estate prospecting workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/vulcan7" },
  { slug: "wise-agent", name: "Wise Agent", category: "real-estate", description: "Creates a planned Wise Agent integration page for HelloGrowthCRM so teams can discover US real-estate CRM workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/wise-agent" },
  { slug: "ylopo", name: "Ylopo", category: "real-estate", description: "Creates a planned Ylopo integration page for HelloGrowthCRM so teams can discover US real-estate ad platform workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/ylopo" },
  { slug: "zurple", name: "Zurple", category: "real-estate", description: "Creates a planned Zurple integration page for HelloGrowthCRM so teams can discover US real-estate lead-gen workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/zurple" },
  { slug: "boldtrail", name: "Boldtrail (formerly Sierra)", category: "real-estate", description: "Creates a planned Boldtrail (formerly Sierra) integration page for HelloGrowthCRM so teams can discover US real-estate workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/boldtrail" },
  { slug: "boomtown", name: "BoomTown", category: "real-estate", description: "Creates a planned BoomTown integration page for HelloGrowthCRM so teams can discover US real-estate CRM workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/boomtown" },
  { slug: "cinc", name: "CINC", category: "real-estate", description: "Creates a planned CINC integration page for HelloGrowthCRM so teams can discover US real-estate CRM workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/cinc" },
  { slug: "liondesk", name: "LionDesk", category: "real-estate", description: "Creates a planned LionDesk integration page for HelloGrowthCRM so teams can discover US real-estate CRM workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/liondesk" },
  { slug: "lofty", name: "Lofty", category: "real-estate", description: "Creates a planned Lofty integration page for HelloGrowthCRM so teams can discover US real-estate CRM workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/lofty" },
  { slug: "kvcore", name: "kvCORE", category: "real-estate", description: "Creates a planned kvCORE integration page for HelloGrowthCRM so teams can discover US real-estate CRM workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/kvcore" },
  { slug: "top-producer", name: "Top Producer", category: "real-estate", description: "Creates a planned Top Producer integration page for HelloGrowthCRM so teams can discover US real-estate CRM workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/top-producer" },
  { slug: "marketleader", name: "Marketleader", category: "real-estate", description: "Creates a planned Marketleader integration page for HelloGrowthCRM so teams can discover US real-estate CRM workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/marketleader" },
  { slug: "fub", name: "FUB (Follow Up Boss)", category: "real-estate", description: "Creates a planned FUB (Follow Up Boss) integration page for HelloGrowthCRM so teams can discover US real-estate CRM workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/fub" },
  { slug: "propertybase", name: "Propertybase", category: "real-estate", description: "Creates a planned Propertybase integration page for HelloGrowthCRM so teams can discover Salesforce-based real-estate CRM workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/propertybase" },
  { slug: "buildium", name: "Buildium", category: "real-estate", description: "Creates a planned Buildium integration page for HelloGrowthCRM so teams can discover Property management workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/buildium" },
  { slug: "yardi", name: "Yardi", category: "real-estate", description: "Creates a planned Yardi integration page for HelloGrowthCRM so teams can discover Property management workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/yardi" },
  { slug: "appfolio", name: "Appfolio", category: "real-estate", description: "Creates a planned Appfolio integration page for HelloGrowthCRM so teams can discover Property management workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/appfolio" },
  { slug: "showcase-idx", name: "Showcase IDX", category: "real-estate", description: "Creates a planned Showcase IDX integration page for HelloGrowthCRM so teams can discover IDX listing display workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/showcase-idx" },
  { slug: "listhub", name: "ListHub", category: "real-estate", description: "Creates a planned ListHub integration page for HelloGrowthCRM so teams can discover Listing distribution workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/listhub" },
  { slug: "idx-broker", name: "IDX Broker", category: "real-estate", description: "Creates a planned IDX Broker integration page for HelloGrowthCRM so teams can discover IDX feeds workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/idx-broker" },
  { slug: "stessa", name: "Stessa", category: "real-estate", description: "Creates a planned Stessa integration page for HelloGrowthCRM so teams can discover Real-estate accounting workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/stessa" },
  { slug: "homebot", name: "Homebot", category: "real-estate", description: "Creates a planned Homebot integration page for HelloGrowthCRM so teams can discover Homeowner CRM workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/homebot" },
  { slug: "homecoin", name: "Homecoin", category: "real-estate", description: "Creates a planned Homecoin integration page for HelloGrowthCRM so teams can discover DIY listing workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/homecoin" },
  { slug: "snapdocs", name: "Snapdocs", category: "real-estate", description: "Creates a planned Snapdocs integration page for HelloGrowthCRM so teams can discover Mortgage closing workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/snapdocs" },
  { slug: "encompass", name: "Encompass", category: "real-estate", description: "Creates a planned Encompass integration page for HelloGrowthCRM so teams can discover Mortgage origination workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/encompass" },
  { slug: "qualia", name: "Qualia", category: "real-estate", description: "Creates a planned Qualia integration page for HelloGrowthCRM so teams can discover Title & closing workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/qualia" },
  { slug: "bridge", name: "Bridge", category: "real-estate", description: "Creates a planned Bridge integration page for HelloGrowthCRM so teams can discover Real-estate listing API workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/bridge" },
  { slug: "mri-software", name: "MRI Software", category: "real-estate", description: "Creates a planned MRI Software integration page for HelloGrowthCRM so teams can discover Property management workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/mri-software" },
  { slug: "sageintacct", name: "Sageintacct", category: "real-estate", description: "Creates a planned Sageintacct integration page for HelloGrowthCRM so teams can discover Real-estate accounting workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/sageintacct" },
  { slug: "dotloop", name: "Dotloop", category: "real-estate", description: "Creates a planned Dotloop integration page for HelloGrowthCRM so teams can discover Transaction management workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/dotloop" },
  { slug: "revaluate", name: "Revaluate", category: "real-estate", description: "Creates a planned Revaluate integration page for HelloGrowthCRM so teams can discover Lead intelligence workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/revaluate" },
  { slug: "avail", name: "Avail", category: "real-estate", description: "Creates a planned Avail integration page for HelloGrowthCRM so teams can discover Rental property mgmt workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/avail" },
  { slug: "home-co-in", name: "Home.co.in", category: "real-estate", description: "India property search portal", status: "live", route: "/integrations/home-co-in" },
  { slug: "follow-up-boss", name: "Follow Up Boss", category: "real-estate", description: "US real estate CRM & lead management", status: "live", route: "/integrations/follow-up-boss" },
  { slug: "market-leader", name: "Market Leader", category: "real-estate", description: "US real estate lead generation", status: "live", route: "/integrations/market-leader" },
  { slug: "rechat", name: "Rechat", category: "real-estate", description: "US real estate marketing platform", status: "live", route: "/integrations/rechat" },
  { slug: "redx", name: "REDX", category: "real-estate", description: "US real estate lead generation", status: "live", route: "/integrations/redx" },
  { slug: "smartzip", name: "SmartZip", category: "real-estate", description: "US real estate predictive analytics", status: "live", route: "/integrations/smartzip" },
  { slug: "offrs", name: "Offrs", category: "real-estate", description: "US real estate seller leads", status: "live", route: "/integrations/offrs" },

  // ── Manufacturing & distribution (6) ──
  { slug: "erpnext", name: "ERPNext", category: "manufacturing", description: "Syncs customers, quotations, orders, invoices, items, stock, warehouses, and payment status.", route: "/integrations/erpnext" },
  { slug: "zoho-inventory", name: "Zoho Inventory", category: "manufacturing", description: "Items, stock, warehouses, orders, packages, and shipments.", route: "/integrations/zoho-inventory" },
  { slug: "unicommerce", name: "Unicommerce", category: "manufacturing", description: "Marketplace orders, inventory, fulfillment, returns, and channel data.", route: "/integrations/unicommerce" },
  { slug: "shiprocket", name: "Shiprocket", category: "manufacturing", description: "Order shipment status, courier assignment, tracking milestones, and exception visibility inside CRM timelines.", route: "/integrations/shiprocket" },
  { slug: "delhivery", name: "Delhivery", category: "manufacturing", description: "Shipment tracking with AWB, status, NDR, returns, and ETA.", route: "/integrations/delhivery" },
  { slug: "bluedart", name: "BlueDart", category: "manufacturing", description: "Waybill tracking, delivery attempts, POD, and returns.", route: "/integrations/bluedart" },

  // ── AI & speech intelligence (5) ──
  { slug: "openai-google-gemini", name: "OpenAI & Google Gemini", category: "ai-speech", description: "AI models powering CRM features: drafting, classification, summarization, and workflow copilots.", route: "/integrations/openai-google-gemini" },
  { slug: "deepgram-assemblyai", name: "Deepgram & AssemblyAI", category: "ai-speech", description: "AI call transcription and diarization for dialer recordings with searchable text in CRM.", route: "/integrations/deepgram-assemblyai" },
  { slug: "openai", name: "OpenAI", category: "ai-speech", description: "Custom OpenAI key for tenant's AI features", status: "live", route: "/integrations/openai" },
  { slug: "assemblyai", name: "AssemblyAI", category: "ai-speech", description: "Call transcription", status: "live", route: "/integrations/assemblyai" },
  { slug: "deepgram", name: "Deepgram", category: "ai-speech", description: "Real-time speech-to-text (used for live call coaching)", status: "live", route: "/integrations/deepgram" },

  // ── CRM Platforms (8) ──
  { slug: "hubspot", name: "HubSpot", category: "crm-platforms", description: "Two-way contact & deal sync between HubSpot and HelloGrowth CRM", status: "live", route: "/integrations/hubspot" },
  { slug: "salesforce", name: "Salesforce", category: "crm-platforms", description: "Import leads/contacts/opportunities from Salesforce, bi-directional sync", status: "live", route: "/integrations/salesforce" },
  { slug: "zoho", name: "Zoho CRM", category: "crm-platforms", description: "Pull leads/contacts from Zoho CRM, send updates back", status: "live", route: "/integrations/zoho" },
  { slug: "pipedrive", name: "Pipedrive", category: "crm-platforms", description: "Lead / deal / activity import + outbound sync", status: "live", route: "/integrations/pipedrive" },
  { slug: "freshsales", name: "Freshsales", category: "crm-platforms", description: "Two-way lead sync with Freshworks CRM", status: "live", route: "/integrations/freshsales" },
  { slug: "copper", name: "Copper", category: "crm-platforms", description: "Sync contacts and pipelines with Copper CRM", status: "live", route: "/integrations/copper" },
  { slug: "insightly", name: "Insightly", category: "crm-platforms", description: "Lead/opportunity sync", status: "live", route: "/integrations/insightly" },
  { slug: "snov-io", name: "Snov.io", category: "crm-platforms", description: "Find prospect emails, enrich leads", status: "live", route: "/integrations/snov-io" },

  // ── Email — System / Transactional (2) ──
  { slug: "gmail", name: "Gmail", category: "email-system-transactional", description: "Send emails from CRM via user's Gmail, receive replies into CRM inbox", status: "live", route: "/integrations/gmail" },
  { slug: "custom-smtp", name: "Custom SMTP", category: "email-system-transactional", description: "Send via any SMTP server (your own mail server, Postmark, Mailgun, etc.)", status: "live", route: "/integrations/custom-smtp" },

  // ── Email Marketing & Campaigns (2) ──
  { slug: "tidio", name: "Tidio", category: "email-marketing-and-campaigns", description: "Live chat integration", status: "live", route: "/integrations/tidio" },
  { slug: "crisp", name: "Crisp", category: "email-marketing-and-campaigns", description: "Live chat support", status: "live", route: "/integrations/crisp" },

  // ── SMS / Voice / Telephony (1) ──
  { slug: "airtel-iq", name: "Airtel IQ", category: "sms-voice-telephony", description: "Airtel business cloud telephony", status: "live", route: "/integrations/airtel-iq" },

  // ── Calendar & Meetings (2) ──
  { slug: "zoom", name: "Zoom", category: "calendar-and-meetings", description: "Create Zoom meetings from CRM", status: "live", route: "/integrations/zoom" },
  { slug: "booking-page", name: "Booking page", category: "calendar-and-meetings", description: "Public booking page (Calendly-like) for prospects to schedule meetings", status: "live", route: "/integrations/booking-page" },

  // ── Payments (1) ──
  { slug: "quote-payment-portal", name: "Quote payment portal", category: "payments", description: "Public quote with embedded pay-now button (routes to Razorpay/Stripe/PayPal/Cashfree)", status: "live", route: "/integrations/quote-payment-portal" },

  // ── Lead-gen Sources (3) ──
  { slug: "tradeindia", name: "TradeIndia", category: "lead-gen-sources", description: "Connects HelloGrowthCRM with TradeIndia for lead-gen sources workflows.", status: "live", route: "/integrations/tradeindia" },
  { slug: "google-forms", name: "Google Forms", category: "lead-gen-sources", description: "Receive Google Forms submissions as leads", status: "live", route: "/integrations/google-forms" },
  { slug: "typeform", name: "Typeform", category: "lead-gen-sources", description: "Receive Typeform submissions as leads", status: "live", route: "/integrations/typeform" },

  // ── Chat / Help Desk (2) ──
  { slug: "web-chat-assistant", name: "Web Chat Assistant", category: "chat-help-desk", description: "Embeddable AI-powered chat widget on customer sites", status: "live", route: "/integrations/web-chat-assistant" },
  { slug: "telegram", name: "Telegram", category: "chat-help-desk", description: "Notifications + bot replies", status: "live", route: "/integrations/telegram" },

  // ── Logistics / Shipping (1) ──
  { slug: "dtdc", name: "DTDC", category: "logistics-shipping", description: "Connects HelloGrowthCRM with DTDC for logistics / shipping workflows.", status: "live", route: "/integrations/dtdc" },

  // ── Workflow / Automation Platforms (1) ──
  { slug: "n8n", name: "n8n", category: "workflow-automation-platforms", description: "Connects HelloGrowthCRM with n8n for workflow / automation platforms workflows.", status: "live", route: "/integrations/n8n" },

  // ── Analytics & Observability (4) ──
  { slug: "microsoft-clarity", name: "Microsoft Clarity", category: "analytics-and-observability", description: "Session recording & heatmaps", status: "live", route: "/integrations/microsoft-clarity" },
  { slug: "datadog", name: "Datadog", category: "analytics-and-observability", description: "Application performance monitoring (server-side errors)", status: "live", route: "/integrations/datadog" },
  { slug: "sentry", name: "Sentry", category: "analytics-and-observability", description: "Frontend error tracking", status: "live", route: "/integrations/sentry" },
  { slug: "bug-reporting", name: "Bug reporting", category: "analytics-and-observability", description: "Built-in bug reporting flow with screenshots", status: "live", route: "/integrations/bug-reporting" },

  // ── Accounting / ERP (1) ──
  { slug: "netsuite", name: "NetSuite", category: "accounting-erp", description: "Connects HelloGrowthCRM with NetSuite for accounting / erp workflows.", status: "live", route: "/integrations/netsuite" },

  // ── Lead Enrichment (7) ──
  { slug: "apollo", name: "Apollo.io", category: "lead-enrichment", description: "B2B contact enrichment (job title, company, email, LinkedIn)", status: "live", route: "/integrations/apollo" },
  { slug: "clearbit", name: "Clearbit", category: "lead-enrichment", description: "Connects HelloGrowthCRM with Clearbit for lead enrichment workflows.", status: "live", route: "/integrations/clearbit" },
  { slug: "hunter", name: "Hunter.io", category: "lead-enrichment", description: "Email finder by domain + verification", status: "live", route: "/integrations/hunter" },
  { slug: "lusha", name: "Lusha", category: "lead-enrichment", description: "Direct dial + contact enrichment", status: "live", route: "/integrations/lusha" },
  { slug: "zoominfo", name: "ZoomInfo", category: "lead-enrichment", description: "Enterprise B2B intelligence", status: "live", route: "/integrations/zoominfo" },
  { slug: "hunter-io", name: "Hunter.io", category: "lead-enrichment", description: "Email finder & verification for lead enrichment.", status: "live", route: "/integrations/hunter-io" },
  { slug: "apollo-io", name: "Apollo.io", category: "lead-enrichment", description: "B2B prospecting & contact enrichment via Apollo.io.", status: "live", route: "/integrations/apollo-io" },

  // ── Utility (3) ──
  { slug: "captcha", name: "reCAPTCHA / hCaptcha", category: "utility", description: "Bot protection on public booking / form pages", status: "live", route: "/integrations/captcha" },
  { slug: "ip-geolocation", name: "IP Geolocation", category: "utility", description: "Enrich visitor IPs with country/city for visitor tracking", status: "live", route: "/integrations/ip-geolocation" },
  { slug: "portal-integration", name: "Portal Integration", category: "utility", description: "Generic portal integration framework (configurable)", status: "live", route: "/integrations/portal-integration" },

  // ── Backend-ready integrations (5) ──
  { slug: "squarespace", name: "Squarespace", category: "backend-ready-integrations", description: "Provides a backend-ready Squarespace integration path for HelloGrowthCRM, with setup intended around Website builder workflows.", status: "backend-ready", route: "/integrations/squarespace" },
  { slug: "webflow", name: "Webflow", category: "backend-ready-integrations", description: "Provides a backend-ready Webflow integration path for HelloGrowthCRM, with setup intended around Website builder workflows.", status: "backend-ready", route: "/integrations/webflow" },
  { slug: "pardot", name: "Pardot", category: "backend-ready-integrations", description: "Provides a backend-ready Pardot integration path for HelloGrowthCRM, with setup intended around Marketing automation workflows.", status: "backend-ready", route: "/integrations/pardot" },
  { slug: "marketo", name: "Marketo", category: "backend-ready-integrations", description: "Provides a backend-ready Marketo integration path for HelloGrowthCRM, with setup intended around Marketing automation workflows.", status: "backend-ready", route: "/integrations/marketo" },
  { slug: "eloqua", name: "Eloqua", category: "backend-ready-integrations", description: "Provides a backend-ready Eloqua integration path for HelloGrowthCRM, with setup intended around Marketing automation workflows.", status: "backend-ready", route: "/integrations/eloqua" },

  // ── Education / LMS (7) ──
  { slug: "canvas-lms", name: "Canvas LMS", category: "education-lms", description: "Creates a planned Canvas LMS integration page for HelloGrowthCRM so teams can discover education / lms workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/canvas-lms" },
  { slug: "blackboard", name: "Blackboard", category: "education-lms", description: "Creates a planned Blackboard integration page for HelloGrowthCRM so teams can discover education / lms workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/blackboard" },
  { slug: "moodle", name: "Moodle", category: "education-lms", description: "Creates a planned Moodle integration page for HelloGrowthCRM so teams can discover education / lms workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/moodle" },
  { slug: "thinkific", name: "Thinkific", category: "education-lms", description: "Creates a planned Thinkific integration page for HelloGrowthCRM so teams can discover education / lms workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/thinkific" },
  { slug: "teachable", name: "Teachable", category: "education-lms", description: "Creates a planned Teachable integration page for HelloGrowthCRM so teams can discover education / lms workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/teachable" },
  { slug: "kajabi", name: "Kajabi", category: "education-lms", description: "Creates a planned Kajabi integration page for HelloGrowthCRM so teams can discover education / lms workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/kajabi" },
  { slug: "podia", name: "Podia", category: "education-lms", description: "Creates a planned Podia integration page for HelloGrowthCRM so teams can discover education / lms workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/podia" },

  // ── Restaurant POS / Delivery (8) ──
  { slug: "petpooja", name: "Petpooja", category: "restaurant-pos-delivery", description: "Creates a planned Petpooja integration page for HelloGrowthCRM so teams can discover restaurant pos / delivery workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/petpooja" },
  { slug: "posist", name: "Posist", category: "restaurant-pos-delivery", description: "Creates a planned Posist integration page for HelloGrowthCRM so teams can discover restaurant pos / delivery workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/posist" },
  { slug: "limetray", name: "Limetray", category: "restaurant-pos-delivery", description: "Creates a planned Limetray integration page for HelloGrowthCRM so teams can discover restaurant pos / delivery workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/limetray" },
  { slug: "urbanpiper", name: "Urbanpiper", category: "restaurant-pos-delivery", description: "Creates a planned Urbanpiper integration page for HelloGrowthCRM so teams can discover restaurant pos / delivery workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/urbanpiper" },
  { slug: "zomato-partner", name: "Zomato Partner", category: "restaurant-pos-delivery", description: "Creates a planned Zomato Partner integration page for HelloGrowthCRM so teams can discover restaurant pos / delivery workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/zomato-partner" },
  { slug: "swiggy-partner", name: "Swiggy Partner", category: "restaurant-pos-delivery", description: "Creates a planned Swiggy Partner integration page for HelloGrowthCRM so teams can discover restaurant pos / delivery workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/swiggy-partner" },
  { slug: "toast-pos", name: "Toast POS", category: "restaurant-pos-delivery", description: "Creates a planned Toast POS integration page for HelloGrowthCRM so teams can discover restaurant pos / delivery workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/toast-pos" },
  { slug: "tella", name: "Tella", category: "restaurant-pos-delivery", description: "Creates a planned Tella integration page for HelloGrowthCRM so teams can discover restaurant pos / delivery workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/tella" },

  // ── Hospitality (3) ──
  { slug: "cloudbeds", name: "Cloudbeds", category: "hospitality", description: "Creates a planned Cloudbeds integration page for HelloGrowthCRM so teams can discover hospitality workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/cloudbeds" },
  { slug: "mews", name: "Mews", category: "hospitality", description: "Creates a planned Mews integration page for HelloGrowthCRM so teams can discover hospitality workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/mews" },
  { slug: "oyo", name: "OYO", category: "hospitality", description: "Creates a planned OYO integration page for HelloGrowthCRM so teams can discover hospitality workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/oyo" },

  // ── Pharma / Healthcare (4) ──
  { slug: "1mg", name: "1mg", category: "pharma-healthcare", description: "Creates a planned 1mg integration page for HelloGrowthCRM so teams can discover pharma / healthcare workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/1mg" },
  { slug: "pharmeasy", name: "PharmEasy", category: "pharma-healthcare", description: "Creates a planned PharmEasy integration page for HelloGrowthCRM so teams can discover pharma / healthcare workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/pharmeasy" },
  { slug: "netmeds", name: "Netmeds", category: "pharma-healthcare", description: "Creates a planned Netmeds integration page for HelloGrowthCRM so teams can discover pharma / healthcare workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/netmeds" },
  { slug: "practo", name: "Practo", category: "pharma-healthcare", description: "Creates a planned Practo integration page for HelloGrowthCRM so teams can discover pharma / healthcare workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/practo" },

  // ── HR / Payroll (4) ──
  { slug: "justworks", name: "Justworks", category: "hr-payroll", description: "Creates a planned Justworks integration page for HelloGrowthCRM so teams can discover hr / payroll workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/justworks" },
  { slug: "paylocity", name: "Paylocity", category: "hr-payroll", description: "Creates a planned Paylocity integration page for HelloGrowthCRM so teams can discover hr / payroll workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/paylocity" },
  { slug: "paycom", name: "Paycom", category: "hr-payroll", description: "Creates a planned Paycom integration page for HelloGrowthCRM so teams can discover hr / payroll workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/paycom" },
  { slug: "trinet", name: "TriNet", category: "hr-payroll", description: "Creates a planned TriNet integration page for HelloGrowthCRM so teams can discover hr / payroll workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/trinet" },

  // ── Indian KYC / Identity (5) ──
  { slug: "aadhaar-esign", name: "Aadhaar eSign", category: "indian-kyc-identity", description: "Creates a planned Aadhaar eSign integration page for HelloGrowthCRM so teams can discover Government e-signature workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/aadhaar-esign" },
  { slug: "karza", name: "Karza", category: "indian-kyc-identity", description: "Creates a planned Karza integration page for HelloGrowthCRM so teams can discover KYC + business verification workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/karza" },
  { slug: "signzy", name: "Signzy", category: "indian-kyc-identity", description: "Creates a planned Signzy integration page for HelloGrowthCRM so teams can discover Digital KYC workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/signzy" },
  { slug: "verify-pan", name: "Verify PAN", category: "indian-kyc-identity", description: "Creates a planned Verify PAN integration page for HelloGrowthCRM so teams can discover PAN card verification workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/verify-pan" },
  { slug: "verify-gstin", name: "Verify GSTIN", category: "indian-kyc-identity", description: "Creates a planned Verify GSTIN integration page for HelloGrowthCRM so teams can discover GST number lookup workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/verify-gstin" },

  // ── Indian Banking & Payment (9) ──
  { slug: "hdfc-smarthub", name: "HDFC SmartHub", category: "indian-banking-and-payment", description: "Creates a planned HDFC SmartHub integration page for HelloGrowthCRM so teams can discover HDFC merchant gateway workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/hdfc-smarthub" },
  { slug: "icici-eazypay", name: "ICICI Eazypay", category: "indian-banking-and-payment", description: "Creates a planned ICICI Eazypay integration page for HelloGrowthCRM so teams can discover ICICI merchant gateway workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/icici-eazypay" },
  { slug: "axis-payments", name: "Axis Payments", category: "indian-banking-and-payment", description: "Creates a planned Axis Payments integration page for HelloGrowthCRM so teams can discover Axis Bank payments workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/axis-payments" },
  { slug: "razorpay-x", name: "Razorpay-X", category: "indian-banking-and-payment", description: "Creates a planned Razorpay-X integration page for HelloGrowthCRM so teams can discover Razorpay business banking workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/razorpay-x" },
  { slug: "khatabook", name: "Khatabook", category: "indian-banking-and-payment", description: "Creates a planned Khatabook integration page for HelloGrowthCRM so teams can discover SMB digital ledger workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/khatabook" },
  { slug: "vyapar", name: "Vyapar", category: "indian-banking-and-payment", description: "Creates a planned Vyapar integration page for HelloGrowthCRM so teams can discover SMB accounting workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/vyapar" },
  { slug: "profitbooks", name: "ProfitBooks", category: "indian-banking-and-payment", description: "Creates a planned ProfitBooks integration page for HelloGrowthCRM so teams can discover SMB accounting workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/profitbooks" },
  { slug: "finbox", name: "Finbox", category: "indian-banking-and-payment", description: "Creates a planned Finbox integration page for HelloGrowthCRM so teams can discover Lending APIs workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/finbox" },
  { slug: "setu", name: "Setu", category: "indian-banking-and-payment", description: "Creates a planned Setu integration page for HelloGrowthCRM so teams can discover Open banking workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/setu" },

  // ── LATAM (7) ──
  { slug: "mercadolibre", name: "MercadoLibre", category: "latam", description: "Creates a planned MercadoLibre integration page for HelloGrowthCRM so teams can discover latam workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/mercadolibre" },
  { slug: "mercadopago", name: "MercadoPago", category: "latam", description: "Creates a planned MercadoPago integration page for HelloGrowthCRM so teams can discover latam workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/mercadopago" },
  { slug: "picpay", name: "PicPay (Brazil payment)", category: "latam", description: "Creates a planned PicPay (Brazil payment) integration page for HelloGrowthCRM so teams can discover latam workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/picpay" },
  { slug: "pagseguro", name: "PagSeguro", category: "latam", description: "Creates a planned PagSeguro integration page for HelloGrowthCRM so teams can discover latam workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/pagseguro" },
  { slug: "tiendanube", name: "Tiendanube (Argentina ecom)", category: "latam", description: "Creates a planned Tiendanube (Argentina ecom) integration page for HelloGrowthCRM so teams can discover latam workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/tiendanube" },
  { slug: "linio", name: "Linio", category: "latam", description: "Creates a planned Linio integration page for HelloGrowthCRM so teams can discover latam workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/linio" },
  { slug: "tienda-nube", name: "Tienda Nube", category: "latam", description: "LATAM e-commerce platform", status: "live", route: "/integrations/tienda-nube" },

  // ── Middle East (7) ──
  { slug: "hyperpay", name: "HyperPay", category: "middle-east", description: "Creates a planned HyperPay integration page for HelloGrowthCRM so teams can discover middle east workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/hyperpay" },
  { slug: "paytabs", name: "PayTabs", category: "middle-east", description: "Creates a planned PayTabs integration page for HelloGrowthCRM so teams can discover middle east workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/paytabs" },
  { slug: "tamara", name: "Tamara (BNPL)", category: "middle-east", description: "Creates a planned Tamara (BNPL) integration page for HelloGrowthCRM so teams can discover middle east workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/tamara" },
  { slug: "tabby", name: "Tabby (BNPL)", category: "middle-east", description: "Creates a planned Tabby (BNPL) integration page for HelloGrowthCRM so teams can discover middle east workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/tabby" },
  { slug: "salla", name: "Salla", category: "middle-east", description: "Creates a planned Salla integration page for HelloGrowthCRM so teams can discover middle east workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/salla" },
  { slug: "zid", name: "Zid", category: "middle-east", description: "Creates a planned Zid integration page for HelloGrowthCRM so teams can discover middle east workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/zid" },
  { slug: "bayt", name: "Bayt (jobs)", category: "middle-east", description: "Creates a planned Bayt (jobs) integration page for HelloGrowthCRM so teams can discover middle east workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/bayt" },

  // ── APAC (5) ──
  { slug: "lazada", name: "Lazada", category: "apac", description: "Creates a planned Lazada integration page for HelloGrowthCRM so teams can discover apac workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/lazada" },
  { slug: "shopee", name: "Shopee", category: "apac", description: "Creates a planned Shopee integration page for HelloGrowthCRM so teams can discover apac workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/shopee" },
  { slug: "tokopedia", name: "Tokopedia", category: "apac", description: "Creates a planned Tokopedia integration page for HelloGrowthCRM so teams can discover apac workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/tokopedia" },
  { slug: "line", name: "LINE (chat - Japan/Asia)", category: "apac", description: "Creates a planned LINE (chat - Japan/Asia) integration page for HelloGrowthCRM so teams can discover apac workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/line" },
  { slug: "kakaotalk", name: "KakaoTalk (Korea)", category: "apac", description: "Creates a planned KakaoTalk (Korea) integration page for HelloGrowthCRM so teams can discover apac workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/kakaotalk" },

  // ── Advanced Sales / Enrichment (11) ──
  { slug: "6sense", name: "6sense", category: "advanced-sales-enrichment", description: "Creates a planned 6sense integration page for HelloGrowthCRM so teams can discover Account-based marketing intelligence workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/6sense" },
  { slug: "cognism", name: "Cognism", category: "advanced-sales-enrichment", description: "Creates a planned Cognism integration page for HelloGrowthCRM so teams can discover Sales intelligence workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/cognism" },
  { slug: "coresignal", name: "Coresignal", category: "advanced-sales-enrichment", description: "Creates a planned Coresignal integration page for HelloGrowthCRM so teams can discover B2B data API workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/coresignal" },
  { slug: "crunchbase-pro", name: "Crunchbase Pro", category: "advanced-sales-enrichment", description: "Creates a planned Crunchbase Pro integration page for HelloGrowthCRM so teams can discover Company data workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/crunchbase-pro" },
  { slug: "demandbase", name: "Demandbase", category: "advanced-sales-enrichment", description: "Creates a planned Demandbase integration page for HelloGrowthCRM so teams can discover ABM platform workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/demandbase" },
  { slug: "leadiq", name: "LeadIQ", category: "advanced-sales-enrichment", description: "Creates a planned LeadIQ integration page for HelloGrowthCRM so teams can discover Prospecting tool workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/leadiq" },
  { slug: "bombora", name: "Bombora", category: "advanced-sales-enrichment", description: "Creates a planned Bombora integration page for HelloGrowthCRM so teams can discover Intent data workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/bombora" },
  { slug: "phantombuster", name: "Phantombuster", category: "advanced-sales-enrichment", description: "Creates a planned Phantombuster integration page for HelloGrowthCRM so teams can discover LinkedIn automation workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/phantombuster" },
  { slug: "texau", name: "TexAU", category: "advanced-sales-enrichment", description: "Creates a planned TexAU integration page for HelloGrowthCRM so teams can discover Scraping automation workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/texau" },
  { slug: "owler-pro", name: "Owler Pro", category: "advanced-sales-enrichment", description: "Creates a planned Owler Pro integration page for HelloGrowthCRM so teams can discover Company intelligence workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/owler-pro" },
  { slug: "mojodialer", name: "MojoDialer", category: "advanced-sales-enrichment", description: "Creates a planned MojoDialer integration page for HelloGrowthCRM so teams can discover Sales dialer workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/mojodialer" },

  // ── Marketing Automation (10) ──
  { slug: "hubspot-marketing", name: "HubSpot Marketing", category: "marketing-automation", description: "Creates a planned HubSpot Marketing integration page for HelloGrowthCRM so teams can discover marketing automation workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/hubspot-marketing" },
  { slug: "drift", name: "Drift", category: "marketing-automation", description: "Creates a planned Drift integration page for HelloGrowthCRM so teams can discover marketing automation workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/drift" },
  { slug: "outreach", name: "Outreach", category: "marketing-automation", description: "Creates a planned Outreach integration page for HelloGrowthCRM so teams can discover marketing automation workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/outreach" },
  { slug: "salesloft", name: "Salesloft", category: "marketing-automation", description: "Creates a planned Salesloft integration page for HelloGrowthCRM so teams can discover marketing automation workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/salesloft" },
  { slug: "lemlist", name: "Lemlist", category: "marketing-automation", description: "Creates a planned Lemlist integration page for HelloGrowthCRM so teams can discover marketing automation workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/lemlist" },
  { slug: "smartlead", name: "Smartlead", category: "marketing-automation", description: "Creates a planned Smartlead integration page for HelloGrowthCRM so teams can discover marketing automation workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/smartlead" },
  { slug: "instantly", name: "Instantly", category: "marketing-automation", description: "Creates a planned Instantly integration page for HelloGrowthCRM so teams can discover marketing automation workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/instantly" },
  { slug: "bombbomb", name: "Bombbomb (video)", category: "marketing-automation", description: "Creates a planned Bombbomb (video) integration page for HelloGrowthCRM so teams can discover marketing automation workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/bombbomb" },
  { slug: "reachdesk", name: "Reachdesk (gifting)", category: "marketing-automation", description: "Creates a planned Reachdesk (gifting) integration page for HelloGrowthCRM so teams can discover marketing automation workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/reachdesk" },
  { slug: "sendoso", name: "Sendoso (gifting)", category: "marketing-automation", description: "Creates a planned Sendoso (gifting) integration page for HelloGrowthCRM so teams can discover marketing automation workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/sendoso" },

  // ── Helpdesk / Customer Success (10) ──
  { slug: "chatwoot", name: "ChatWoot", category: "helpdesk-customer-success", description: "Creates a planned ChatWoot integration page for HelloGrowthCRM so teams can discover helpdesk / customer success workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/chatwoot" },
  { slug: "helpscout", name: "Helpscout", category: "helpdesk-customer-success", description: "Creates a planned Helpscout integration page for HelloGrowthCRM so teams can discover helpdesk / customer success workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/helpscout" },
  { slug: "front", name: "Front", category: "helpdesk-customer-success", description: "Creates a planned Front integration page for HelloGrowthCRM so teams can discover helpdesk / customer success workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/front" },
  { slug: "chiltipiper", name: "Chiltipiper", category: "helpdesk-customer-success", description: "Creates a planned Chiltipiper integration page for HelloGrowthCRM so teams can discover helpdesk / customer success workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/chiltipiper" },
  { slug: "servicecloud", name: "ServiceCloud", category: "helpdesk-customer-success", description: "Creates a planned ServiceCloud integration page for HelloGrowthCRM so teams can discover helpdesk / customer success workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/servicecloud" },
  { slug: "olark", name: "Olark", category: "helpdesk-customer-success", description: "Creates a planned Olark integration page for HelloGrowthCRM so teams can discover helpdesk / customer success workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/olark" },
  { slug: "smartsupp", name: "Smartsupp", category: "helpdesk-customer-success", description: "Creates a planned Smartsupp integration page for HelloGrowthCRM so teams can discover helpdesk / customer success workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/smartsupp" },
  { slug: "tawkto", name: "Tawkto", category: "helpdesk-customer-success", description: "Creates a planned Tawkto integration page for HelloGrowthCRM so teams can discover helpdesk / customer success workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/tawkto" },
  { slug: "userlytics", name: "Userlytics", category: "helpdesk-customer-success", description: "Creates a planned Userlytics integration page for HelloGrowthCRM so teams can discover helpdesk / customer success workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/userlytics" },
  { slug: "asknicely", name: "AskNicely", category: "helpdesk-customer-success", description: "Creates a planned AskNicely integration page for HelloGrowthCRM so teams can discover helpdesk / customer success workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/asknicely" },

  // ── Sales Engagement / Dialer (19) ──
  { slug: "aircall", name: "Aircall", category: "sales-engagement-dialer", description: "Creates a planned Aircall integration page for HelloGrowthCRM so teams can discover Cloud telephony workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/aircall" },
  { slug: "ringcentral", name: "RingCentral", category: "sales-engagement-dialer", description: "Creates a planned RingCentral integration page for HelloGrowthCRM so teams can discover Cloud telephony workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/ringcentral" },
  { slug: "dialpad", name: "Dialpad", category: "sales-engagement-dialer", description: "Creates a planned Dialpad integration page for HelloGrowthCRM so teams can discover Cloud telephony workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/dialpad" },
  { slug: "8x8", name: "8x8", category: "sales-engagement-dialer", description: "Creates a planned 8x8 integration page for HelloGrowthCRM so teams can discover Cloud telephony workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/8x8" },
  { slug: "justcall", name: "JustCall", category: "sales-engagement-dialer", description: "Creates a planned JustCall integration page for HelloGrowthCRM so teams can discover Sales dialer workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/justcall" },
  { slug: "openphone", name: "OpenPhone", category: "sales-engagement-dialer", description: "Creates a planned OpenPhone integration page for HelloGrowthCRM so teams can discover Cloud telephony workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/openphone" },
  { slug: "plivo", name: "Plivo", category: "sales-engagement-dialer", description: "Creates a planned Plivo integration page for HelloGrowthCRM so teams can discover SMS / voice API workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/plivo" },
  { slug: "knowlarity", name: "Knowlarity", category: "sales-engagement-dialer", description: "Creates a planned Knowlarity integration page for HelloGrowthCRM so teams can discover India IVR workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/knowlarity" },
  { slug: "goto-connect", name: "GoTo Connect", category: "sales-engagement-dialer", description: "Creates a planned GoTo Connect integration page for HelloGrowthCRM so teams can discover UCaaS workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/goto-connect" },
  { slug: "vonage", name: "Vonage", category: "sales-engagement-dialer", description: "Creates a planned Vonage integration page for HelloGrowthCRM so teams can discover Communication API workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/vonage" },
  { slug: "bandwidth", name: "Bandwidth", category: "sales-engagement-dialer", description: "Creates a planned Bandwidth integration page for HelloGrowthCRM so teams can discover Voice API workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/bandwidth" },
  { slug: "sinch", name: "Sinch", category: "sales-engagement-dialer", description: "Creates a planned Sinch integration page for HelloGrowthCRM so teams can discover Communication platform workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/sinch" },
  { slug: "telnyx", name: "Telnyx", category: "sales-engagement-dialer", description: "Creates a planned Telnyx integration page for HelloGrowthCRM so teams can discover Voice/SMS API workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/telnyx" },
  { slug: "servetel", name: "Servetel", category: "sales-engagement-dialer", description: "Creates a planned Servetel integration page for HelloGrowthCRM so teams can discover India telephony workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/servetel" },
  { slug: "tata-tele", name: "Tata Tele", category: "sales-engagement-dialer", description: "Creates a planned Tata Tele integration page for HelloGrowthCRM so teams can discover India enterprise tel workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/tata-tele" },
  { slug: "ozonetel", name: "Ozonetel", category: "sales-engagement-dialer", description: "Creates a planned Ozonetel integration page for HelloGrowthCRM so teams can discover India contact center workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/ozonetel" },
  { slug: "textmagic", name: "Textmagic", category: "sales-engagement-dialer", description: "Creates a planned Textmagic integration page for HelloGrowthCRM so teams can discover SMS marketing workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/textmagic" },
  { slug: "telr", name: "Telr", category: "sales-engagement-dialer", description: "Creates a planned Telr integration page for HelloGrowthCRM so teams can discover UAE payment + SMS workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/telr" },
  { slug: "clicksend", name: "ClickSend", category: "sales-engagement-dialer", description: "Creates a planned ClickSend integration page for HelloGrowthCRM so teams can discover SMS / direct mail workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/clicksend" },

  // ── Email / Calendar Extras (6) ──
  { slug: "acuity", name: "Acuity", category: "email-calendar-extras", description: "Creates a planned Acuity integration page for HelloGrowthCRM so teams can discover email / calendar extras workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/acuity" },
  { slug: "tidycal", name: "TidyCal", category: "email-calendar-extras", description: "Creates a planned TidyCal integration page for HelloGrowthCRM so teams can discover email / calendar extras workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/tidycal" },
  { slug: "savvycal", name: "SavvyCal", category: "email-calendar-extras", description: "Creates a planned SavvyCal integration page for HelloGrowthCRM so teams can discover email / calendar extras workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/savvycal" },
  { slug: "youcanbookme", name: "YouCanBookMe", category: "email-calendar-extras", description: "Creates a planned YouCanBookMe integration page for HelloGrowthCRM so teams can discover email / calendar extras workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/youcanbookme" },
  { slug: "oncehub", name: "OnceHub", category: "email-calendar-extras", description: "Creates a planned OnceHub integration page for HelloGrowthCRM so teams can discover email / calendar extras workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/oncehub" },
  { slug: "reclaimai", name: "ReclaimAI", category: "email-calendar-extras", description: "Creates a planned ReclaimAI integration page for HelloGrowthCRM so teams can discover email / calendar extras workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/reclaimai" },

  // ── ESign / Document (7) ──
  { slug: "adobe-sign", name: "Adobe Sign", category: "esign-document", description: "Creates a planned Adobe Sign integration page for HelloGrowthCRM so teams can discover esign / document workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/adobe-sign" },
  { slug: "dropboxsign", name: "DropboxSign (formerly HelloSign)", category: "esign-document", description: "Creates a planned DropboxSign (formerly HelloSign) integration page for HelloGrowthCRM so teams can discover esign / document workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/dropboxsign" },
  { slug: "pandadoc", name: "PandaDoc", category: "esign-document", description: "Creates a planned PandaDoc integration page for HelloGrowthCRM so teams can discover esign / document workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/pandadoc" },
  { slug: "proposify", name: "Proposify", category: "esign-document", description: "Creates a planned Proposify integration page for HelloGrowthCRM so teams can discover esign / document workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/proposify" },
  { slug: "qwilr", name: "Qwilr", category: "esign-document", description: "Creates a planned Qwilr integration page for HelloGrowthCRM so teams can discover esign / document workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/qwilr" },
  { slug: "betterproposals", name: "BetterProposals", category: "esign-document", description: "Creates a planned BetterProposals integration page for HelloGrowthCRM so teams can discover esign / document workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/betterproposals" },
  { slug: "notarize", name: "Notarize", category: "esign-document", description: "Creates a planned Notarize integration page for HelloGrowthCRM so teams can discover esign / document workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/notarize" },

  // ── Storage / File (6) ──
  { slug: "dropbox", name: "Dropbox", category: "storage-file", description: "Creates a planned Dropbox integration page for HelloGrowthCRM so teams can discover storage / file workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/dropbox" },
  { slug: "box", name: "Box", category: "storage-file", description: "Creates a planned Box integration page for HelloGrowthCRM so teams can discover storage / file workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/box" },
  { slug: "google-drive", name: "Google Drive (oauth)", category: "storage-file", description: "Creates a planned Google Drive (oauth) integration page for HelloGrowthCRM so teams can discover storage / file workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/google-drive" },
  { slug: "loom", name: "Loom (video)", category: "storage-file", description: "Creates a planned Loom (video) integration page for HelloGrowthCRM so teams can discover storage / file workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/loom" },
  { slug: "vidyard", name: "Vidyard (video)", category: "storage-file", description: "Creates a planned Vidyard (video) integration page for HelloGrowthCRM so teams can discover storage / file workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/vidyard" },
  { slug: "wistia", name: "Wistia (video)", category: "storage-file", description: "Creates a planned Wistia (video) integration page for HelloGrowthCRM so teams can discover storage / file workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/wistia" },

  // ── Webhook / Workflow (9) ──
  { slug: "workato", name: "Workato", category: "webhook-workflow", description: "Creates a planned Workato integration page for HelloGrowthCRM so teams can discover webhook / workflow workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/workato" },
  { slug: "tray-io", name: "Tray.io", category: "webhook-workflow", description: "Creates a planned Tray.io integration page for HelloGrowthCRM so teams can discover webhook / workflow workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/tray-io" },
  { slug: "boomi", name: "Boomi", category: "webhook-workflow", description: "Creates a planned Boomi integration page for HelloGrowthCRM so teams can discover webhook / workflow workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/boomi" },
  { slug: "snaplogic", name: "Snaplogic", category: "webhook-workflow", description: "Creates a planned Snaplogic integration page for HelloGrowthCRM so teams can discover webhook / workflow workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/snaplogic" },
  { slug: "coda", name: "Coda", category: "webhook-workflow", description: "Creates a planned Coda integration page for HelloGrowthCRM so teams can discover webhook / workflow workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/coda" },
  { slug: "hightouch", name: "Hightouch", category: "webhook-workflow", description: "Creates a planned Hightouch integration page for HelloGrowthCRM so teams can discover webhook / workflow workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/hightouch" },
  { slug: "census", name: "Census", category: "webhook-workflow", description: "Creates a planned Census integration page for HelloGrowthCRM so teams can discover webhook / workflow workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/census" },
  { slug: "rudderstack", name: "Rudderstack", category: "webhook-workflow", description: "Creates a planned Rudderstack integration page for HelloGrowthCRM so teams can discover webhook / workflow workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/rudderstack" },
  { slug: "segment", name: "Segment (source + destination)", category: "webhook-workflow", description: "Creates a planned Segment (source + destination) integration page for HelloGrowthCRM so teams can discover webhook / workflow workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/segment" },

  // ── Survey / NPS / Feedback (5) ──
  { slug: "surveymonkey", name: "SurveyMonkey", category: "survey-nps-feedback", description: "Creates a planned SurveyMonkey integration page for HelloGrowthCRM so teams can discover survey / nps / feedback workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/surveymonkey" },
  { slug: "qualtrics", name: "Qualtrics", category: "survey-nps-feedback", description: "Creates a planned Qualtrics integration page for HelloGrowthCRM so teams can discover survey / nps / feedback workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/qualtrics" },
  { slug: "delighted", name: "Delighted", category: "survey-nps-feedback", description: "Creates a planned Delighted integration page for HelloGrowthCRM so teams can discover survey / nps / feedback workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/delighted" },
  { slug: "wootric", name: "Wootric", category: "survey-nps-feedback", description: "Creates a planned Wootric integration page for HelloGrowthCRM so teams can discover survey / nps / feedback workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/wootric" },
  { slug: "survicate", name: "Survicate", category: "survey-nps-feedback", description: "Creates a planned Survicate integration page for HelloGrowthCRM so teams can discover survey / nps / feedback workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/survicate" },

  // ── Project / Task Management (6) ──
  { slug: "clickup", name: "ClickUp", category: "project-task-management", description: "Creates a planned ClickUp integration page for HelloGrowthCRM so teams can discover project / task management workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/clickup" },
  { slug: "basecamp", name: "Basecamp", category: "project-task-management", description: "Creates a planned Basecamp integration page for HelloGrowthCRM so teams can discover project / task management workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/basecamp" },
  { slug: "wrike", name: "Wrike", category: "project-task-management", description: "Creates a planned Wrike integration page for HelloGrowthCRM so teams can discover project / task management workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/wrike" },
  { slug: "smartsheet", name: "Smartsheet", category: "project-task-management", description: "Creates a planned Smartsheet integration page for HelloGrowthCRM so teams can discover project / task management workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/smartsheet" },
  { slug: "teamwork", name: "Teamwork", category: "project-task-management", description: "Creates a planned Teamwork integration page for HelloGrowthCRM so teams can discover project / task management workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/teamwork" },
  { slug: "ms-dynamics-365", name: "MS Dynamics 365", category: "project-task-management", description: "Creates a planned MS Dynamics 365 integration page for HelloGrowthCRM so teams can discover project / task management workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/ms-dynamics-365" },

  // ── Other Vertical / Misc (26) ──
  { slug: "adobesign", name: "AdobeSign", category: "other-vertical-misc", description: "Creates a planned AdobeSign integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/adobesign" },
  { slug: "atlassian-connect", name: "Atlassian Connect", category: "other-vertical-misc", description: "Creates a planned Atlassian Connect integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/atlassian-connect" },
  { slug: "authzero", name: "AuthZero (Auth0)", category: "other-vertical-misc", description: "Creates a planned AuthZero (Auth0) integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/authzero" },
  { slug: "buffer", name: "Buffer (social)", category: "other-vertical-misc", description: "Creates a planned Buffer (social) integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/buffer" },
  { slug: "hootsuite", name: "Hootsuite (social)", category: "other-vertical-misc", description: "Creates a planned Hootsuite (social) integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/hootsuite" },
  { slug: "mattermost", name: "Mattermost (chat)", category: "other-vertical-misc", description: "Creates a planned Mattermost (chat) integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/mattermost" },
  { slug: "rocket-chat", name: "Rocket.Chat", category: "other-vertical-misc", description: "Creates a planned Rocket.Chat integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/rocket-chat" },
  { slug: "appfollow", name: "AppFollow", category: "other-vertical-misc", description: "Creates a planned AppFollow integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/appfollow" },
  { slug: "posthog", name: "Posthog", category: "other-vertical-misc", description: "Creates a planned Posthog integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/posthog" },
  { slug: "mixpanel", name: "Mixpanel", category: "other-vertical-misc", description: "Creates a planned Mixpanel integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/mixpanel" },
  { slug: "amplitude", name: "Amplitude", category: "other-vertical-misc", description: "Creates a planned Amplitude integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/amplitude" },
  { slug: "fullstory", name: "Fullstory", category: "other-vertical-misc", description: "Creates a planned Fullstory integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/fullstory" },
  { slug: "replicate", name: "Replicate (ML)", category: "other-vertical-misc", description: "Creates a planned Replicate (ML) integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/replicate" },
  { slug: "anthropic", name: "Anthropic", category: "other-vertical-misc", description: "Creates a planned Anthropic integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/anthropic" },
  { slug: "openai-gpt", name: "OpenAI GPT", category: "other-vertical-misc", description: "Creates a planned OpenAI GPT integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/openai-gpt" },
  { slug: "groq", name: "Groq", category: "other-vertical-misc", description: "Creates a planned Groq integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/groq" },
  { slug: "mistral", name: "Mistral", category: "other-vertical-misc", description: "Creates a planned Mistral integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/mistral" },
  { slug: "cohere", name: "Cohere", category: "other-vertical-misc", description: "Creates a planned Cohere integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/cohere" },
  { slug: "perplexity", name: "Perplexity", category: "other-vertical-misc", description: "Creates a planned Perplexity integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/perplexity" },
  { slug: "hugging-face", name: "Hugging Face", category: "other-vertical-misc", description: "Creates a planned Hugging Face integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/hugging-face" },
  { slug: "pinecone", name: "Pinecone (vector DB)", category: "other-vertical-misc", description: "Creates a planned Pinecone (vector DB) integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/pinecone" },
  { slug: "weaviate", name: "Weaviate", category: "other-vertical-misc", description: "Creates a planned Weaviate integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/weaviate" },
  { slug: "qdrant", name: "Qdrant", category: "other-vertical-misc", description: "Creates a planned Qdrant integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/qdrant" },
  { slug: "langsmith", name: "LangSmith", category: "other-vertical-misc", description: "Creates a planned LangSmith integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/langsmith" },
  { slug: "geminiext", name: "GeminiExt", category: "other-vertical-misc", description: "Creates a planned GeminiExt integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/geminiext" },
  { slug: "the-standard-pattern-is", name: "the standard pattern is:", category: "other-vertical-misc", description: "Creates a planned the standard pattern is: integration page for HelloGrowthCRM so teams can discover other vertical / misc workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/the-standard-pattern-is" },

  // ── Steps for engineering (2) ──
  { slug: "token-url", name: "token URL", category: "steps-for-engineering", description: "Creates a planned token URL integration page for HelloGrowthCRM so teams can discover steps for engineering workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/token-url" },
  { slug: "scopes", name: "scopes", category: "steps-for-engineering", description: "Creates a planned scopes integration page for HelloGrowthCRM so teams can discover steps for engineering workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/scopes" },

  // ── What customers see (29) ──
  { slug: "tab", name: "Tab", category: "what-customers-see", description: "Creates a planned Tab integration page for HelloGrowthCRM so teams can discover # Integrations workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/tab" },
  { slug: "crm", name: "CRM", category: "what-customers-see", description: "Creates a planned CRM integration page for HelloGrowthCRM so teams can discover 8 workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/crm" },
  { slug: "email", name: "Email", category: "what-customers-see", description: "Creates a planned Email integration page for HelloGrowthCRM so teams can discover 4 workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/email" },
  { slug: "email-marketing", name: "Email Marketing", category: "what-customers-see", description: "Creates a planned Email Marketing integration page for HelloGrowthCRM so teams can discover 8 workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/mailchimp" },
  { slug: "sms-voice", name: "SMS / Voice", category: "what-customers-see", description: "Creates a planned SMS / Voice integration page for HelloGrowthCRM so teams can discover 5 workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/sms-voice" },
  { slug: "calendar", name: "Calendar", category: "what-customers-see", description: "Creates a planned Calendar integration page for HelloGrowthCRM so teams can discover 3 workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/google-calendar" },
  { slug: "payment", name: "Payment", category: "what-customers-see", description: "Creates a planned Payment integration page for HelloGrowthCRM so teams can discover 7 workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/payment" },
  { slug: "chat-support", name: "Chat / Support", category: "what-customers-see", description: "Creates a planned Chat / Support integration page for HelloGrowthCRM so teams can discover 6 workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/chat-support" },
  { slug: "ecommerce", name: "eCommerce", category: "what-customers-see", description: "Creates a planned eCommerce integration page for HelloGrowthCRM so teams can discover 5 workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/shopify" },
  { slug: "logistics", name: "Logistics", category: "what-customers-see", description: "Creates a planned Logistics integration page for HelloGrowthCRM so teams can discover 4 workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/logistics" },
  { slug: "lead-sources", name: "Lead Sources", category: "what-customers-see", description: "Creates a planned Lead Sources integration page for HelloGrowthCRM so teams can discover 6 workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/lead-sources" },
  { slug: "accounting", name: "Accounting", category: "what-customers-see", description: "Creates a planned Accounting integration page for HelloGrowthCRM so teams can discover 7 workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/quickbooks" },
  { slug: "enrichment", name: "Enrichment", category: "what-customers-see", description: "Creates a planned Enrichment integration page for HelloGrowthCRM so teams can discover 5 workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/enrichment" },
  { slug: "document", name: "Document", category: "what-customers-see", description: "Creates a planned Document integration page for HelloGrowthCRM so teams can discover 3 workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/document" },
  { slug: "workflow", name: "Workflow", category: "what-customers-see", description: "Creates a planned Workflow integration page for HelloGrowthCRM so teams can discover 4 workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/workflow" },
  { slug: "analytics", name: "Analytics", category: "what-customers-see", description: "Creates a planned Analytics integration page for HelloGrowthCRM so teams can discover 4 workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/analytics" },
  { slug: "other", name: "Other", category: "what-customers-see", description: "Creates a planned Other integration page for HelloGrowthCRM so teams can discover ~6 workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/other" },
  { slug: "type", name: "Type", category: "what-customers-see", description: "Creates a planned Type integration page for HelloGrowthCRM so teams can discover Auth method workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/type" },
  { slug: "processes-journey-enrollments", name: "processes journey enrollments", category: "what-customers-see", description: "Creates a planned processes journey enrollments integration page for HelloGrowthCRM so teams can discover what customers see workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/processes-journey-enrollments" },
  { slug: "runs-lead-automation-rules", name: "runs lead automation rules", category: "what-customers-see", description: "Creates a planned runs lead automation rules integration page for HelloGrowthCRM so teams can discover what customers see workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/runs-lead-automation-rules" },
  { slug: "auto-assigns-inbound-leads", name: "auto-assigns inbound leads", category: "what-customers-see", description: "Creates a planned auto-assigns inbound leads integration page for HelloGrowthCRM so teams can discover what customers see workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/auto-assigns-inbound-leads" },
  { slug: "sends-task-due-reminders", name: "sends task due reminders", category: "what-customers-see", description: "Creates a planned sends task due reminders integration page for HelloGrowthCRM so teams can discover what customers see workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/sends-task-due-reminders" },
  { slug: "meeting-reminders-15-min-before", name: "meeting reminders 15 min before", category: "what-customers-see", description: "Creates a planned meeting reminders 15 min before integration page for HelloGrowthCRM so teams can discover what customers see workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/meeting-reminders-15-min-before" },
  { slug: "email-digest", name: "email digest", category: "what-customers-see", description: "Creates a planned email digest integration page for HelloGrowthCRM so teams can discover what customers see workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/email-digest" },
  { slug: "marks-idle-chat-conversations", name: "marks idle chat conversations", category: "what-customers-see", description: "Creates a planned marks idle chat conversations integration page for HelloGrowthCRM so teams can discover what customers see workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/marks-idle-chat-conversations" },
  { slug: "fixes-stale-call-records", name: "fixes stale call records", category: "what-customers-see", description: "Creates a planned fixes stale call records integration page for HelloGrowthCRM so teams can discover what customers see workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/fixes-stale-call-records" },
  { slug: "removes-expired-context", name: "removes expired context", category: "what-customers-see", description: "Creates a planned removes expired context integration page for HelloGrowthCRM so teams can discover what customers see workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/removes-expired-context" },
  { slug: "retries-failed-outbound-webhooks", name: "retries failed outbound webhooks", category: "what-customers-see", description: "Creates a planned retries failed outbound webhooks integration page for HelloGrowthCRM so teams can discover what customers see workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/retries-failed-outbound-webhooks" },
  { slug: "system", name: "system", category: "what-customers-see", description: "Creates a planned system integration page for HelloGrowthCRM so teams can discover what customers see workflows in the public integrations directory.", status: "scaffolded", route: "/integrations/system" },

  // ── Lead Sources (6) ──
  { slug: "sulekha", name: "Sulekha", category: "lead-sources", description: "Sync leads from Sulekha service marketplace.", status: "live", route: "/integrations/sulekha" },
  { slug: "naukri", name: "Naukri", category: "lead-sources", description: "Sync candidate enquiries from Naukri.com.", status: "live", route: "/integrations/naukri" },
  { slug: "classplus", name: "Classplus", category: "lead-sources", description: "Sync coaching/edtech leads from Classplus.", status: "live", route: "/integrations/classplus" },
  { slug: "tally-so", name: "Tally.so", category: "lead-sources", description: "Receive Tally.so form submissions as CRM leads.", status: "live", route: "/integrations/tally-so" },
  { slug: "jotform", name: "JotForm", category: "lead-sources", description: "Receive JotForm submissions as leads", status: "live", route: "/integrations/jotform" },
  { slug: "eventbrite", name: "Eventbrite", category: "lead-sources", description: "Capture event registrations & ticket buyers as leads", status: "live", route: "/integrations/eventbrite" },

  // ── Telephony (1) ──
  { slug: "airtel", name: "Airtel (SMS & WhatsApp)", category: "telephony", description: "Send SMS and WhatsApp messages via Airtel Business APIs.", status: "live", route: "/integrations/airtel" },

  // ── Scheduling & Video (4) ──
  { slug: "zoom-meetings", name: "Zoom Meetings", category: "scheduling-and-video", description: "Schedule Zoom meetings from the CRM and store join links on leads/bookings.", status: "live", route: "/integrations/zoom-meetings" },
  { slug: "google-meet", name: "Google Meet", category: "scheduling-and-video", description: "Auto-generate Google Meet links on bookings and meetings.", status: "live", route: "/integrations/google-meet" },
  { slug: "acuity-scheduling", name: "Acuity Scheduling", category: "scheduling-and-video", description: "Sync appointments from Squarespace Acuity", status: "live", route: "/integrations/acuity-scheduling" },
  { slug: "chili-piper", name: "Chili Piper", category: "scheduling-and-video", description: "Inbound lead routing & scheduling", status: "live", route: "/integrations/chili-piper" },

  // ── Email & Inbox (1) ──
  { slug: "outlook-email", name: "Outlook Email", category: "email-and-inbox", description: "Send and log Outlook/Microsoft 365 email from inside the CRM.", status: "live", route: "/integrations/outlook-email" },

  // ── Messaging (5) ──
  { slug: "whatsapp-business", name: "WhatsApp Business", category: "messaging", description: "Send templated & session messages via Meta WhatsApp Business Cloud API.", status: "live", route: "/integrations/whatsapp-business" },
  { slug: "gupshup", name: "Gupshup", category: "messaging", description: "Send WhatsApp messages via Gupshup BSP.", status: "live", route: "/integrations/gupshup" },
  { slug: "doubletick", name: "DoubleTick", category: "messaging", description: "Send WhatsApp messages, media & interactive replies via DoubleTick BSP.", status: "live", route: "/integrations/doubletick" },
  { slug: "instagram-dm", name: "Instagram DM", category: "messaging", description: "Receive and reply to Instagram direct messages inside CRM inbox.", status: "live", route: "/integrations/instagram-dm" },
  { slug: "facebook-messenger", name: "Facebook Messenger", category: "messaging", description: "Receive and reply to Facebook Messenger conversations inside CRM inbox.", status: "live", route: "/integrations/facebook-messenger" },

  // ── CRM Sync (1) ──
  { slug: "zoho-crm", name: "Zoho CRM", category: "crm-sync", description: "Two-way contact & deal sync with Zoho CRM.", status: "live", route: "/integrations/zoho-crm" },

  // ── Automation & Webhooks (2) ──
  { slug: "inbound-webhooks", name: "Inbound Webhooks", category: "automation-and-webhooks", description: "Expose a CRM endpoint to receive arbitrary inbound webhook payloads.", status: "live", route: "/integrations/inbound-webhooks" },
  { slug: "outbound-webhooks", name: "Outbound Webhooks", category: "automation-and-webhooks", description: "Push CRM events (lead/booking/deal updates) to any external URL.", status: "live", route: "/integrations/outbound-webhooks" },

  // ── Commerce & Payments (4) ──
  { slug: "phonepe-business", name: "PhonePe Business", category: "commerce-and-payments", description: "Capture PhonePe Business payments and link them to leads/customers.", status: "live", route: "/integrations/phonepe-business" },
  { slug: "square-payments", name: "Square Payments", category: "commerce-and-payments", description: "Capture new Square customers & payments as leads", status: "live", route: "/integrations/square-payments" },
  { slug: "square-pos", name: "Square POS", category: "commerce-and-payments", description: "Capture in-person Square POS customers & sales as leads", status: "live", route: "/integrations/square-pos" },
  { slug: "clover", name: "Clover", category: "commerce-and-payments", description: "Sync Clover POS customers & sales as CRM leads.", status: "live", route: "/integrations/clover" },

  // ── Marketing & Email (12) ──
  { slug: "mailerlite", name: "MailerLite", category: "marketing-and-email", description: "Sync CRM contacts to MailerLite for email campaigns.", status: "live", route: "/integrations/mailerlite" },
  { slug: "act-on", name: "Act-On", category: "marketing-and-email", description: "B2B marketing automation platform", status: "live", route: "/integrations/act-on" },
  { slug: "drip", name: "Drip", category: "marketing-and-email", description: "eCommerce CRM & email marketing", status: "live", route: "/integrations/drip" },
  { slug: "customer-io", name: "Customer.io", category: "marketing-and-email", description: "Behavioral messaging & automation", status: "live", route: "/integrations/customer-io" },
  { slug: "getresponse", name: "GetResponse", category: "marketing-and-email", description: "Email marketing & automation", status: "live", route: "/integrations/getresponse" },
  { slug: "kit", name: "Kit (ConvertKit)", category: "marketing-and-email", description: "Creator email marketing platform", status: "live", route: "/integrations/kit" },
  { slug: "emma", name: "Emma", category: "marketing-and-email", description: "Email marketing platform", status: "live", route: "/integrations/emma" },
  { slug: "campaign-monitor", name: "Campaign Monitor", category: "marketing-and-email", description: "Email marketing for designers & marketers", status: "live", route: "/integrations/campaign-monitor" },
  { slug: "omnisend", name: "Omnisend", category: "marketing-and-email", description: "eCommerce email & SMS automation", status: "live", route: "/integrations/omnisend" },
  { slug: "moosend", name: "Moosend", category: "marketing-and-email", description: "Email marketing & automation", status: "live", route: "/integrations/moosend" },
  { slug: "sharpspring", name: "SharpSpring", category: "marketing-and-email", description: "Marketing automation & CRM", status: "live", route: "/integrations/sharpspring" },
  { slug: "mixmax", name: "Mixmax", category: "marketing-and-email", description: "Email productivity for sales teams", status: "live", route: "/integrations/mixmax" },

  // ── Analytics & Attribution (3) ──
  { slug: "google-ads", name: "Google Ads", category: "analytics-and-attribution", description: "Push Google Ads offline conversions tied to CRM deals.", status: "live", route: "/integrations/google-ads" },
  { slug: "looker", name: "Looker", category: "analytics-and-attribution", description: "Google Cloud BI & data platform", status: "live", route: "/integrations/looker" },
  { slug: "power-bi", name: "Power BI", category: "analytics-and-attribution", description: "Microsoft business intelligence platform", status: "live", route: "/integrations/power-bi" },

  // ── Productivity & Documents (6) ──
  { slug: "google-sheets", name: "Google Sheets", category: "productivity-and-documents", description: "Two-way sync between CRM tables and Google Sheets.", status: "live", route: "/integrations/google-sheets" },
  { slug: "trello", name: "Trello", category: "productivity-and-documents", description: "Create Trello cards from CRM leads and sync status.", status: "live", route: "/integrations/trello" },
  { slug: "miro", name: "Miro", category: "productivity-and-documents", description: "Online collaborative whiteboard", status: "live", route: "/integrations/miro" },
  { slug: "figma", name: "Figma", category: "productivity-and-documents", description: "Collaborative design platform", status: "live", route: "/integrations/figma" },
  { slug: "pandadoc-cpq", name: "PandaDoc CPQ", category: "productivity-and-documents", description: "Configure, price & quote workflows", status: "live", route: "/integrations/pandadoc-cpq" },
  { slug: "dropbox-sign", name: "Dropbox Sign", category: "productivity-and-documents", description: "E-signature (formerly HelloSign)", status: "live", route: "/integrations/dropbox-sign" },

  // ── KYC & Compliance (2) ──
  { slug: "gstin-verification", name: "GSTIN Verification", category: "kyc-and-compliance", description: "Verify Indian GSTIN numbers for KYC.", status: "live", route: "/integrations/gstin-verification" },
  { slug: "pan-verification", name: "PAN Verification", category: "kyc-and-compliance", description: "Verify Indian PAN numbers for KYC.", status: "live", route: "/integrations/pan-verification" },

  // ── Support (4) ──
  { slug: "help-scout", name: "Help Scout", category: "support", description: "Two-way ticket & contact sync with Help Scout.", status: "live", route: "/integrations/help-scout" },
  { slug: "intercom-chat", name: "Intercom Chat", category: "support", description: "Embed Intercom live chat & sync conversations to CRM.", status: "live", route: "/integrations/intercom-chat" },
  { slug: "groove", name: "Groove", category: "support", description: "Help desk & email management", status: "live", route: "/integrations/groove" },
  { slug: "freshdesk-support", name: "Freshdesk Support", category: "support", description: "Extended Freshdesk ticket webhook receiver", status: "live", route: "/integrations/freshdesk-support" },

  // ── AI & Transcription (1) ──
  { slug: "openai-gpt-4o", name: "OpenAI GPT-4o", category: "ai-and-transcription", description: "Use your own OpenAI key for CRM AI features (chat, summarization).", status: "live", route: "/integrations/openai-gpt-4o" },

  // ── Live Chat (1) ──
  { slug: "crisp-chat", name: "Crisp.chat", category: "live-chat", description: "Embed Crisp live chat & sync conversations to CRM.", status: "live", route: "/integrations/crisp-chat" },

  // ── Other (2) ──
  { slug: "inoreader", name: "Inoreader", category: "other", description: "Monitor RSS feeds via Inoreader and create CRM leads from new items.", status: "live", route: "/integrations/inoreader" },
  { slug: "google-maps", name: "Google Maps", category: "other", description: "Configure Google Maps API key for location pickers & map views.", status: "live", route: "/integrations/google-maps" },

  // ── Voice, Call & SMS (4) ──
  { slug: "tata-tele-business", name: "Tata Tele Business", category: "voice-call-and-sms", description: "India enterprise IVR & cloud telephony", status: "live", route: "/integrations/tata-tele-business" },
  { slug: "grasshopper", name: "Grasshopper", category: "voice-call-and-sms", description: "Virtual phone system for small business", status: "live", route: "/integrations/grasshopper" },
  { slug: "mojo-dialer", name: "Mojo Dialer", category: "voice-call-and-sms", description: "Real estate sales prospecting dialer", status: "live", route: "/integrations/mojo-dialer" },
  { slug: "msg91", name: "MSG91", category: "voice-call-and-sms", description: "India SMS, OTP & messaging API", status: "live", route: "/integrations/msg91" },

  // ── Live Chat & Team Messaging (3) ──
  { slug: "livechat", name: "LiveChat", category: "live-chat-and-team-messaging", description: "Live chat & help desk platform", status: "live", route: "/integrations/livechat" },
  { slug: "kommo", name: "Kommo (amoCRM)", category: "live-chat-and-team-messaging", description: "Messenger-based CRM", status: "live", route: "/integrations/kommo" },
  { slug: "zoho-cliq", name: "Zoho Cliq", category: "live-chat-and-team-messaging", description: "Zoho team messaging & channels", status: "live", route: "/integrations/zoho-cliq" },

  // ── Hospitality & Travel (1) ──
  { slug: "makemytrip-b2b", name: "MakeMyTrip B2B", category: "hospitality-and-travel", description: "India B2B travel & hotel bookings", status: "live", route: "/integrations/makemytrip-b2b" },

  // ── Food & Beverage / Restaurant (1) ──
  { slug: "lightspeed", name: "Lightspeed", category: "food-and-beverage-restaurant", description: "Global retail & restaurant POS", status: "live", route: "/integrations/lightspeed" },

  // ── ERP & Manufacturing (3) ──
  { slug: "sap-business-one", name: "SAP Business One", category: "erp-and-manufacturing", description: "SAP ERP for SMEs", status: "live", route: "/integrations/sap-business-one" },
  { slug: "odoo", name: "Odoo", category: "erp-and-manufacturing", description: "Open-source ERP & CRM platform", status: "live", route: "/integrations/odoo" },
  { slug: "dynamics-365", name: "Dynamics 365", category: "erp-and-manufacturing", description: "Microsoft CRM & ERP platform", status: "live", route: "/integrations/dynamics-365" },

  // ── India Payments & Fintech (4) ──
  { slug: "yodlee", name: "Yodlee", category: "india-payments-and-fintech", description: "Account aggregator & open banking", status: "live", route: "/integrations/yodlee" },
  { slug: "paytm", name: "Paytm", category: "india-payments-and-fintech", description: "India payment gateway & wallet", status: "live", route: "/integrations/paytm" },
  { slug: "payu", name: "PayU", category: "india-payments-and-fintech", description: "India payment gateway", status: "live", route: "/integrations/payu" },
  { slug: "razorpay-apps", name: "Razorpay Apps", category: "india-payments-and-fintech", description: "Razorpay app marketplace integration", status: "live", route: "/integrations/razorpay-apps" },

  // ── India KYC & Government (4) ──
  { slug: "quikr-leads", name: "Quikr Leads", category: "india-kyc-and-government", description: "India classifieds lead generation", status: "live", route: "/integrations/quikr-leads" },
  { slug: "olx-leads", name: "OLX Leads", category: "india-kyc-and-government", description: "India classifieds lead generation", status: "live", route: "/integrations/olx-leads" },
  { slug: "justdial-premium", name: "JustDial Premium", category: "india-kyc-and-government", description: "India local business premium leads", status: "live", route: "/integrations/justdial-premium" },
  { slug: "rera-compliance", name: "RERA Compliance", category: "india-kyc-and-government", description: "India real estate regulatory compliance", status: "live", route: "/integrations/rera-compliance" },

  // ── South & East Asia (1) ──
  { slug: "tiktok-shop", name: "TikTok Shop", category: "south-and-east-asia", description: "SEA social commerce platform", status: "live", route: "/integrations/tiktok-shop" },

  // ── AI / LLM (3) ──
  { slug: "gemini-extensions", name: "Gemini Extensions", category: "ai-llm", description: "Google Gemini AI Extensions", status: "live", route: "/integrations/gemini-extensions" },
  { slug: "huggingface", name: "HuggingFace", category: "ai-llm", description: "Open-source AI model hub", status: "live", route: "/integrations/huggingface" },
  { slug: "mistral-ai", name: "Mistral AI", category: "ai-llm", description: "Open & efficient LLM platform", status: "live", route: "/integrations/mistral-ai" },

  // ── iPaaS & Automation (9) ──
  { slug: "cloudflare-workers", name: "Cloudflare Workers", category: "ipaas-and-automation", description: "Edge compute & serverless platform", status: "live", route: "/integrations/cloudflare-workers" },
  { slug: "hasura", name: "Hasura", category: "ipaas-and-automation", description: "GraphQL engine with event triggers", status: "live", route: "/integrations/hasura" },
  { slug: "raycast", name: "Raycast", category: "ipaas-and-automation", description: "macOS productivity launcher", status: "live", route: "/integrations/raycast" },
  { slug: "alfred", name: "Alfred", category: "ipaas-and-automation", description: "macOS Alfred workflow automation", status: "live", route: "/integrations/alfred" },
  { slug: "stream-deck", name: "Stream Deck", category: "ipaas-and-automation", description: "Elgato Stream Deck plugin actions", status: "live", route: "/integrations/stream-deck" },
  { slug: "ifttt", name: "IFTTT", category: "ipaas-and-automation", description: "If-This-Then-That automation", status: "live", route: "/integrations/ifttt" },
  { slug: "pipedream", name: "Pipedream", category: "ipaas-and-automation", description: "Serverless workflow automation", status: "live", route: "/integrations/pipedream" },
  { slug: "retool", name: "Retool", category: "ipaas-and-automation", description: "Internal tools & dashboards platform", status: "live", route: "/integrations/retool" },
  { slug: "bubble", name: "Bubble", category: "ipaas-and-automation", description: "No-code app builder webhooks", status: "live", route: "/integrations/bubble" },

  // ── Lead Enrichment Pro (4) ──
  { slug: "linkedin-sales-navigator", name: "LinkedIn Sales Navigator", category: "lead-enrichment-pro", description: "LinkedIn B2B prospecting & insights", status: "live", route: "/integrations/linkedin-sales-navigator" },
  { slug: "zoominfo-engage", name: "ZoomInfo Engage", category: "lead-enrichment-pro", description: "ZoomInfo sales engagement platform", status: "live", route: "/integrations/zoominfo-engage" },
  { slug: "hunter-io-enrich", name: "Hunter.io Enrich", category: "lead-enrichment-pro", description: "Email finder & enrichment", status: "live", route: "/integrations/hunter-io-enrich" },
  { slug: "dealhub", name: "DealHub", category: "lead-enrichment-pro", description: "CPQ & sales engagement platform", status: "live", route: "/integrations/dealhub" },

  // ── Maps & Location (5) ──
  { slug: "mapbox", name: "Mapbox", category: "maps-and-location", description: "Maps & geocoding platform", status: "live", route: "/integrations/mapbox" },
  { slug: "here-maps", name: "HERE Maps", category: "maps-and-location", description: "HERE geocoding & mapping APIs", status: "live", route: "/integrations/here-maps" },
  { slug: "tomtom", name: "TomTom", category: "maps-and-location", description: "TomTom maps & geocoding", status: "live", route: "/integrations/tomtom" },
  { slug: "openstreetmap", name: "OpenStreetMap", category: "maps-and-location", description: "Free Nominatim geocoding (no API key)", status: "live", route: "/integrations/openstreetmap" },
  { slug: "radar-io", name: "Radar.io", category: "maps-and-location", description: "Geofencing & location platform", status: "live", route: "/integrations/radar-io" },

  // ── NPS & Surveys (1) ──
  { slug: "usertesting", name: "UserTesting", category: "nps-and-surveys", description: "Human insights & UX research", status: "live", route: "/integrations/usertesting" },

  // ── Files & Storage (1) ──
  { slug: "google-workspace", name: "Google Workspace", category: "files-and-storage", description: "Google Workspace admin & directory", status: "live", route: "/integrations/google-workspace" },

  // ── Browser & Desktop Extensions (3) ──
  { slug: "chrome-extension", name: "Chrome Extension", category: "browser-and-desktop-extensions", description: "HelloCRM Chrome browser extension", status: "live", route: "/integrations/chrome-extension" },
  { slug: "firefox-add-on", name: "Firefox Add-on", category: "browser-and-desktop-extensions", description: "HelloCRM Firefox browser add-on", status: "live", route: "/integrations/firefox-add-on" },
  { slug: "edge-extension", name: "Edge Extension", category: "browser-and-desktop-extensions", description: "HelloCRM Microsoft Edge extension", status: "live", route: "/integrations/edge-extension" },

  // ── Developer & Auth (6) ──
  { slug: "auth0", name: "Auth0", category: "developer-and-auth", description: "Single sign-on via Auth0 for tenant users.", status: "live", route: "/integrations/auth0" },
  { slug: "salesforce-appexchange", name: "Salesforce AppExchange", category: "developer-and-auth", description: "Salesforce AppExchange marketplace listings", status: "live", route: "/integrations/salesforce-appexchange" },
  { slug: "docusign-marketplace", name: "DocuSign Marketplace", category: "developer-and-auth", description: "DocuSign App Marketplace OAuth & webhook", status: "live", route: "/integrations/docusign-marketplace" },
  { slug: "notion-template", name: "Notion Template", category: "developer-and-auth", description: "Notion template gallery sync", status: "live", route: "/integrations/notion-template" },
  { slug: "crisp-marketplace", name: "Crisp Marketplace", category: "developer-and-auth", description: "Crisp app marketplace integration", status: "live", route: "/integrations/crisp-marketplace" },
  { slug: "justdial-marketplace", name: "JustDial Marketplace", category: "developer-and-auth", description: "JustDial app marketplace receiver", status: "live", route: "/integrations/justdial-marketplace" },

  // ── Coming Soon · eCommerce (1) ──
  { slug: "ebay", name: "eBay", category: "coming-soon-ecommerce", description: "Sync eBay buyer enquiries & sales as CRM leads.", status: "scaffolded", route: "/integrations/ebay" },

  // ── Coming Soon · Accounting (2) ──
  { slug: "sage-intacct", name: "Sage Intacct", category: "coming-soon-accounting", description: "Cloud financial management sync", status: "scaffolded", route: "/integrations/sage-intacct" },
  { slug: "wave", name: "Wave", category: "coming-soon-accounting", description: "Free accounting for small businesses", status: "scaffolded", route: "/integrations/wave" },

  // ── Coming Soon · HR & Payroll (3) ──
  { slug: "gusto", name: "Gusto", category: "coming-soon-hr-and-payroll", description: "Payroll, benefits & HR for small business", status: "scaffolded", route: "/integrations/gusto" },
  { slug: "bamboohr", name: "BambooHR", category: "coming-soon-hr-and-payroll", description: "HRIS for small & medium business", status: "scaffolded", route: "/integrations/bamboohr" },
  { slug: "rippling", name: "Rippling", category: "coming-soon-hr-and-payroll", description: "Unified HR, IT & finance platform", status: "scaffolded", route: "/integrations/rippling" },

  // ── Coming Soon · Real Estate (Extras) (2) ──
  { slug: "houzz", name: "Houzz", category: "coming-soon-real-estate", description: "Home design & remodeling platform", status: "scaffolded", route: "/integrations/houzz" },
  { slug: "bridge-interactive", name: "Bridge Interactive", category: "coming-soon-real-estate", description: "Real estate listing API platform", status: "scaffolded", route: "/integrations/bridge-interactive" },

  // ── Coming Soon · Customer Data Platforms (1) ──
  { slug: "heap", name: "Heap", category: "coming-soon-customer-data-platforms", description: "Digital insights platform", status: "scaffolded", route: "/integrations/heap" },

  // ── Coming Soon · Gifting & Direct Mail (1) ──
  { slug: "postal-io", name: "Postal.io", category: "coming-soon-gifting-and-direct-mail", description: "Global offline marketing engagement", status: "scaffolded", route: "/integrations/postal-io" },

  // ── Coming Soon · Document & Signing (1) ──
  { slug: "better-proposals", name: "Better Proposals", category: "coming-soon-document-and-signing", description: "Proposal software for closing deals", status: "scaffolded", route: "/integrations/better-proposals" },

  // ── Coming Soon · Helpdesk Extras (2) ──
  { slug: "tawk-to", name: "Tawk.to", category: "coming-soon-helpdesk-extras", description: "Free live chat for websites", status: "scaffolded", route: "/integrations/tawk-to" },
  { slug: "salesforce-service-cloud", name: "Salesforce Service Cloud", category: "coming-soon-helpdesk-extras", description: "Enterprise customer service platform", status: "scaffolded", route: "/integrations/salesforce-service-cloud" },

  // ── Coming Soon · Identity & Auth (1) ──
  { slug: "okta", name: "Okta", category: "coming-soon-identity-and-auth", description: "Workforce & customer identity platform", status: "scaffolded", route: "/integrations/okta" },

  // ── Coming Soon · Social Media Extras (2) ──
  { slug: "sprout-social", name: "Sprout Social", category: "coming-soon-social-media-extras", description: "Social media management platform", status: "scaffolded", route: "/integrations/sprout-social" },
  { slug: "later", name: "Later", category: "coming-soon-social-media-extras", description: "Visual social media planner", status: "scaffolded", route: "/integrations/later" },

  // ── Coming Soon · More CRMs (12) ──
  { slug: "capsule-crm", name: "Capsule CRM", category: "coming-soon-more-crms", description: "Simple CRM for small business", status: "scaffolded", route: "/integrations/capsule-crm" },
  { slug: "less-annoying-crm", name: "Less Annoying CRM", category: "coming-soon-more-crms", description: "Simple CRM for small businesses", status: "scaffolded", route: "/integrations/less-annoying-crm" },
  { slug: "streak", name: "Streak", category: "coming-soon-more-crms", description: "CRM that lives in Gmail", status: "scaffolded", route: "/integrations/streak" },
  { slug: "bitrix24", name: "Bitrix24", category: "coming-soon-more-crms", description: "Free CRM & collaboration platform", status: "scaffolded", route: "/integrations/bitrix24" },
  { slug: "nutshell", name: "Nutshell", category: "coming-soon-more-crms", description: "Sales automation CRM", status: "scaffolded", route: "/integrations/nutshell" },
  { slug: "nimble", name: "Nimble", category: "coming-soon-more-crms", description: "Social CRM for relationship building", status: "scaffolded", route: "/integrations/nimble" },
  { slug: "sugarcrm", name: "SugarCRM", category: "coming-soon-more-crms", description: "Customer experience platform", status: "scaffolded", route: "/integrations/sugarcrm" },
  { slug: "vtiger", name: "Vtiger", category: "coming-soon-more-crms", description: "All-in-one CRM platform", status: "scaffolded", route: "/integrations/vtiger" },
  { slug: "salesflare", name: "Salesflare", category: "coming-soon-more-crms", description: "Intelligent CRM for SMBs", status: "scaffolded", route: "/integrations/salesflare" },
  { slug: "close", name: "Close", category: "coming-soon-more-crms", description: "Inside sales CRM with built-in calling", status: "scaffolded", route: "/integrations/close" },
  { slug: "engagebay", name: "EngageBay", category: "coming-soon-more-crms", description: "All-in-one marketing, sales & support", status: "scaffolded", route: "/integrations/engagebay" },
  { slug: "salesmate", name: "Salesmate", category: "coming-soon-more-crms", description: "Sales CRM & automation platform", status: "scaffolded", route: "/integrations/salesmate" },

  // ── Coming Soon · More Email Marketing (9) ──
  { slug: "aweber", name: "AWeber", category: "coming-soon-more-email-marketing", description: "Email marketing & autoresponders", status: "scaffolded", route: "/integrations/aweber" },
  { slug: "sendlane", name: "Sendlane", category: "coming-soon-more-email-marketing", description: "Unified email & SMS automation", status: "scaffolded", route: "/integrations/sendlane" },
  { slug: "beehiiv", name: "Beehiiv", category: "coming-soon-more-email-marketing", description: "Modern newsletter publishing platform", status: "scaffolded", route: "/integrations/beehiiv" },
  { slug: "activetrail", name: "ActiveTrail", category: "coming-soon-more-email-marketing", description: "Email & marketing automation", status: "scaffolded", route: "/integrations/activetrail" },
  { slug: "mailersend", name: "MailerSend", category: "coming-soon-more-email-marketing", description: "Transactional email API", status: "scaffolded", route: "/integrations/mailersend" },
  { slug: "litmus", name: "Litmus", category: "coming-soon-more-email-marketing", description: "Email design & testing platform", status: "scaffolded", route: "/integrations/litmus" },
  { slug: "mailjet", name: "Mailjet", category: "coming-soon-more-email-marketing", description: "Email service for marketers & developers", status: "scaffolded", route: "/integrations/mailjet" },
  { slug: "convertflow", name: "ConvertFlow", category: "coming-soon-more-email-marketing", description: "On-site conversion campaigns", status: "scaffolded", route: "/integrations/convertflow" },
  { slug: "manychat", name: "ManyChat", category: "coming-soon-more-email-marketing", description: "Chat marketing for FB, IG & SMS", status: "scaffolded", route: "/integrations/manychat" },

  // ── Coming Soon · Product / UX Analytics (8) ──
  { slug: "hotjar", name: "Hotjar", category: "coming-soon-product-ux-analytics", description: "Heatmaps, recordings & feedback", status: "scaffolded", route: "/integrations/hotjar" },
  { slug: "logrocket", name: "LogRocket", category: "coming-soon-product-ux-analytics", description: "Frontend monitoring & session replay", status: "scaffolded", route: "/integrations/logrocket" },
  { slug: "pendo", name: "Pendo", category: "coming-soon-product-ux-analytics", description: "Product analytics & user guidance", status: "scaffolded", route: "/integrations/pendo" },
  { slug: "userpilot", name: "Userpilot", category: "coming-soon-product-ux-analytics", description: "Product growth & onboarding", status: "scaffolded", route: "/integrations/userpilot" },
  { slug: "plausible", name: "Plausible", category: "coming-soon-product-ux-analytics", description: "Privacy-friendly web analytics", status: "scaffolded", route: "/integrations/plausible" },
  { slug: "simple-analytics", name: "Simple Analytics", category: "coming-soon-product-ux-analytics", description: "Privacy-first web analytics", status: "scaffolded", route: "/integrations/simple-analytics" },
  { slug: "smartlook", name: "Smartlook", category: "coming-soon-product-ux-analytics", description: "Qualitative analytics & recordings", status: "scaffolded", route: "/integrations/smartlook" },
  { slug: "crazy-egg", name: "Crazy Egg", category: "coming-soon-product-ux-analytics", description: "Heatmaps & A/B testing", status: "scaffolded", route: "/integrations/crazy-egg" },

  // ── Coming Soon · Finance & Spend (7) ──
  { slug: "brex", name: "Brex", category: "coming-soon-finance-and-spend", description: "Corporate cards & financial software", status: "scaffolded", route: "/integrations/brex" },
  { slug: "mercury", name: "Mercury", category: "coming-soon-finance-and-spend", description: "Banking built for startups", status: "scaffolded", route: "/integrations/mercury" },
  { slug: "ramp", name: "Ramp", category: "coming-soon-finance-and-spend", description: "Corporate cards & spend management", status: "scaffolded", route: "/integrations/ramp" },
  { slug: "bill-com", name: "Bill.com", category: "coming-soon-finance-and-spend", description: "AP & AR automation platform", status: "scaffolded", route: "/integrations/bill-com" },
  { slug: "expensify", name: "Expensify", category: "coming-soon-finance-and-spend", description: "Expense reports & receipt scanning", status: "scaffolded", route: "/integrations/expensify" },
  { slug: "stax-payments", name: "Stax Payments", category: "coming-soon-finance-and-spend", description: "Subscription-style payment processing", status: "scaffolded", route: "/integrations/stax-payments" },
  { slug: "divvy", name: "Divvy", category: "coming-soon-finance-and-spend", description: "Business expense & budget software", status: "scaffolded", route: "/integrations/divvy" },

  // ── Coming Soon · Design & Creative (4) ──
  { slug: "canva", name: "Canva", category: "coming-soon-design-and-creative", description: "Online graphic design platform", status: "scaffolded", route: "/integrations/canva" },
  { slug: "sketch", name: "Sketch", category: "coming-soon-design-and-creative", description: "Digital design platform for Mac", status: "scaffolded", route: "/integrations/sketch" },
  { slug: "invision", name: "InVision", category: "coming-soon-design-and-creative", description: "Digital product design platform", status: "scaffolded", route: "/integrations/invision" },
  { slug: "adobe-creative-cloud", name: "Adobe Creative Cloud", category: "coming-soon-design-and-creative", description: "Adobe creative suite integration", status: "scaffolded", route: "/integrations/adobe-creative-cloud" },

  // ── Coming Soon · Dev Tools & Code (7) ──
  { slug: "github", name: "GitHub", category: "coming-soon-dev-tools-and-code", description: "Code hosting & collaboration", status: "scaffolded", route: "/integrations/github" },
  { slug: "gitlab", name: "GitLab", category: "coming-soon-dev-tools-and-code", description: "DevOps platform & code hosting", status: "scaffolded", route: "/integrations/gitlab" },
  { slug: "bitbucket", name: "Bitbucket", category: "coming-soon-dev-tools-and-code", description: "Atlassian git code management", status: "scaffolded", route: "/integrations/bitbucket" },
  { slug: "vercel", name: "Vercel", category: "coming-soon-dev-tools-and-code", description: "Frontend cloud platform", status: "scaffolded", route: "/integrations/vercel" },
  { slug: "netlify", name: "Netlify", category: "coming-soon-dev-tools-and-code", description: "Web platform for modern apps", status: "scaffolded", route: "/integrations/netlify" },
  { slug: "circleci", name: "CircleCI", category: "coming-soon-dev-tools-and-code", description: "Continuous integration & delivery", status: "scaffolded", route: "/integrations/circleci" },
  { slug: "jenkins", name: "Jenkins", category: "coming-soon-dev-tools-and-code", description: "Open-source automation server", status: "scaffolded", route: "/integrations/jenkins" },

  // ── Coming Soon · HR & Recruiting Extras (7) ──
  { slug: "workday", name: "Workday", category: "coming-soon-hr-and-recruiting-extras", description: "Enterprise HCM & financial platform", status: "scaffolded", route: "/integrations/workday" },
  { slug: "greenhouse", name: "Greenhouse", category: "coming-soon-hr-and-recruiting-extras", description: "Hiring & applicant tracking", status: "scaffolded", route: "/integrations/greenhouse" },
  { slug: "lever", name: "Lever", category: "coming-soon-hr-and-recruiting-extras", description: "Talent acquisition platform", status: "scaffolded", route: "/integrations/lever" },
  { slug: "jobadder", name: "JobAdder", category: "coming-soon-hr-and-recruiting-extras", description: "Recruitment platform & ATS", status: "scaffolded", route: "/integrations/jobadder" },
  { slug: "bullhorn", name: "Bullhorn", category: "coming-soon-hr-and-recruiting-extras", description: "Staffing & recruiting CRM", status: "scaffolded", route: "/integrations/bullhorn" },
  { slug: "workable", name: "Workable", category: "coming-soon-hr-and-recruiting-extras", description: "ATS & recruiting platform", status: "scaffolded", route: "/integrations/workable" },
  { slug: "recruitee", name: "Recruitee", category: "coming-soon-hr-and-recruiting-extras", description: "Collaborative hiring platform", status: "scaffolded", route: "/integrations/recruitee" },

  // ── Coming Soon · Events & Webinars (4) ──
  { slug: "hopin", name: "Hopin", category: "coming-soon-events-and-webinars", description: "Virtual & hybrid event platform", status: "scaffolded", route: "/integrations/hopin" },
  { slug: "bizzabo", name: "Bizzabo", category: "coming-soon-events-and-webinars", description: "Event experience platform", status: "scaffolded", route: "/integrations/bizzabo" },
  { slug: "cvent", name: "Cvent", category: "coming-soon-events-and-webinars", description: "Event management software", status: "scaffolded", route: "/integrations/cvent" },
  { slug: "zoom-webinars", name: "Zoom Webinars", category: "coming-soon-events-and-webinars", description: "Zoom webinar registration & sync", status: "scaffolded", route: "/integrations/zoom-webinars" },

  // ── Coming Soon · Security & Compliance (4) ──
  { slug: "vanta", name: "Vanta", category: "coming-soon-security-and-compliance", description: "Automated security compliance", status: "scaffolded", route: "/integrations/vanta" },
  { slug: "drata", name: "Drata", category: "coming-soon-security-and-compliance", description: "Security & compliance automation", status: "scaffolded", route: "/integrations/drata" },
  { slug: "securityscorecard", name: "SecurityScorecard", category: "coming-soon-security-and-compliance", description: "Cybersecurity ratings & analytics", status: "scaffolded", route: "/integrations/securityscorecard" },
  { slug: "onetrust", name: "OneTrust", category: "coming-soon-security-and-compliance", description: "Privacy & data governance", status: "scaffolded", route: "/integrations/onetrust" },

  // ── Coming Soon · AI Coding & Productivity (5) ──
  { slug: "cursor", name: "Cursor", category: "coming-soon-ai-coding-and-productivity", description: "AI-powered code editor", status: "scaffolded", route: "/integrations/cursor" },
  { slug: "github-copilot", name: "GitHub Copilot", category: "coming-soon-ai-coding-and-productivity", description: "AI pair programmer from GitHub", status: "scaffolded", route: "/integrations/github-copilot" },
  { slug: "glean", name: "Glean", category: "coming-soon-ai-coding-and-productivity", description: "Work AI for enterprise search", status: "scaffolded", route: "/integrations/glean" },
  { slug: "tabnine", name: "Tabnine", category: "coming-soon-ai-coding-and-productivity", description: "AI code assistant for teams", status: "scaffolded", route: "/integrations/tabnine" },
  { slug: "codeium", name: "Codeium", category: "coming-soon-ai-coding-and-productivity", description: "Free AI coding autocomplete", status: "scaffolded", route: "/integrations/codeium" },

  // ── Coming Soon · Payment Gateways (7) ──
  { slug: "adyen", name: "Adyen", category: "coming-soon-payment-gateways", description: "Global payment platform", status: "scaffolded", route: "/integrations/adyen" },
  { slug: "authorize-net", name: "Authorize.net", category: "coming-soon-payment-gateways", description: "Visa payment gateway", status: "scaffolded", route: "/integrations/authorize-net" },
  { slug: "worldpay", name: "Worldpay", category: "coming-soon-payment-gateways", description: "Global merchant services", status: "scaffolded", route: "/integrations/worldpay" },
  { slug: "klarna", name: "Klarna", category: "coming-soon-payment-gateways", description: "Buy now, pay later platform", status: "scaffolded", route: "/integrations/klarna" },
  { slug: "affirm", name: "Affirm", category: "coming-soon-payment-gateways", description: "Buy now, pay later for shoppers", status: "scaffolded", route: "/integrations/affirm" },
  { slug: "afterpay", name: "Afterpay", category: "coming-soon-payment-gateways", description: "Buy now, pay later platform", status: "scaffolded", route: "/integrations/afterpay" },
  { slug: "braintree", name: "Braintree", category: "coming-soon-payment-gateways", description: "PayPal-owned payment processor", status: "scaffolded", route: "/integrations/braintree" },

  // ── Coming Soon · WhatsApp & SMS Providers (5) ──
  { slug: "messagebird", name: "MessageBird", category: "coming-soon-whatsapp-and-sms-providers", description: "Global SMS, voice & WhatsApp", status: "scaffolded", route: "/integrations/messagebird" },
  { slug: "wati", name: "Wati", category: "coming-soon-whatsapp-and-sms-providers", description: "WhatsApp business messaging", status: "scaffolded", route: "/integrations/wati" },
  { slug: "aisensy", name: "AiSensy", category: "coming-soon-whatsapp-and-sms-providers", description: "WhatsApp marketing & automation", status: "scaffolded", route: "/integrations/aisensy" },
  { slug: "interakt", name: "Interakt", category: "coming-soon-whatsapp-and-sms-providers", description: "Send WhatsApp messages via Interakt BSP.", status: "scaffolded", route: "/integrations/interakt" },
  { slug: "360dialog", name: "360dialog", category: "coming-soon-whatsapp-and-sms-providers", description: "WhatsApp Business Platform partner", status: "scaffolded", route: "/integrations/360dialog" },

  // ── Coming Soon · Scheduling Extras (1) ──
  { slug: "reclaim-ai", name: "Reclaim.ai", category: "coming-soon-scheduling-extras", description: "AI calendar for tasks & habits", status: "scaffolded", route: "/integrations/reclaim-ai" },

  // ── Coming Soon · PM & Task Extras (2) ──
  { slug: "todoist", name: "Todoist", category: "coming-soon-pm-and-task-extras", description: "Personal & team task management", status: "scaffolded", route: "/integrations/todoist" },
  { slug: "things", name: "Things", category: "coming-soon-pm-and-task-extras", description: "Personal task manager for Apple", status: "scaffolded", route: "/integrations/things" },

  // ── Coming Soon · Retail / Restaurant POS (1) ──
  { slug: "lightspeed-retail", name: "Lightspeed Retail", category: "coming-soon-retail-restaurant-pos", description: "Retail POS & inventory", status: "scaffolded", route: "/integrations/lightspeed-retail" },

  // ── Coming Soon · Marketing Attribution (4) ──
  { slug: "appsflyer", name: "AppsFlyer", category: "coming-soon-marketing-attribution", description: "Mobile attribution & marketing analytics", status: "scaffolded", route: "/integrations/appsflyer" },
  { slug: "adjust", name: "Adjust", category: "coming-soon-marketing-attribution", description: "Mobile measurement partner", status: "scaffolded", route: "/integrations/adjust" },
  { slug: "branch", name: "Branch", category: "coming-soon-marketing-attribution", description: "Mobile linking & attribution", status: "scaffolded", route: "/integrations/branch" },
  { slug: "singular", name: "Singular", category: "coming-soon-marketing-attribution", description: "Unified marketing analytics", status: "scaffolded", route: "/integrations/singular" },

  // ── Coming Soon · DAM & Brand Assets (3) ──
  { slug: "bynder", name: "Bynder", category: "coming-soon-dam-and-brand-assets", description: "Digital asset management", status: "scaffolded", route: "/integrations/bynder" },
  { slug: "brandfolder", name: "Brandfolder", category: "coming-soon-dam-and-brand-assets", description: "Brand asset management platform", status: "scaffolded", route: "/integrations/brandfolder" },
  { slug: "frontify", name: "Frontify", category: "coming-soon-dam-and-brand-assets", description: "Brand management platform", status: "scaffolded", route: "/integrations/frontify" },

  // ── Coming Soon · Conversation Intelligence (4) ──
  { slug: "otter-ai", name: "Otter.ai", category: "coming-soon-conversation-intelligence", description: "AI meeting transcription & notes", status: "scaffolded", route: "/integrations/otter-ai" },
  { slug: "fireflies-ai", name: "Fireflies.ai", category: "coming-soon-conversation-intelligence", description: "AI notetaker for meetings", status: "scaffolded", route: "/integrations/fireflies-ai" },
  { slug: "gong", name: "Gong", category: "coming-soon-conversation-intelligence", description: "Revenue intelligence platform", status: "scaffolded", route: "/integrations/gong" },
  { slug: "chorus-ai", name: "Chorus.ai", category: "coming-soon-conversation-intelligence", description: "ZoomInfo conversation analytics", status: "scaffolded", route: "/integrations/chorus-ai" },

  // ── Coming Soon · People Mgmt & Engagement (3) ──
  { slug: "lattice", name: "Lattice", category: "coming-soon-people-mgmt-and-engagement", description: "Performance & engagement platform", status: "scaffolded", route: "/integrations/lattice" },
  { slug: "officevibe", name: "Officevibe", category: "coming-soon-people-mgmt-and-engagement", description: "Employee engagement surveys", status: "scaffolded", route: "/integrations/officevibe" },
  { slug: "range", name: "Range", category: "coming-soon-people-mgmt-and-engagement", description: "Async team check-ins", status: "scaffolded", route: "/integrations/range" },
];

function categoryTitle(slug: string): string {
  return INTEGRATION_CATEGORIES.find((c) => c.slug === slug)?.title ?? slug;
}

// ── integrations_list ───────────────────────────────────────────────────────────

export const integrationsList = defineTool({
  schema: z.object({
    category: z
      .string()
      .optional()
      .describe("Filter by category slug, title, or short label (case-insensitive), e.g. communication, accounting, lead-capture."),
    search: z
      .string()
      .optional()
      .describe("Keyword filter on integration name or description (case-insensitive)."),
  }),
  definition: {
    name: "integrations_list",
    description:
      "List the HelloGrowthCRM integrations catalog mirrored from hellogrowthcrm.com/integrations (630 documented entries across 116 categories; 630+ total apps reachable incl. Zapier). Filterable by category and keyword.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Category slug, title, or short label filter (case-insensitive)." },
        search: { type: "string", description: "Keyword filter on name or description (case-insensitive)." },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    let items = INTEGRATIONS;
    let categoryMatch: IntegrationCategory | undefined;
    if (args.category) {
      const q = args.category.toLowerCase();
      categoryMatch = INTEGRATION_CATEGORIES.find(
        (c) => c.slug.toLowerCase() === q || c.title.toLowerCase() === q || c.shortLabel.toLowerCase() === q,
      );
      if (!categoryMatch) {
        return fail(
          `Category "${args.category}" not found. Valid category slugs: ${INTEGRATION_CATEGORIES.map((c) => c.slug).join(", ")}`,
        );
      }
      const matchSlug = categoryMatch.slug;
      items = items.filter((i) => i.category === matchSlug);
    }
    if (args.search) {
      const q = args.search.toLowerCase();
      items = items.filter(
        (i) => i.name.toLowerCase().includes(q) || i.slug.includes(q) || i.description.toLowerCase().includes(q),
      );
    }
    return ok({
      synced_at: SYNCED_AT,
      public_integration_count: PUBLIC_INTEGRATION_COUNT,
      total_documented: INTEGRATIONS.length,
      filtered_count: items.length,
      ...(categoryMatch ? { category: categoryMatch } : {}),
      items: items.map((i) => ({
        slug: i.slug,
        name: i.name,
        category: i.category,
        description: i.description,
        ...(i.status ? { status: i.status } : {}),
        url: `${SITE}${i.route}`,
      })),
    });
  },
});

// ── integrations_get ────────────────────────────────────────────────────────────

export const integrationsGet = defineTool({
  schema: z.object({
    slug: z.string().describe("Integration slug, e.g. whatsapp-meta, slack, shopify, quickbooks, indiamart."),
  }),
  definition: {
    name: "integrations_get",
    description:
      "Get one HelloGrowthCRM integration by slug with its name, category, description, status, and page URL on hellogrowthcrm.com.",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string", description: "Integration slug." } },
      required: ["slug"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    const slug = args.slug.toLowerCase().trim();
    const record = INTEGRATIONS.find((i) => i.slug === slug);
    if (!record) {
      const near = INTEGRATIONS.filter((i) => i.slug.includes(slug) || i.name.toLowerCase().includes(slug))
        .slice(0, 10)
        .map((i) => i.slug);
      const hint =
        near.length > 0
          ? `Did you mean: ${near.join(", ")}?`
          : `Use integrations_list (optionally with a category from integrations_list_categories) to browse all ${INTEGRATIONS.length} valid slugs.`;
      return fail(`Integration "${args.slug}" not found. ${hint}`);
    }
    return ok({
      synced_at: SYNCED_AT,
      slug: record.slug,
      name: record.name,
      category: record.category,
      category_title: categoryTitle(record.category),
      description: record.description,
      ...(record.status ? { status: record.status } : {}),
      route: record.route,
      url: `${SITE}${record.route}`,
    });
  },
});

// ── integrations_list_categories ────────────────────────────────────────────────

export const integrationsListCategories = defineTool({
  schema: z.object({}),
  definition: {
    name: "integrations_list_categories",
    description:
      "List all integration categories on hellogrowthcrm.com/integrations with the number of documented integrations in each.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  async handle(_args) {
    return ok({
      synced_at: SYNCED_AT,
      public_integration_count: PUBLIC_INTEGRATION_COUNT,
      total_documented: INTEGRATIONS.length,
      category_count: INTEGRATION_CATEGORIES.length,
      categories: INTEGRATION_CATEGORIES.map((c) => ({
        ...c,
        count: INTEGRATIONS.filter((i) => i.category === c.slug).length,
      })),
    });
  },
});
