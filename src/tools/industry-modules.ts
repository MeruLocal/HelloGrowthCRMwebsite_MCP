import { z } from "zod";
import { defineTool, fail, ok } from "./tool-types.js";
import {
  CROSS_CUTTING_MODULES,
  INDUSTRY_MODULES_SOURCE,
  INDUSTRY_MODULES_VERIFIED_AT,
  INDUSTRY_VERTICALS,
  type IndustryVertical,
} from "../data/industry-modules.js";

const NOTE =
  "An industry is chosen when a workspace is created. Module lists come from the product's own navigation inventory, not from the marketing site. Plan entitlement per module is not confirmed in code; ask sales before promising a module on a specific plan.";

function resolve(v: IndustryVertical): IndustryVertical {
  return v.kind === "alias" && v.alias_of
    ? (INDUSTRY_VERTICALS.find((x) => x.key === v.alias_of) ?? v)
    : v;
}

// ── industries_list_modules ───────────────────────────────────────────────────

export const industriesListModules = defineTool({
  schema: z.object({
    search: z.string().optional().describe("Keyword to match against industry name, description or module labels"),
    kind: z.enum(["dedicated", "alias", "configuration_only", "all"]).default("all"),
  }),
  definition: {
    name: "industries_list_modules",
    description:
      "List the 52 HelloGrowthCRM industry verticals (clinic, hotel, real estate, insurance, CA, legal, education, study abroad, freight, manufacturing, retail, agri field sales, recruitment and more) with how deep each one goes: dedicated screens, an alias that reuses another vertical's screens, or configuration only. Use industries_get_modules for the screens in one industry.",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Keyword to match against industry name, description or module labels" },
        kind: { type: "string", enum: ["dedicated", "alias", "configuration_only", "all"], default: "all" },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    try {
      let rows = INDUSTRY_VERTICALS;
      if (args.kind && args.kind !== "all") rows = rows.filter((v) => v.kind === args.kind);
      if (args.search) {
        const kw = args.search.toLowerCase();
        rows = rows.filter((v) => {
          const r = resolve(v);
          return (
            v.name.toLowerCase().includes(kw) ||
            v.key.includes(kw.replace(/\s+/g, "_")) ||
            v.description.toLowerCase().includes(kw) ||
            r.modules.some((m) => m.label.toLowerCase().includes(kw)) ||
            r.highlights.some((h) => h.toLowerCase().includes(kw))
          );
        });
      }
      return ok({
        total: INDUSTRY_VERTICALS.length,
        filtered_count: rows.length,
        verified_at: INDUSTRY_MODULES_VERIFIED_AT,
        source: INDUSTRY_MODULES_SOURCE,
        note: NOTE,
        industries: rows.map((v) => ({
          key: v.key,
          name: v.name,
          description: v.description,
          kind: v.kind,
          alias_of: v.alias_of,
          screens: resolve(v).modules.length,
        })),
      });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});

// ── industries_get_modules ────────────────────────────────────────────────────

export const industriesGetModules = defineTool({
  schema: z.object({
    industry: z.string().describe("Industry key or name, e.g. 'doctors_clinic', 'Doctors / Clinic', 'agri_inputs'"),
  }),
  definition: {
    name: "industries_get_modules",
    description:
      "Get what one HelloGrowthCRM industry vertical includes: every screen (navigation view) it adds, verified highlights, and what it does NOT include. Aliases (for example dental clinic, yoga studio, cloud kitchen) return the screens of the vertical they reuse.",
    inputSchema: {
      type: "object",
      properties: {
        industry: { type: "string", description: "Industry key or name (use industries_list_modules to enumerate)" },
      },
      required: ["industry"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    try {
      const q = args.industry.trim().toLowerCase();
      const v =
        INDUSTRY_VERTICALS.find((x) => x.key === q.replace(/[\s/-]+/g, "_")) ??
        INDUSTRY_VERTICALS.find((x) => x.name.toLowerCase() === q) ??
        INDUSTRY_VERTICALS.find((x) => x.name.toLowerCase().includes(q) || x.key.includes(q.replace(/\s+/g, "_")));
      if (!v) {
        const hints = INDUSTRY_VERTICALS.filter((x) => x.name.toLowerCase().includes(q.split(" ")[0] ?? "")).slice(0, 5);
        return fail(
          `Industry '${args.industry}' not found.${hints.length ? ` Did you mean: ${hints.map((h) => h.key).join(", ")}?` : " Use industries_list_modules to enumerate."}`,
        );
      }
      const r = resolve(v);
      return ok({
        key: v.key,
        name: v.name,
        description: v.description,
        kind: v.kind,
        reuses: v.kind === "alias" ? { key: r.key, name: r.name } : null,
        screens: r.modules,
        highlights: r.highlights,
        not_built: r.not_built,
        configuration:
          v.kind === "configuration_only"
            ? "Pipeline stages, custom fields, scheduler and task-board seeds and an AI persona are set for this industry; there are no dedicated screens."
            : undefined,
        cross_cutting_screens_available_to_any_industry: CROSS_CUTTING_MODULES,
        verified_at: INDUSTRY_MODULES_VERIFIED_AT,
        source: INDUSTRY_MODULES_SOURCE,
        note: NOTE,
      });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});
