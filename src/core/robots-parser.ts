/**
 * Lightweight robots.txt + sitemap.xml parser.
 *
 * The robots parser implements the subset of RFC 9309 we need: user-agent
 * groups, Allow/Disallow rules, Crawl-delay, and Sitemap declarations. It is
 * intentionally permissive — real-world robots.txt files are messy.
 */

import type { RobotsGroup, RobotsTxt, SitemapEntry } from "../utils/types.js";

export function parseRobotsTxt(text: string): RobotsTxt {
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];

  let current: RobotsGroup | null = null;
  let lastWasUa = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = stripComment(rawLine).trim();
    if (!line) continue;

    const idx = line.indexOf(":");
    if (idx < 0) continue;

    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === "user-agent") {
      if (!current || !lastWasUa) {
        current = { userAgents: [], allow: [], disallow: [] };
        groups.push(current);
      }
      current.userAgents.push(value);
      lastWasUa = true;
      continue;
    }

    lastWasUa = false;
    if (field === "sitemap") {
      sitemaps.push(value);
      continue;
    }
    if (!current) {
      // Field outside any UA block — synthesise a global group.
      current = { userAgents: ["*"], allow: [], disallow: [] };
      groups.push(current);
    }

    if (field === "allow") {
      if (value) current.allow.push(value);
    } else if (field === "disallow") {
      // An empty Disallow means "allow everything" — leave it out.
      if (value) current.disallow.push(value);
    } else if (field === "crawl-delay") {
      const n = Number.parseFloat(value);
      if (Number.isFinite(n)) current.crawlDelaySeconds = n;
    }
  }

  return { source: text, groups, sitemaps };
}

function stripComment(line: string): string {
  const i = line.indexOf("#");
  return i < 0 ? line : line.slice(0, i);
}

/** Find the rules that apply to a particular User-Agent token. */
export function rulesFor(
  robots: RobotsTxt,
  userAgent: string,
): RobotsGroup | null {
  const ua = userAgent.toLowerCase();
  let bestSpecific: RobotsGroup | null = null;
  let fallback: RobotsGroup | null = null;

  for (const g of robots.groups) {
    for (const declared of g.userAgents) {
      const d = declared.toLowerCase();
      if (d === "*") {
        fallback = g;
      } else if (ua.includes(d) && (!bestSpecific || d.length > maxLen(bestSpecific))) {
        bestSpecific = g;
      }
    }
  }
  return bestSpecific ?? fallback;
}

function maxLen(g: RobotsGroup): number {
  return Math.max(...g.userAgents.map((u) => u.length));
}

/** Returns true if the URL path is disallowed for this UA per the parsed robots.txt. */
export function isDisallowed(
  robots: RobotsTxt,
  userAgent: string,
  path: string,
): boolean {
  const rules = rulesFor(robots, userAgent);
  if (!rules) return false;

  const allowMatch = longestMatch(rules.allow, path);
  const disallowMatch = longestMatch(rules.disallow, path);
  if (!disallowMatch) return false;
  if (allowMatch && allowMatch.length >= disallowMatch.length) return false;
  return true;
}

function longestMatch(patterns: string[], path: string): string | null {
  let best: string | null = null;
  for (const p of patterns) {
    if (matchPattern(p, path) && (!best || p.length > best.length)) {
      best = p;
    }
  }
  return best;
}

function matchPattern(pattern: string, path: string): boolean {
  // Translate robots.txt globs ($, *) into a RegExp.
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  const re = "^" + escaped.replace(/\*/g, ".*").replace(/\\\$$/, "$");
  try {
    return new RegExp(re).test(path);
  } catch {
    return path.startsWith(pattern);
  }
}

/** Very small sitemap.xml parser using regex — avoids an XML dependency. */
export function parseSitemap(xml: string): SitemapEntry[] {
  const out: SitemapEntry[] = [];
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/gi) ?? [];
  for (const block of urlBlocks) {
    const loc = first(block, /<loc>\s*([^<]+?)\s*<\/loc>/i);
    if (!loc) continue;
    const lastmod = first(block, /<lastmod>\s*([^<]+?)\s*<\/lastmod>/i);
    const changefreq = first(block, /<changefreq>\s*([^<]+?)\s*<\/changefreq>/i);
    const priorityRaw = first(block, /<priority>\s*([^<]+?)\s*<\/priority>/i);
    const entry: SitemapEntry = { loc };
    if (lastmod) entry.lastmod = lastmod;
    if (changefreq) entry.changefreq = changefreq;
    if (priorityRaw) {
      const n = Number.parseFloat(priorityRaw);
      if (Number.isFinite(n)) entry.priority = n;
    }
    out.push(entry);
  }
  return out;
}

/** Index-sitemap support: returns child sitemap URLs if present. */
export function parseSitemapIndex(xml: string): string[] {
  const out: string[] = [];
  const blocks = xml.match(/<sitemap>[\s\S]*?<\/sitemap>/gi) ?? [];
  for (const b of blocks) {
    const loc = first(b, /<loc>\s*([^<]+?)\s*<\/loc>/i);
    if (loc) out.push(loc);
  }
  return out;
}

function first(text: string, re: RegExp): string | null {
  const m = re.exec(text);
  return m && m[1] ? m[1] : null;
}
