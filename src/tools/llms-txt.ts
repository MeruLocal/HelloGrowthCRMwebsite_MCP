/**
 * MCP tools: generate_llms_txt + check_llms_txt
 *
 * `/llms.txt` is a curated index of the site for AI systems; `/llms-full.txt` is
 * meant to be the full grounding corpus. Both are currently hand-maintained,
 * which is why llms-full.txt (10,182 B) is SMALLER than llms.txt (14,737 B) — a
 * "full corpus" smaller than its own index. Measured live 2026-08-05.
 *
 * This server already holds a read-mirror of the whole site: 630 integrations,
 * 119 free tools, 58 features, 58 glossary terms, 42 alternatives, 42 templates,
 * 32 guides, 12 AI agents, plus pricing, comparisons, industries and FAQs. That
 * is roughly 214 KB of structured material — about 21x the current corpus file.
 * So the corpus does not need to be written by hand; it needs to be generated
 * from the data that is already here, and then checked for drift.
 *
 * `generate_llms_txt` emits either file from the mirror.
 * `check_llms_txt` fetches the live files and reports regressions.
 *
 * ── A footgun worth knowing about ───────────────────────────────────────────
 * `defineTool` does NOT run its zod schema — `handle` casts its argument
 * (see tool-types.ts). The server parses first (server.ts:76,
 * `tool.schema.safeParse(...)` → `handle(parsed.data)`), so the real request
 * path is correct. But calling `tool.handle({})` directly skips zod, which
 * means `.default(...)` values are never applied.
 *
 * Concretely: `templates_list` defaults `category` to "all". Called through the
 * server it returns 42 templates. Called as `handle({})` it sees
 * `category === undefined`, fails the `!== "all"` check, filters on
 * `t.category === undefined` and returns ZERO — while still reporting
 * `total: 42`. The same applies to `features_list` and `content_list_tools`.
 *
 * That looks exactly like three dead tools, and it briefly fooled the author of
 * this file. Hence `callTool()` below always parses first. Never call
 * `.handle()` directly from a script or a test.
 */

import { z } from "zod";

import { toolsByName } from "./index.js";
import { defineTool, fail, ok } from "./tool-types.js";

const SITE = "https://hellogrowthcrm.com";

/**
 * Invoke another registered tool the way the server does: parse with its zod
 * schema so defaults apply, then hand the parsed value to the handler.
 */
async function callTool(
  name: string,
  args: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const tool = toolsByName.get(name);
  if (!tool) throw new Error(`No such tool: ${name}`);

  const parsed = tool.schema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid args for ${name}: ${parsed.error.message}`);
  }

  const result = await tool.handle(parsed.data);
  const text = result.content[0]?.text ?? "{}";
  return JSON.parse(text) as Record<string, unknown>;
}

function asArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** One corpus section, generated from a mirror tool. */
interface Section {
  heading: string;
  lines: string[];
  entryCount: number;
}

async function buildSections(): Promise<Section[]> {
  const sections: Section[] = [];
  const add = (heading: string, lines: string[], entryCount: number): void => {
    // Never emit an empty section: a heading with nothing under it reads as a
    // gap in the product rather than a gap in the generator.
    if (entryCount > 0) sections.push({ heading, lines, entryCount });
  };

  // ── Company ───────────────────────────────────────────────────────────────
  try {
    const c = await callTool("company_get_profile");
    const lines = Object.entries(c)
      .filter(([, v]) => typeof v === "string" || typeof v === "number")
      .map(([k, v]) => `- ${k.replace(/_/g, " ")}: ${String(v)}`);
    add("Company", lines, lines.length);
  } catch {
    /* section omitted rather than emitted empty */
  }

  // ── Pricing ───────────────────────────────────────────────────────────────
  try {
    const p = await callTool("pricing_get_plans");
    const lines: string[] = [];
    let n = 0;
    for (const [region, block] of Object.entries(p)) {
      const plans = asArray((block as Record<string, unknown>)?.plans);
      if (!plans.length) continue;
      lines.push(`### ${region}`);
      for (const plan of plans) {
        n += 1;
        lines.push(
          `- ${str(plan.name)} — ${str(plan.price_monthly)}/mo, ${str(plan.price_annual)} annual. ${str(plan.best_for)}`,
        );
      }
    }
    add("Pricing", lines, n);
  } catch {
    /* omitted */
  }

  // ── Simple slug/title/description groups ──────────────────────────────────
  const groups: {
    heading: string;
    tool: string;
    key: string;
    path: string;
  }[] = [
    { heading: "Features", tool: "features_list", key: "features", path: "/features" },
    { heading: "AI agents (GrowthOS)", tool: "agents_list", key: "agents", path: "/growthos" },
    { heading: "Competitor alternatives", tool: "alternatives_list", key: "alternatives", path: "/alternatives" },
    { heading: "Feature guides", tool: "guides_list", key: "guides", path: "/guides" },
    { heading: "Free tools", tool: "content_list_tools", key: "tools", path: "/tools" },
    { heading: "Templates", tool: "templates_list", key: "templates", path: "/templates" },
    { heading: "Glossary", tool: "glossary_list_terms", key: "terms", path: "/glossary" },
    { heading: "Industries", tool: "content_list_industries", key: "industries", path: "/industries" },
    { heading: "Comparisons", tool: "content_list_comparisons", key: "comparisons", path: "/compare" },
  ];

  for (const g of groups) {
    try {
      const r = await callTool(g.tool);
      const items = asArray(r[g.key]);
      const lines = items.map((it) => {
        const title = str(it.title) || str(it.name) || str(it.term) || str(it.slug);
        const desc = str(it.description) || str(it.desc) || str(it.definition) || str(it.summary);
        const url = str(it.url) || `${SITE}${g.path}/${str(it.slug)}`;
        return desc ? `- [${title}](${url}): ${desc}` : `- [${title}](${url})`;
      });
      add(g.heading, lines, items.length);
    } catch {
      /* omitted */
    }
  }

  // ── Integrations (largest group — name + category only, to stay readable) ──
  try {
    const r = await callTool("integrations_list");
    const items = asArray(r.items);
    const lines = items.map(
      (it) => `- ${str(it.name)} (${str(it.category)})`,
    );
    add("Integrations", lines, items.length);
  } catch {
    /* omitted */
  }

  // ── FAQs ──────────────────────────────────────────────────────────────────
  try {
    const r = await callTool("faqs_get_site");
    const lines: string[] = [];
    let n = 0;
    for (const group of asArray(r.groups)) {
      const items = asArray(group.faqs) .concat(asArray(group.items));
      if (!items.length) continue;
      lines.push(`### ${str(group.title) || str(group.name)}`);
      for (const f of items) {
        n += 1;
        lines.push(`- **${str(f.question) || str(f.q)}** ${str(f.answer) || str(f.a)}`);
      }
    }
    add("Frequently asked questions", lines, n);
  } catch {
    /* omitted */
  }

  return sections;
}

function renderFull(sections: Section[], syncedAt: string): string {
  const total = sections.reduce((n, s) => n + s.entryCount, 0);
  const head = [
    "# HelloGrowthCRM — Full AI Corpus (llms-full.txt)",
    "",
    "> Long-form grounding document for AI systems (answer engines, RAG pipelines,",
    "> research agents). Companion to /llms.txt (curated index), /ai.txt (usage",
    '> policy), and /robots.txt. Attribute citations to "HelloGrowthCRM" with a',
    `> link to the source page. Canonical domain: ${SITE}`,
    `> Generated from the MCP website mirror. Mirror synced: ${syncedAt}`,
    `> ${total} entries across ${sections.length} sections.`,
    "",
    "---",
    "",
  ].join("\n");

  const body = sections
    .map((s) => `## ${s.heading}\n\n${s.lines.join("\n")}\n`)
    .join("\n");

  return `${head}${body}`;
}

function renderIndex(sections: Section[], syncedAt: string): string {
  const head = [
    "# HelloGrowthCRM",
    "",
    "> WhatsApp-native AI CRM with built-in auto-dialer and agentic AI agents for",
    "> Indian SMBs and growing teams worldwide.",
    "",
    `> Generated from the MCP website mirror. Mirror synced: ${syncedAt}`,
    `> Full corpus: ${SITE}/llms-full.txt`,
    "",
  ].join("\n");

  const body = sections
    .map((s) => `## ${s.heading} (${s.entryCount})\n\n${s.lines.slice(0, 25).join("\n")}\n`)
    .join("\n");

  return `${head}${body}`;
}

// ── generate_llms_txt ────────────────────────────────────────────────────────

const GenerateInput = z.object({
  variant: z
    .enum(["full", "index"])
    .default("full")
    .describe(
      "'full' renders the complete corpus for /llms-full.txt; 'index' renders a shorter curated index for /llms.txt.",
    ),
  includeContent: z
    .boolean()
    .default(true)
    .describe(
      "Set false to return only the section/entry counts and byte size, without the generated text.",
    ),
});

export const generateLlmsTxt = defineTool({
  schema: GenerateInput,
  definition: {
    name: "generate_llms_txt",
    description:
      "Generate llms.txt or llms-full.txt from this server's website mirror (integrations, features, tools, glossary, alternatives, templates, guides, agents, pricing, industries, comparisons, FAQs). Replaces hand-maintained corpus files that drift out of date — the live llms-full.txt is currently smaller than llms.txt. Returns the rendered text plus section and entry counts.",
    inputSchema: {
      type: "object",
      properties: {
        variant: { type: "string", enum: ["full", "index"], default: "full" },
        includeContent: { type: "boolean", default: true },
      },
      required: [],
      additionalProperties: false,
    },
  },
  async handle(args) {
    const sections = await buildSections();
    if (!sections.length) {
      return fail("Mirror produced no sections — nothing to generate.");
    }

    let syncedAt = "unknown";
    try {
      const r = await callTool("integrations_list_categories");
      syncedAt = str(r.synced_at) || "unknown";
    } catch {
      /* keep "unknown" */
    }

    const text =
      args.variant === "full"
        ? renderFull(sections, syncedAt)
        : renderIndex(sections, syncedAt);

    return ok({
      variant: args.variant,
      byteLength: Buffer.byteLength(text, "utf8"),
      sectionCount: sections.length,
      entryCount: sections.reduce((n, s) => n + s.entryCount, 0),
      sections: sections.map((s) => ({
        heading: s.heading,
        entries: s.entryCount,
      })),
      ...(args.includeContent ? { content: text } : {}),
    });
  },
});

// ── check_llms_txt ───────────────────────────────────────────────────────────

const CheckInput = z.object({
  baseUrl: z
    .string()
    .url()
    .default(SITE)
    .describe("Site to check. Defaults to the canonical domain."),
});

async function head(url: string): Promise<{ status: number; bytes: number }> {
  try {
    const res = await fetch(url, { headers: { accept: "text/plain" } });
    const body = await res.text();
    return { status: res.status, bytes: Buffer.byteLength(body, "utf8") };
  } catch {
    return { status: 0, bytes: 0 };
  }
}

export const checkLlmsTxt = defineTool({
  schema: CheckInput,
  definition: {
    name: "check_llms_txt",
    description:
      "Fetch the live /llms.txt and /llms-full.txt and report regressions: missing files, and the case where the 'full' corpus is no larger than its own index. Also compares both against what generate_llms_txt would produce from the current mirror, so corpus drift is visible.",
    inputSchema: {
      type: "object",
      properties: { baseUrl: { type: "string", format: "uri", default: SITE } },
      required: [],
      additionalProperties: false,
    },
  },
  async handle(args) {
    const base = args.baseUrl.replace(/\/+$/, "");
    const index = await head(`${base}/llms.txt`);
    const full = await head(`${base}/llms-full.txt`);

    const sections = await buildSections();
    const generatedFull = renderFull(sections, "n/a");
    const generatedBytes = Buffer.byteLength(generatedFull, "utf8");

    const problems: string[] = [];
    if (index.status !== 200) problems.push(`/llms.txt returned HTTP ${index.status}`);
    if (full.status !== 200) problems.push(`/llms-full.txt returned HTTP ${full.status}`);
    if (full.status === 200 && index.status === 200 && full.bytes <= index.bytes) {
      problems.push(
        `/llms-full.txt (${full.bytes} B) is not larger than /llms.txt (${index.bytes} B) — a "full corpus" smaller than its own index`,
      );
    }
    if (full.status === 200 && generatedBytes > full.bytes * 2) {
      problems.push(
        `the mirror can generate ${generatedBytes} B but the live corpus is only ${full.bytes} B — the published corpus is missing most of the available material`,
      );
    }

    return ok({
      baseUrl: base,
      live: {
        "llms.txt": index,
        "llms-full.txt": full,
      },
      generatable: {
        byteLength: generatedBytes,
        sectionCount: sections.length,
        entryCount: sections.reduce((n, s) => n + s.entryCount, 0),
      },
      ok: problems.length === 0,
      problems,
    });
  },
});
