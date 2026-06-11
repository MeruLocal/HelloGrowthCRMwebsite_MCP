import { z } from "zod";
import { defineTool, fail, ok } from "./tool-types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Static mirror data — READ-MIRROR of the live website. Never invent entries.
// Source: hellocrmwebsite/src/lib/changelog-curated.ts (CHANGELOG_CURATED_RELEASES) — SYNCED_AT 2026-06-11
// Source: hellocrmwebsite/src/lib/changelog-releases.ts (getChangelogReleases — curated only) — SYNCED_AT 2026-06-11
// Source: hellocrmwebsite/src/lib/changelog-types.ts (ChangelogRelease / ChangelogItem / ChangelogItemTag) — SYNCED_AT 2026-06-11
// Routes: /changelog and /whats-new (src/app/(public)/changelog, src/app/(public)/whats-new)
// ─────────────────────────────────────────────────────────────────────────────

const SYNCED_AT = "2026-06-11";
const SITE = "https://hellogrowthcrm.com";

// Full tag union from changelog-types.ts. Current curated data only uses
// feature | improvement | fix | infra, but the type allows all seven.
const CHANGELOG_TAGS = ["feature", "improvement", "fix", "infra", "integration", "product", "tools"] as const;
type ChangelogItemTag = (typeof CHANGELOG_TAGS)[number];

type ChangelogItem = {
  tag: ChangelogItemTag;
  title: string;
  description: string;
};

type ChangelogRelease = {
  version: string;
  date: string;
  isoDate: string;
  source: "daily" | "curated";
  items: ChangelogItem[];
};

// All 6 curated releases, mirrored in full (newest first, as on the website).
const CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    version: "1.5.0",
    date: "March 27, 2026",
    isoDate: "2026-03-27",
    source: "curated",
    items: [
      {
        tag: "feature",
        title: "Free Sales Tools Expansion",
        description:
          "Expanded the public tools library with more free calculators, planners, analyzers, templates, and AI helpers for pipeline health, lead scoring, outreach, forecasting, pricing, churn, and RevOps workflows.",
      },
      {
        tag: "feature",
        title: "Industry and Comparison Page Expansion",
        description:
          "Added and expanded more website pages for industries, CRM comparisons, product feature explainers, and workflow-specific landing pages so visitors can browse use cases by team, vertical, and buying stage.",
      },
      {
        tag: "improvement",
        title: "SEO, Social Cards, and Public Site Metadata",
        description:
          "Improved Open Graph and Twitter metadata, manifest support, structured data, browser metadata, and page-level SEO coverage to strengthen previews, indexing, and discoverability across the website.",
      },
      {
        tag: "fix",
        title: "Demo Booking and Website Widget Reliability",
        description:
          "Improved the public demo booking experience with safer Calendly embed handling, fallback states, and site widget fixes so key conversion elements load more reliably.",
      },
    ],
  },
  {
    version: "1.4.0",
    date: "March 24, 2026",
    isoDate: "2026-03-24",
    source: "curated",
    items: [
      {
        tag: "feature",
        title: "Website Content Hubs and Resource Pages",
        description:
          "Expanded public website sections including community, docs, changelog, legal, press, partners, academy, templates, and experience pages so buyers can explore HelloGrowthCRM from multiple entry points.",
      },
      {
        tag: "feature",
        title: "More Product, Template, and Blog Coverage",
        description:
          "Added more public-facing product pages, template detail pages, blog support content, and internal cross-linking so visitors can move more easily from discovery content into deeper workflow pages.",
      },
      {
        tag: "improvement",
        title: "Homepage and Navigation Growth Paths",
        description:
          "Improved homepage content, navigation hubs, and supporting links to highlight free tools, industry workflows, CRM comparisons, demos, templates, and product education more clearly.",
      },
    ],
  },
  {
    version: "1.3.0",
    date: "February 18, 2026",
    isoDate: "2026-02-18",
    source: "curated",
    items: [
      {
        tag: "feature",
        title: "CRM Template Library",
        description:
          "Browse and deploy 50+ pre-built sales workflow templates, email sequences, pipeline configurations, and lead scoring models with one click.",
      },
      {
        tag: "feature",
        title: "Sales Academy Launch",
        description:
          "Free structured courses on sales methodology, AI CRM setup, lead scoring, and pipeline management — all accessible at /academy.",
      },
      {
        tag: "improvement",
        title: "Expert Directory",
        description:
          "Searchable partner directory with certified HelloGrowthCRM consultants, agencies, and implementation specialists.",
      },
      {
        tag: "fix",
        title: "Sitemap Generation",
        description:
          "Dynamic sitemap now automatically includes new blog posts, templates, and SEO pages within minutes of publishing.",
      },
    ],
  },
  {
    version: "1.2.0",
    date: "February 10, 2026",
    isoDate: "2026-02-10",
    source: "curated",
    items: [
      {
        tag: "feature",
        title: "AI Voice Agents",
        description: "Launch and manage AI-powered voice agents that handle inbound and outbound calls automatically.",
      },
      {
        tag: "feature",
        title: "WhatsApp Integration",
        description: "Send and receive WhatsApp messages directly from your CRM pipeline.",
      },
      {
        tag: "improvement",
        title: "Pipeline Performance",
        description: "50% faster load times for pipelines with 10,000+ deals.",
      },
      {
        tag: "fix",
        title: "Email Sync",
        description: "Fixed an issue where Gmail threads were occasionally duplicated.",
      },
    ],
  },
  {
    version: "1.1.0",
    date: "January 20, 2026",
    isoDate: "2026-01-20",
    source: "curated",
    items: [
      {
        tag: "feature",
        title: "Task Boards",
        description: "Monday.com-style task boards with Kanban, calendar, and table views.",
      },
      {
        tag: "feature",
        title: "AI Email Drafting",
        description: "Generate personalized follow-up emails based on conversation history.",
      },
      {
        tag: "improvement",
        title: "Dashboard Widgets",
        description: "Customizable dashboard with drag-and-drop widget arrangement.",
      },
      {
        tag: "fix",
        title: "Calendar Sync",
        description: "Resolved timezone issues with Google Calendar integration.",
      },
    ],
  },
  {
    version: "1.0.0",
    date: "January 1, 2026",
    isoDate: "2026-01-01",
    source: "curated",
    items: [
      {
        tag: "feature",
        title: "HelloGrowthCRM Launch",
        description: "Initial release with core CRM, AI lead scoring, built-in dialer, and analytics dashboard.",
      },
      {
        tag: "infra",
        title: "SOC 2 Compliance",
        description: "Achieved SOC 2 Type II certification for enterprise-grade security.",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tools
// ─────────────────────────────────────────────────────────────────────────────

// ── changelog_list_releases ──────────────────────────────────────────────────

export const changelogListReleases = defineTool({
  schema: z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe("Maximum number of releases to return (default 20, min 1, max 100)."),
    tag: z
      .enum(CHANGELOG_TAGS)
      .optional()
      .describe("Filter to releases containing items with this tag (feature, improvement, fix, infra, integration, product, tools). Items are also filtered to the tag."),
  }),
  definition: {
    name: "changelog_list_releases",
    description:
      "List HelloGrowthCRM changelog releases (shown at /changelog and /whats-new), newest first. Each release has a version, date, and tagged items (feature / improvement / fix / infra). Optionally filter by item tag and limit the count.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of releases to return.",
          default: 20,
          minimum: 1,
          maximum: 100,
        },
        tag: {
          type: "string",
          enum: [...CHANGELOG_TAGS],
          description: "Filter releases/items by item tag.",
        },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    // Curated data is already newest-first; sort defensively by isoDate desc.
    let releases = [...CHANGELOG_RELEASES].sort((a, b) => b.isoDate.localeCompare(a.isoDate));

    if (args.tag) {
      const tag = args.tag;
      releases = releases
        .map((r) => ({ ...r, items: r.items.filter((i) => i.tag === tag) }))
        .filter((r) => r.items.length > 0);
    }

    const limited = releases.slice(0, args.limit);

    return ok({
      synced_at: SYNCED_AT,
      routes: [`${SITE}/changelog`, `${SITE}/whats-new`],
      total_releases: CHANGELOG_RELEASES.length,
      filtered_count: releases.length,
      returned: limited.length,
      releases: limited,
    });
  },
});

// ── changelog_get_release ────────────────────────────────────────────────────

export const changelogGetRelease = defineTool({
  schema: z.object({
    version: z.string().describe('Release version, e.g. "1.5.0" (a leading "v" is accepted).'),
  }),
  definition: {
    name: "changelog_get_release",
    description:
      "Get a single HelloGrowthCRM changelog release by version (e.g. 1.5.0) with its full list of tagged items.",
    inputSchema: {
      type: "object",
      properties: {
        version: { type: "string", description: "Release version, e.g. 1.5.0." },
      },
      required: ["version"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    const version = args.version.trim().toLowerCase().replace(/^v/, "");
    const release = CHANGELOG_RELEASES.find((r) => r.version === version);
    if (!release) {
      return fail(
        `Release "${args.version}" not found. Valid versions: ${CHANGELOG_RELEASES.map((r) => r.version).join(", ")}`,
      );
    }
    return ok({
      synced_at: SYNCED_AT,
      url: `${SITE}/changelog`,
      ...release,
    });
  },
});
