/**
 * Mirror freshness gate (roadmap Phase 2, task 2.3; issue #40).
 *
 * Every block of website content this server mirrors carries a hand-bumped
 * `SYNCED_AT` date. Nothing regenerates the mirror yet, so those dates only
 * age: on 2026-10-14 the oldest block was four months old while tools kept
 * presenting it as current. This module turns the dates into a signal:
 *
 *   - `GET /health` reports it and says `"status": "degraded"` when any block
 *     is older than MIRROR_MAX_AGE_DAYS (default 10: a weekly sync plus
 *     margin). The HTTP status stays 200 on purpose: content age is not
 *     liveness, and a 503 here would make an orchestrator or uptime check
 *     restart a process that is answering correctly. `GET /healthz` stays a
 *     pure liveness probe.
 *   - `scripts/audit-live-mcp.mjs` FAILs on the same condition.
 *
 * Adding a mirrored block: export its SYNCED_AT constant and list it below.
 * src/data/__tests__/freshness.test.ts scans the source tree and fails if a
 * `SYNCED_AT = "…"` constant exists that is not listed here.
 */

import { SYNCED_AT as SITE_MIRROR } from "./website-mirror.js";
import { SYNCED_AT as AGENTS } from "../tools/agents.js";
import { SYNCED_AT as ALTERNATIVES } from "../tools/alternatives.js";
import { SYNCED_AT as CHANGELOG } from "../tools/changelog.js";
import { SYNCED_AT as FAQS } from "../tools/faqs.js";
import { GLOSSARY_SYNCED_AT } from "../tools/glossary.js";
import { GUIDES_SYNCED_AT } from "../tools/guides.js";
import { SYNCED_AT as INTEGRATIONS } from "../tools/integrations.js";
import { SYNCED_AT as MEDIA } from "../tools/media.js";
import { SYNCED_AT as PARTNERS } from "../tools/partners.js";
import { SYNCED_AT as SOLUTIONS } from "../tools/solutions.js";
import { TEMPLATES_SYNCED_AT } from "../tools/templates.js";

export interface MirrorBlock {
  /** Short block id, used in /health and the audit output. */
  block: string;
  /** The block's SYNCED_AT, YYYY-MM-DD. */
  synced_at: string;
  /** Where the constant lives, relative to src/. */
  source: string;
}

export const MIRROR_BLOCKS: readonly MirrorBlock[] = [
  { block: "site", synced_at: SITE_MIRROR, source: "data/website-mirror.ts" },
  { block: "agents", synced_at: AGENTS, source: "tools/agents.ts" },
  { block: "alternatives", synced_at: ALTERNATIVES, source: "tools/alternatives.ts" },
  { block: "changelog", synced_at: CHANGELOG, source: "tools/changelog.ts" },
  { block: "faqs", synced_at: FAQS, source: "tools/faqs.ts" },
  { block: "glossary", synced_at: GLOSSARY_SYNCED_AT, source: "tools/glossary.ts" },
  { block: "guides", synced_at: GUIDES_SYNCED_AT, source: "tools/guides.ts" },
  { block: "integrations", synced_at: INTEGRATIONS, source: "tools/integrations.ts" },
  { block: "media", synced_at: MEDIA, source: "tools/media.ts" },
  { block: "partners", synced_at: PARTNERS, source: "tools/partners.ts" },
  { block: "solutions", synced_at: SOLUTIONS, source: "tools/solutions.ts" },
  { block: "templates", synced_at: TEMPLATES_SYNCED_AT, source: "tools/templates.ts" },
];

export const DEFAULT_MAX_AGE_DAYS = 10;

/** MIRROR_MAX_AGE_DAYS from the environment, or the default when unset/invalid. */
export function configuredMaxAgeDays(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.MIRROR_MAX_AGE_DAYS?.trim();
  if (!raw) return DEFAULT_MAX_AGE_DAYS;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_AGE_DAYS;
}

export interface BlockAge {
  block: string;
  synced_at: string;
  /** Whole days since synced_at (UTC), or null when the date is unusable. */
  age_days: number | null;
  /** Why the block is stale, when it is. */
  problem?: "too_old" | "invalid_date" | "future_date";
}

export interface MirrorFreshness {
  status: "fresh" | "stale";
  max_age_days: number;
  checked_at: string;
  oldest: BlockAge;
  stale_blocks: BlockAge[];
  blocks: BlockAge[];
}

const DAY_MS = 86_400_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function ageOf(b: MirrorBlock, now: Date, maxAgeDays: number): BlockAge {
  const base = { block: b.block, synced_at: b.synced_at };
  if (!DATE_RE.test(b.synced_at)) return { ...base, age_days: null, problem: "invalid_date" };
  const t = Date.parse(`${b.synced_at}T00:00:00Z`);
  if (Number.isNaN(t) || new Date(t).toISOString().slice(0, 10) !== b.synced_at) {
    return { ...base, age_days: null, problem: "invalid_date" };
  }
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const age = Math.floor((todayUtc - t) / DAY_MS);
  // A date in the future is a typo or a lie; either way it must not read as fresh.
  if (age < 0) return { ...base, age_days: age, problem: "future_date" };
  if (age > maxAgeDays) return { ...base, age_days: age, problem: "too_old" };
  return { ...base, age_days: age };
}

/**
 * Freshness of every mirrored block. `stale` when any block is older than
 * maxAgeDays, has an unparseable date, or is dated in the future.
 */
export function mirrorFreshness(
  now: Date = new Date(),
  maxAgeDays: number = configuredMaxAgeDays(),
  blocks: readonly MirrorBlock[] = MIRROR_BLOCKS,
): MirrorFreshness {
  if (blocks.length === 0) throw new Error("mirrorFreshness: no blocks to check");
  const ages = blocks.map((b) => ageOf(b, now, maxAgeDays));
  const stale = ages.filter((a) => a.problem !== undefined);
  // Oldest = an unusable date first (it cannot be trusted at all), then the
  // largest age.
  const oldest = [...ages].sort((a, b) => {
    if (a.age_days === null && b.age_days === null) return 0;
    if (a.age_days === null) return -1;
    if (b.age_days === null) return 1;
    return b.age_days - a.age_days;
  })[0]!;
  return {
    status: stale.length ? "stale" : "fresh",
    max_age_days: maxAgeDays,
    checked_at: now.toISOString(),
    oldest,
    stale_blocks: stale,
    blocks: ages,
  };
}
