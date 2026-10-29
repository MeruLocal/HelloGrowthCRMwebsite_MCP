/**
 * Content freshness for the bundled website read-mirror.
 *
 * WHY THIS EXISTS
 * Every tool in src/tools/ that serves website data carries a `SYNCED_AT`
 * stamp naming the day its rows were copied from hellocrmwebsite. Nothing ever
 * read those stamps. So `integrations.ts` sat at 2026-06-17 while the website's
 * own catalog moved underneath it, and the server went on publishing a count
 * the website had already retired - for three months, silently, with a green
 * /health the whole time.
 *
 * A mirror that cannot say how old it is will always drift, because nothing
 * fails when it does. This module makes the staleness visible in the two places
 * that are checked routinely:
 *
 *   1. /health          - a `content_freshness` block, and `status: "degraded"`
 *                         once any mirror passes STALE_AFTER_DAYS.
 *   2. audit-live-mcp   - a FAIL, so the standing audit goes red.
 *
 * ADDING A MIRROR: add its stamp to MIRROR_STAMPS below. The stamp must be the
 * same string as the module's own `SYNCED_AT`, so a resync updates one line in
 * each place and the two are trivially diffable in review.
 *
 * FOLLOW-UP (Phase 1.1b of the MCP upgrade roadmap): the regeneration job that
 * rebuilds these mirrors from the website source and moves the stamps on its
 * own. Until that ships, this module is the alarm, not the fix - it tells you
 * the mirror is old, it cannot make it young.
 */

/**
 * How long a mirror may go unsynced before it is treated as stale.
 *
 * Seven days is the roadmap's number and it is deliberately short: these are
 * static copies of marketing pages that change weekly, and the cost of a false
 * alarm (someone re-runs the sync) is far below the cost of a missed one (an
 * agent quoting a retired price to a customer).
 */
export const STALE_AFTER_DAYS = 7;

/**
 * The SYNCED_AT stamp of every bundled mirror, keyed by the surface it feeds.
 *
 * Keep in sync with the `SYNCED_AT` constant inside each module. The test in
 * src/lib/__tests__/content-freshness.test.ts asserts they still agree.
 */
export const MIRROR_STAMPS: Readonly<Record<string, string>> = {
  "website-mirror": "2026-08-06",
  agents: "2026-07-08",
  alternatives: "2026-07-08",
  changelog: "2026-10-29",
  faqs: "2026-07-08",
  glossary: "2026-10-29",
  guides: "2026-10-29",
  integrations: "2026-10-29",
  media: "2026-07-08",
  partners: "2026-06-11",
  solutions: "2026-07-08",
  templates: "2026-10-29",
};

export interface MirrorFreshness {
  surface: string;
  synced_at: string;
  age_days: number;
  stale: boolean;
}

export interface ContentFreshness {
  /** True when every mirror is within STALE_AFTER_DAYS. */
  ok: boolean;
  stale_after_days: number;
  /** Oldest stamp across all mirrors - the number worth alerting on. */
  oldest_age_days: number;
  oldest_surface: string;
  stale_surfaces: string[];
  mirrors: MirrorFreshness[];
}

function ageInDays(stamp: string, now: Date): number {
  const then = Date.parse(stamp + "T00:00:00Z");
  if (Number.isNaN(then)) {
    // An unparseable stamp is a bug in this file, and treating it as fresh
    // would hide exactly what the module exists to surface. Call it maximally
    // stale so it shows up on the first /health read.
    return Number.MAX_SAFE_INTEGER;
  }
  return Math.floor((now.getTime() - then) / 86400000);
}

/**
 * Evaluate every mirror stamp against `now` (injectable so the test does not
 * depend on the wall clock).
 */
export function getContentFreshness(now: Date = new Date()): ContentFreshness {
  const mirrors: MirrorFreshness[] = Object.entries(MIRROR_STAMPS)
    .map(([surface, syncedAt]) => {
      const ageDays = ageInDays(syncedAt, now);
      return {
        surface,
        synced_at: syncedAt,
        age_days: ageDays,
        stale: ageDays > STALE_AFTER_DAYS,
      };
    })
    .sort((a, b) => b.age_days - a.age_days);

  const stale = mirrors.filter((m) => m.stale);
  const oldest = mirrors[0];

  return {
    ok: stale.length === 0,
    stale_after_days: STALE_AFTER_DAYS,
    oldest_age_days: oldest?.age_days ?? 0,
    oldest_surface: oldest?.surface ?? "none",
    stale_surfaces: stale.map((m) => m.surface),
    mirrors,
  };
}
