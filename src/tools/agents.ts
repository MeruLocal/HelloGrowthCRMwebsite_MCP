import { z } from "zod";
import { defineTool, ok, fail } from "./tool-types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Static read-mirror data — Agentic AI / AI agents module.
//
// Source: hellocrmwebsite/src/views/agentic/AgenticAIHub.tsx (AGENTS card list,
//   hero copy, WHY_ITEMS) — SYNCED_AT 2026-06-11
// Source: hellocrmwebsite/src/views/agentic/VoiceAgentPage.tsx,
//   PostCallAgentPage.tsx, DealRiskAgentPage.tsx (per-agent taglines,
//   capabilities, how-it-works steps, FAQs) — SYNCED_AT 2026-06-11
// Source: hellocrmwebsite/src/views/agentic/MCPPage.tsx (MCP Connector hero)
//   — SYNCED_AT 2026-07-08
// Source: hellocrmwebsite/src/app/(public)/agentic-ai/[slug]/page.tsx
//   (AGENTIC_ALIAS_PAGES titles, descriptions, keywords, SEO section headings)
//   — SYNCED_AT 2026-06-11
// Source: hellocrmwebsite/src/views/agentic/AutonomyLevelsPage.tsx
//   (LEVEL_DETAILS, SAFETY_RAILS) and
//   hellocrmwebsite/src/components/agentic/AutonomyLevelMatrix.tsx (matrix rows)
//   — SYNCED_AT 2026-06-11
// Source: hellocrmwebsite/src/views/agentic/VsAgentforcePage.tsx, VsBreezePage.tsx,
//   VsCopilotPage.tsx, VsZiaPage.tsx (comparison headlines + hero positioning)
//   — SYNCED_AT 2026-07-08
//
// This is a READ-MIRROR: data is copied verbatim from website files (long FAQ
// answers truncated to their opening sentences), never invented.
// ─────────────────────────────────────────────────────────────────────────────

const SYNCED_AT = "2026-07-08";
const SITE = "https://hellogrowthcrm.com";

type AutonomyLevel = "autonomous" | "supervised" | "assistive";

interface AgentFaq {
  q: string;
  a: string;
}

interface AgentRecord {
  slug: string;
  name: string;
  route: string;
  autonomyLevel: AutonomyLevel;
  /** One-line card description from the /agentic-ai hub. */
  summary: string;
  /** Page H1 (dedicated pages) or meta title (alias pages). */
  tagline: string;
  /** Hero paragraph (dedicated pages) or meta description (alias pages). */
  detail: string;
  keywords?: string[];
  capabilities?: string[];
  howItWorks?: Array<{ step: string; title: string; desc: string }>;
  /** Deal Risk Agent only — monitored signals table. */
  riskSignals?: Array<{ signal: string; risk: "High" | "Medium" | "Low" }>;
  /** Alias pages — headings of the extra SEO body sections on the page. */
  seoSectionHeadings?: string[];
  faqs?: AgentFaq[];
}

// Hub framing — Source: AgenticAIHub.tsx hero — SYNCED_AT 2026-06-11
const HUB = {
  route: "/agentic-ai",
  badge: "12 AI Agents. 3 Autonomy Levels. One CRM.",
  h1: "Agentic AI for Sales Teams That Need Results, Not Demos",
  hero: "HelloGrowthCRM's AI agents call leads, run journeys, qualify inbound, coach reps, and update your CRM — autonomously, with full audit trails and configurable safety rails. SMB pricing. Enterprise capability.",
};

// Related /product/* pages that overlap this module (full detail available via
// products_list / product_get) — route only, mirrored from the app router:
const RELATED_PRODUCT_PAGES = [
  "/product/ai-agents",
  "/product/ai-voice-agents",
  "/product/ai-crm-agent",
];

const AGENTS: AgentRecord[] = [
  {
    slug: "voice-agent",
    name: "Voice Agent",
    route: "/agentic-ai/voice-agent",
    autonomyLevel: "autonomous",
    summary: "Calls, qualifies, and routes leads 24/7 with natural conversation AI.",
    tagline: "AI Voice Agent — Calls, Qualifies, and Routes Leads 24/7",
    detail:
      "Deploy an AI voice agent that calls new leads within minutes, runs your qualification script in natural conversation, and routes hot leads to human reps with full context — all without a rep dialling a single number.",
    capabilities: [
      "Natural-sounding AI voice (ElevenLabs-powered)",
      "Customisable qualification scripts with branching",
      "BANT, MEDDIC, or custom framework support",
      "Voicemail detection & leave-message",
      "Call recording + AI transcription",
      "Structured field capture (budget, timeline, pain)",
      "Instant rep handoff with full context",
      "Sentiment analysis per conversation",
      "Multi-attempt with configurable retry logic",
      "Local number display (Twilio-powered)",
      "Real-time rep notification on qualification",
      "Full audit log of every call action",
    ],
    howItWorks: [
      { step: "1", title: "Lead arrives in CRM", desc: "From any source — web form, WhatsApp, ad, API, or manual upload. The agent triggers within your configured delay (typically < 2 minutes)." },
      { step: "2", title: "Agent calls with your script", desc: "Natural conversational AI runs your qualification flow — asks questions, listens, adapts to responses. Branching logic handles common objections." },
      { step: "3", title: "Structured data captured", desc: "BANT answers, budget, timeline, pain points — all captured as structured CRM fields, not just a transcript blob." },
      { step: "4", title: "Hot leads routed to reps", desc: "Qualified leads are immediately assigned to the right rep with score, context, and transcript. Reps see a complete picture before saying hello." },
      { step: "5", title: "Cold leads enter nurture", desc: "Unqualified leads flow into automated email/WhatsApp sequences. No lead is abandoned — just nurtured at the right pace." },
    ],
    faqs: [
      { q: "Does the AI voice sound robotic?", a: "No. We use ElevenLabs voice synthesis with natural pausing, tone variation, and context awareness. Most leads complete the conversation without knowing it's AI." },
      { q: "What languages are supported?", a: "English (US and India accent variants) are live. Additional languages are on the roadmap — contact us for specific requirements." },
      { q: "How quickly can I go live?", a: "Most teams have their first voice agent deployed within 2 hours using our template scripts. You configure the script, set triggers, test on a dummy lead, and flip the switch." },
      { q: "Is this compliant with calling regulations?", a: "Yes. HelloGrowthCRM's AI voice agent follows TCPA, DNC registry, and local calling regulations. Opt-out requests are honoured immediately and logged." },
      { q: "What happens if the AI can't handle an objection?", a: "The agent follows your configured objection-handling paths. For out-of-scope situations, it gracefully sets a callback time and notifies the rep immediately." },
    ],
  },
  {
    slug: "journey-agent",
    name: "Journey Agent",
    route: "/agentic-ai/journey-agent",
    autonomyLevel: "autonomous",
    summary: "Runs multi-step lead journeys — email, SMS, WhatsApp, and calls — automatically.",
    tagline: "Journey Agent — Autonomous Lead Journey Automation",
    detail:
      "Autonomous AI journey agent that runs multi-step lead nurture across email, SMS, WhatsApp, and call actions from your CRM.",
    keywords: ["journey agent crm", "ai journey agent", "lead journey automation", "autonomous nurture agent"],
    seoSectionHeadings: [
      "What Makes the Journey Agent Different From Sequence Automation",
      "Journey Agent Configuration and Autonomy",
    ],
  },
  {
    slug: "cold-outreach-agent",
    name: "Cold Outreach Agent",
    route: "/agentic-ai/cold-outreach-agent",
    autonomyLevel: "supervised",
    summary: "Personalises and sends cold campaigns across email, LinkedIn, and WhatsApp.",
    tagline: "Cold Outreach Agent — AI Outbound Campaign Automation",
    detail:
      "AI cold outreach agent for multi-step email, LinkedIn, and WhatsApp campaigns with personalization, reply routing, and analytics.",
    keywords: ["cold outreach agent", "ai outbound agent", "cold email ai agent", "outreach automation crm"],
    seoSectionHeadings: [
      "Cold Outreach Agent vs Traditional Cold Email Tools",
      "Deliverability and Compliance in the Cold Outreach Agent",
    ],
  },
  {
    slug: "lead-routing-agent",
    name: "Lead Routing Agent",
    route: "/agentic-ai/lead-routing-agent",
    autonomyLevel: "autonomous",
    summary: "ML-based smart routing — assigns leads to the right rep in real time.",
    tagline: "Lead Routing Agent — AI Lead Assignment & Speed-to-Lead",
    detail:
      "AI lead routing agent that assigns every inbound lead to the best-fit rep instantly using territory, capacity, and routing rules.",
    keywords: ["lead routing agent", "ai lead assignment", "routing agent crm", "speed to lead ai"],
    seoSectionHeadings: [
      "AI Lead Routing vs Rule-Based Assignment",
      "Speed to Lead and Why It Determines Conversion",
    ],
  },
  {
    slug: "post-call-agent",
    name: "Post-Call Agent",
    route: "/agentic-ai/post-call-agent",
    autonomyLevel: "autonomous",
    summary: "Transcribes, summarises, and logs follow-up actions from every call.",
    tagline: "Post-Call Agent — Transcribes, Summarises, and Logs Follow-Up Actions Automatically",
    detail:
      "Every call ends. Most reps spend 5-10 minutes on post-call admin. The Post-Call Agent does it in 30 seconds — transcribing the call, extracting key commitments, updating CRM fields, and creating follow-up tasks automatically.",
    capabilities: [
      "Full call transcription with speaker labels",
      "AI-generated structured call summary",
      "Commitment and next-step extraction",
      "Automatic CRM field updates",
      "Follow-up task creation with due dates",
      "Objection and concern tagging",
      "Budget and timeline detection",
      "Sentiment analysis per speaker",
      "Searchable transcript library",
      "Slack/email rep notification",
      "Manager coaching flags on key moments",
      "Full audit log of every agent action",
    ],
    howItWorks: [
      { step: "1", title: "Call ends", desc: "Works with any call source: CRM dialer, SIP trunk, inbound queue, or Twilio. Agent activates on call completion." },
      { step: "2", title: "Transcription (< 30 seconds)", desc: "Full call transcript generated via Deepgram or AssemblyAI. Speaker labels separate rep and prospect. Timestamps on every turn." },
      { step: "3", title: "AI Summary & Extraction", desc: "LLM extracts: key decisions made, next steps committed, objections raised, budget/timeline mentions, requested follow-ups. Output is structured, not a wall of text." },
      { step: "4", title: "CRM Updated Automatically", desc: "Deal stage, contact fields (pain point, budget, timeline), and pipeline notes updated without rep touching the keyboard." },
      { step: "5", title: "Follow-up Tasks Created", desc: "Tasks created for every committed next step — assigned to the right rep, due on the committed date, linked to the deal." },
      { step: "6", title: "Rep Notified", desc: "Rep gets a Slack/email summary of what the agent did. They can review, edit, or add context — but the base work is already done." },
    ],
    faqs: [
      { q: "How much time does the Post-Call Agent actually save?", a: "Sales reps typically spend 5 to 10 minutes after each call updating CRM notes, logging activity, creating follow-up tasks, and sending a summary email. At 20 calls per day, the agent recovers 1.5 to 3 hours of selling time per rep per day by completing the same workflow in under 30 seconds per call." },
      { q: "Which call sources does the Post-Call Agent support?", a: "The Post-Call Agent integrates with HelloGrowthCRM's built-in dialer, SIP trunks, Twilio-powered inbound call queues, and the Voice Agent's autonomous outbound calls. All calls are transcribed using Deepgram or AssemblyAI with speaker diarization." },
      { q: "How accurate is the AI extraction of commitments and next steps?", a: "The extraction model is trained specifically on sales conversation patterns. Accuracy on well-recorded calls is consistently above 90% for structured outputs, and the rep can review and correct what the agent extracted before confirming." },
      { q: "Can the Post-Call Agent update custom CRM fields?", a: "Yes. Any custom field you have configured in HelloGrowthCRM can be mapped to an extraction pattern in the Post-Call Agent settings. Standard field updates (deal stage, contact status, next activity date) are pre-configured out of the box." },
      { q: "Is call data stored and is it GDPR compliant?", a: "Call transcripts are stored in your HelloGrowthCRM account, can auto-delete after a retention period, and support PII masking. HelloGrowthCRM is designed to comply with GDPR and India's DPDPA framework." },
    ],
  },
  {
    slug: "call-coach-agent",
    name: "Call Coach Agent",
    route: "/agentic-ai/call-coach-agent",
    autonomyLevel: "assistive",
    summary: "Surfaces real-time talk-track hints and deal risk signals during live calls.",
    tagline: "Call Coach Agent — Real-Time AI Sales Call Guidance",
    detail:
      "AI call coach agent that surfaces objection handling, battle cards, and live coaching tips while reps are on the phone.",
    keywords: ["call coach agent", "ai call coaching agent", "sales coaching ai", "real time call guidance"],
    seoSectionHeadings: [
      "Real-Time Coaching vs Post-Call Analysis",
      "Manager Coaching Workflows Enabled by the Call Coach Agent",
    ],
  },
  {
    slug: "sales-assistant-agent",
    name: "Sales Assistant Agent",
    route: "/agentic-ai/sales-assistant-agent",
    autonomyLevel: "assistive",
    summary: "Drafts follow-ups, meeting agendas, and pipeline updates for reps.",
    tagline: "Sales Assistant Agent — AI Copilot for Reps & Managers",
    detail:
      "AI sales assistant agent that prepares reps, drafts follow-ups, summarizes account context, and flags pipeline risks from live CRM data.",
    keywords: ["sales assistant agent", "ai sales copilot", "crm copilot agent", "rep assistant ai"],
    seoSectionHeadings: [
      "How HelloGrowthCRM AI Sales Copilot Works",
      "AI-Powered Email Drafting and Follow-Up",
      "Intelligent Deal Scoring and Pipeline Insights",
      "Meeting Preparation and Call Intelligence",
      "AI Sales Copilot vs Traditional CRM Automation",
      "ROI of AI Sales Copilot — Save 5+ Hours Per Week",
    ],
  },
  {
    slug: "crm-command-agent",
    name: "CRM Command Agent",
    route: "/agentic-ai/crm-command-agent",
    autonomyLevel: "supervised",
    summary: "Chat with your CRM — pull reports, update records, trigger workflows in plain English.",
    tagline: "CRM Command Agent — Talk to Your CRM in Natural Language",
    detail:
      "AI CRM command agent that lets you query, update, and automate your CRM with natural language using live MCP-connected data.",
    keywords: ["crm command agent", "ai crm agent", "natural language crm", "chat with your crm"],
    seoSectionHeadings: [
      "Natural Language CRM Interaction and What It Changes",
      "CRM Command Agent and MCP: Natural Language Meets Protocol",
    ],
  },
  {
    slug: "deal-risk-agent",
    name: "Deal Risk Agent",
    route: "/agentic-ai/deal-risk-agent",
    autonomyLevel: "assistive",
    summary: "Monitors deal health signals and alerts when pipeline is at risk.",
    tagline: "Deal Risk Agent — Spot At-Risk Deals Before They Go Dark",
    detail:
      "The Deal Risk Agent monitors your pipeline 24/7 for the signals that precede deal loss — silence, stalled stages, declining sentiment, and ghosted stakeholders — and alerts reps before it's too late to recover.",
    capabilities: [
      "AI deal health score per deal (0-100)",
      "Real-time risk signal monitoring",
      "Historical win/loss model calibration",
      "Rep and manager alert notifications",
      "Recommended intervention actions per alert",
      "Pipeline-wide at-risk summary for managers",
      "Custom risk signal thresholds",
      "Slack and email alert delivery",
      "Deal risk trend over time",
      "Integration with call sentiment data",
      "Email engagement drop detection",
      "Configurable alert frequency and priority",
    ],
    riskSignals: [
      { signal: "No activity in 14+ days", risk: "High" },
      { signal: "Stakeholder went dark after pricing call", risk: "High" },
      { signal: "Deal stage stalled more than expected", risk: "High" },
      { signal: "Contact sentiment declining across interactions", risk: "Medium" },
      { signal: "Decision-maker not engaged in 2+ meetings", risk: "Medium" },
      { signal: "Close date slipped 2+ times", risk: "Medium" },
      { signal: "Rep hasn't logged any activity this week", risk: "Low" },
      { signal: "Proposal not opened after 5 days", risk: "Low" },
    ],
    faqs: [
      { q: "What is deal risk scoring and how does it work?", a: "Deal risk scoring is an AI-driven metric that evaluates the probability of a deal closing successfully based on signals observed in your CRM data. Each deal receives a risk score from 0 to 100, updated in real time whenever a relevant signal changes — not just on a nightly batch cycle." },
      { q: "How is this different from standard CRM deal forecasting?", a: "Traditional CRM forecasting relies on static probability percentages attached to each pipeline stage. The Deal Risk Agent evaluates deal-specific signals and compares them against your historical win/loss data to calibrate a risk score based on what actually predicts loss in your pipeline, not generic benchmarks." },
      { q: "What signals trigger a high-risk alert?", a: "The most reliable predictors of deal loss are inactivity signals: no rep activity logged in 14+ days, a key stakeholder who has not responded to the last two or more outreach attempts, a close date pushed back twice or more, and a proposal not opened after five or more days. Each signal type has a configurable threshold." },
      { q: "Can the Deal Risk Agent recommend what action to take?", a: "Yes. When the agent surfaces a risk alert, it includes a recommended intervention based on the specific signals that triggered the alert, drawn from your historical win patterns." },
      { q: "Does the Deal Risk Agent integrate with Slack or email for notifications?", a: "Yes. Risk alerts can be delivered to a rep's or manager's email inbox, a configured Slack channel, or both, with configurable alert frequency and priority thresholds. Manager-level views include a pipeline-wide at-risk summary." },
    ],
  },
  {
    slug: "account-health-agent",
    name: "Account Health Agent",
    route: "/agentic-ai/account-health-agent",
    autonomyLevel: "supervised",
    summary: "Tracks customer health scores and triggers retention plays automatically.",
    tagline: "Account Health Agent — AI Customer Health & Retention",
    detail:
      "AI account health agent that monitors customer signals, predicts churn risk, and triggers retention plays from your CRM.",
    keywords: ["account health agent", "customer health ai agent", "churn prediction agent", "retention ai crm"],
    seoSectionHeadings: [
      "Account Health Agent as a Churn Prevention System",
      "Expansion Revenue Detection and Account Growth Signals",
    ],
  },
  {
    slug: "mcp",
    name: "MCP Connector",
    route: "/agentic-ai/mcp",
    autonomyLevel: "supervised",
    summary: "Connect ChatGPT, Claude, or Gemini directly to your CRM data via MCP protocol.",
    tagline: "The Only CRM MCP Server with Native WhatsApp Tools",
    detail:
      "HelloGrowthCRM ships a public Model Context Protocol (MCP) server. HubSpot, Zoho, and Salesforce all have MCP now — but none can send a WhatsApp from Claude. For Indian SMBs where 90% of deals close on WhatsApp, that changes everything.",
  },
  {
    slug: "ai-email-composer",
    name: "AI Email Composer",
    route: "/agentic-ai/ai-email-composer",
    autonomyLevel: "assistive",
    summary: "Generates hyper-personalised emails from CRM context — one click to send.",
    tagline: "AI Email Composer Agent — CRM-Powered Email Drafting",
    detail:
      "AI email composer agent that drafts personalized cold emails, follow-ups, and proposals from CRM context in seconds.",
    keywords: ["ai email composer agent", "email drafting ai agent", "crm email ai", "sales email agent"],
    seoSectionHeadings: [
      "How CRM-Context Email Drafting Works",
      "AI Email Composer in High-Volume Outreach Workflows",
    ],
  },
];

// ── Autonomy levels — Source: AutonomyLevelsPage.tsx + AutonomyLevelMatrix.tsx
//    — SYNCED_AT 2026-06-11 ──────────────────────────────────────────────────

const AUTONOMY_PAGE = {
  route: "/agentic-ai/autonomy-levels",
  h1: "AI Agent Autonomy Levels — Transparency You Can Trust",
  hero: "HelloGrowthCRM is the only CRM that publicly documents its AI agent autonomy framework. Three levels, clearly defined safety rails, and every action logged. Deploy with confidence.",
};

const AUTONOMY_LEVELS = [
  {
    level: "autonomous" as const,
    title: "Fully Autonomous",
    subtitle: "Acts end-to-end without human approval",
    description:
      "The agent receives a trigger (new lead, call completed, deal stage changed) and executes the full action chain automatically — making calls, sending messages, updating CRM records, routing deals — all without waiting for a human to click confirm. Every action is logged and reversible within configured limits.",
    bestFor: [
      "High-volume, repeatable tasks where speed matters",
      "Tasks where the cost of delay is a missed lead",
      "Actions you'd approve in <1 second anyway",
    ],
    agents: ["Voice Agent", "Lead Routing Agent", "Post-Call Agent", "Journey Agent"],
  },
  {
    level: "supervised" as const,
    title: "Supervised",
    subtitle: "Drafts and stages — human confirms before committing",
    description:
      "The agent drafts the action, shows it to a human, and waits for approval before executing. For email, the rep sees the draft and clicks 'Send'. For CRM updates, the rep sees the change in a preview pane and clicks 'Apply'. The agent does 90% of the work; the human handles the last 10%.",
    bestFor: [
      "Anything outbound where tone and context matter",
      "CRM record updates where accuracy is critical",
      "High-stakes actions like contract proposals",
    ],
    agents: ["Cold Outreach Agent", "CRM Command Agent", "Account Health Agent", "MCP Connector"],
  },
  {
    level: "assistive" as const,
    title: "Assistive",
    subtitle: "Recommends and surfaces — human decides and executes",
    description:
      "The agent monitors signals, surfaces insights, and makes recommendations — but never takes action without the human explicitly choosing to execute. This is the safest level for customer-facing decisions where context, tone, and relationship knowledge still sit with the rep.",
    bestFor: [
      "Coaching during live interactions",
      "Deal risk signals where context matters",
      "Email drafts where brand voice is closely managed",
    ],
    agents: ["Call Coach Agent", "Deal Risk Agent", "Sales Assistant Agent", "AI Email Composer"],
  },
];

// Capability matrix — boolean = yes/no, "partial" = agent drafts/stages and a
// human clicks confirm, other strings as shown on the page.
const AUTONOMY_MATRIX: Array<{
  capability: string;
  autonomous: boolean | string;
  supervised: boolean | string;
  assistive: boolean | string;
}> = [
  { capability: "Executes actions automatically", autonomous: true, supervised: "partial", assistive: false },
  { capability: "Requires human approval before committing", autonomous: false, supervised: true, assistive: false },
  { capability: "Surfaces recommendations to reps", autonomous: false, supervised: true, assistive: true },
  { capability: "Writes & sends emails/messages", autonomous: true, supervised: "partial", assistive: false },
  { capability: "Makes outbound calls", autonomous: true, supervised: false, assistive: false },
  { capability: "Updates CRM records automatically", autonomous: true, supervised: "partial", assistive: false },
  { capability: "Audit trail of every action", autonomous: true, supervised: true, assistive: true },
  { capability: "Can be paused or rolled back", autonomous: true, supervised: true, assistive: true },
  { capability: "Spending / action limits configurable", autonomous: true, supervised: true, assistive: "N/A" },
];

const SAFETY_RAILS = [
  "Per-agent action limits (e.g. max 50 calls/day, max ₹10,000 spend/day)",
  "Full audit log of every action — who or what, when, what was changed",
  "One-click pause any agent without touching other automations",
  "Rollback on CRM record updates within 24 hours",
  "Human-in-the-loop approval gate for any action above configured thresholds",
  "PII masking — agents never expose raw contact data in logs",
  "Sandbox mode — test agent behaviour on dummy data before deploying to live pipeline",
  "Email/Slack alert when an agent hits an unexpected edge case",
];

// ── Competitor comparisons — Source: Vs*Page.tsx hero copy — SYNCED_AT 2026-07-08
//    (pages render localized pricing; the US default "$10/user/month" /
//    "₹899/user/month in India" is mirrored here) ──────────────────────────────

const COMPARISONS = [
  {
    slug: "vs-agentforce",
    competitor: "Salesforce Agentforce",
    route: "/agentic-ai/vs-agentforce",
    headline: "HelloGrowthCRM vs Salesforce Agentforce — Agentic AI at SMB Pricing",
    positioning:
      "Salesforce Agentforce is powerful. It also starts at $2/agent conversation on top of a platform license that costs $150-300/user/month. HelloGrowthCRM delivers equivalent agentic AI capability for SMB budgets — including voice agents, journey automation, MCP integration, and WhatsApp — all in one plan.",
  },
  {
    slug: "vs-breeze",
    competitor: "HubSpot Breeze",
    route: "/agentic-ai/vs-breeze",
    headline: "HelloGrowthCRM vs HubSpot Breeze — AI Agents Without the HubSpot Tax",
    positioning:
      "HubSpot Breeze AI is well-marketed. Getting meaningful Breeze features requires the Professional plan at $800/month. HelloGrowthCRM delivers voice agents, MCP integration, WhatsApp automation, and journey orchestration at SMB pricing — without the per-seat shock.",
  },
  {
    slug: "vs-zia",
    competitor: "Zoho Zia",
    route: "/agentic-ai/vs-zia",
    headline: "HelloGrowthCRM vs Zoho Zia — Real Agentic AI vs Assistive Intelligence",
    positioning:
      "Zoho Zia is a capable AI assistant — but it's assistive, not agentic. It recommends and surfaces insights; it doesn't call leads, run journeys autonomously, or connect external AI clients via MCP. HelloGrowthCRM delivers true agentic AI at SMB pricing with voice agents, MCP support, and autonomous journey orchestration.",
  },
  {
    slug: "vs-copilot",
    competitor: "Microsoft Copilot for Sales",
    route: "/agentic-ai/vs-copilot",
    headline: "HelloGrowthCRM vs Microsoft Copilot for Sales — Agentic AI Without the License Stack",
    positioning:
      "Microsoft Copilot for Sales requires M365 + Dynamics 365 + the $50/user Copilot add-on. That's $150+ per user before you write a single line of config. HelloGrowthCRM delivers full agentic AI — voice agents, MCP, WhatsApp, journey orchestration — in a standalone CRM from $10/user/month (₹899/user/month in India).",
  },
];

// ── agents_list ─────────────────────────────────────────────────────────────────

export const agentsList = defineTool({
  schema: z.object({
    autonomy_level: z
      .enum(["autonomous", "supervised", "assistive"])
      .optional()
      .describe("Optional filter by autonomy level."),
  }),
  definition: {
    name: "agents_list",
    description:
      "List all 12 HelloGrowthCRM Agentic AI agents from hellogrowthcrm.com/agentic-ai (Voice Agent, Journey Agent, Post-Call Agent, MCP Connector, etc.) with slug, route, tagline, summary, and autonomy level.",
    inputSchema: {
      type: "object",
      properties: {
        autonomy_level: {
          type: "string",
          enum: ["autonomous", "supervised", "assistive"],
          description: "Optional filter by autonomy level.",
        },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    let agents = AGENTS;
    if (args.autonomy_level) {
      agents = agents.filter((a) => a.autonomyLevel === args.autonomy_level);
    }
    return ok({
      synced_at: SYNCED_AT,
      hub: { ...HUB, url: `${SITE}${HUB.route}` },
      total_agents: AGENTS.length,
      filtered_count: agents.length,
      agents: agents.map((a) => ({
        slug: a.slug,
        name: a.name,
        autonomy_level: a.autonomyLevel,
        tagline: a.tagline,
        summary: a.summary,
        url: `${SITE}${a.route}`,
      })),
      related_product_pages: RELATED_PRODUCT_PAGES.map((p) => `${SITE}${p}`),
      note: "Related /product/* AI pages are covered in full by products_list / product_get.",
    });
  },
});

// ── agents_get ──────────────────────────────────────────────────────────────────

export const agentsGet = defineTool({
  schema: z.object({
    slug: z
      .string()
      .describe("Agent slug, e.g. voice-agent, post-call-agent, deal-risk-agent, journey-agent, mcp."),
  }),
  definition: {
    name: "agents_get",
    description:
      "Get full mirrored detail for one HelloGrowthCRM AI agent by slug: tagline, summary, autonomy level, capabilities, how-it-works steps, risk signals, and FAQs where the page provides them.",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string", description: "Agent slug." } },
      required: ["slug"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    const slug = args.slug.toLowerCase().trim();
    const agent = AGENTS.find((a) => a.slug === slug);
    if (!agent) {
      return fail(
        `Agent "${args.slug}" not found. Valid slugs: ${AGENTS.map((a) => a.slug).join(", ")}`,
      );
    }
    return ok({
      synced_at: SYNCED_AT,
      slug: agent.slug,
      name: agent.name,
      autonomy_level: agent.autonomyLevel,
      tagline: agent.tagline,
      summary: agent.summary,
      detail: agent.detail,
      ...(agent.keywords ? { keywords: agent.keywords } : {}),
      ...(agent.capabilities ? { capabilities: agent.capabilities } : {}),
      ...(agent.howItWorks ? { how_it_works: agent.howItWorks } : {}),
      ...(agent.riskSignals ? { risk_signals: agent.riskSignals } : {}),
      ...(agent.seoSectionHeadings ? { seo_section_headings: agent.seoSectionHeadings } : {}),
      ...(agent.faqs ? { faqs: agent.faqs } : {}),
      route: agent.route,
      url: `${SITE}${agent.route}`,
    });
  },
});

// ── agents_get_autonomy_levels ──────────────────────────────────────────────────

export const agentsGetAutonomyLevels = defineTool({
  schema: z.object({}),
  definition: {
    name: "agents_get_autonomy_levels",
    description:
      "Return HelloGrowthCRM's publicly documented AI agent autonomy framework from hellogrowthcrm.com/agentic-ai/autonomy-levels: the three levels (Fully Autonomous, Supervised, Assistive), the capability matrix, and the safety rails built into every agent.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  async handle(_args) {
    return ok({
      synced_at: SYNCED_AT,
      page: { ...AUTONOMY_PAGE, url: `${SITE}${AUTONOMY_PAGE.route}` },
      levels: AUTONOMY_LEVELS,
      capability_matrix: AUTONOMY_MATRIX,
      matrix_legend:
        '"partial" = agent drafts/stages the action; human clicks confirm. "N/A" = not applicable at this level.',
      safety_rails: SAFETY_RAILS,
    });
  },
});

// ── agents_list_comparisons ─────────────────────────────────────────────────────

export const agentsListComparisons = defineTool({
  schema: z.object({}),
  definition: {
    name: "agents_list_comparisons",
    description:
      "List HelloGrowthCRM's four Agentic AI competitor comparison pages (vs Salesforce Agentforce, HubSpot Breeze, Zoho Zia, Microsoft Copilot for Sales) with the positioning summary mirrored from each page.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  async handle(_args) {
    return ok({
      synced_at: SYNCED_AT,
      count: COMPARISONS.length,
      comparisons: COMPARISONS.map((c) => ({
        slug: c.slug,
        competitor: c.competitor,
        headline: c.headline,
        positioning: c.positioning,
        url: `${SITE}${c.route}`,
      })),
    });
  },
});
