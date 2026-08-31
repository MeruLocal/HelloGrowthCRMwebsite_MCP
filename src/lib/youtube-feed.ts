/**
 * Live YouTube channel feed for `media_list_videos`.
 *
 * WHY: the tool served a seed frozen at SYNCED_AT 2026-07-08, and by 2026-08-31
 * NONE of the 15 videos in the live channel feed appeared in it — including the
 * channel's own explainer, "HelloGrowthCRM Explained: 7 Modules, 12 AI Agents
 * and an MCP Server". An AI client asking "what videos does HelloGrowthCRM
 * have?" got a confident, complete-looking answer that omitted every upload from
 * the previous seven weeks.
 *
 * This mirrors what the website already does in
 * `src/lib/server/home-youtube-feed.ts` + `src/lib/youtube-videos.ts`: merge the
 * seeded list with the live channel, dedupe by id, newest first, and fall back
 * to the seed if the fetch fails. The website's richer path uses the YouTube
 * Data API for the full library plus view counts; this server deliberately uses
 * only the keyless Atom feed (latest ~15) so the mirror needs no credential.
 * That is a documented ceiling, not an oversight — see `note` in the tool output.
 */
import { logger } from "../utils/logger.js";

export const YOUTUBE_CHANNEL_ID = "UCpYkLyZFgFn3V958VhlJ-4Q";
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;
const TIMEOUT_MS = 4000;

export interface FeedVideo {
  id: string;
  title: string;
  description: string;
  uploadDate: string;
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Parse the Atom feed. Returns [] on anything unexpected — never throws. */
export function parseYouTubeFeed(xml: string): FeedVideo[] {
  const out: FeedVideo[] = [];
  for (const entry of xml.split("<entry>").slice(1)) {
    const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = entry.match(/<media:title>([\s\S]*?)<\/media:title>/)?.[1];
    const published = entry.match(/<published>([^<]+)<\/published>/)?.[1];
    if (!id || !title) continue;
    out.push({
      id: id.trim(),
      title: decodeXml(title.trim()),
      description: decodeXml(
        (entry.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1] ?? "").trim(),
      ),
      uploadDate: published ?? "",
    });
  }
  return out;
}

/**
 * Fetch the latest channel uploads. Guaranteed non-throwing: on timeout, a
 * non-200, or a parse failure it returns [] and the caller serves the seed.
 * A stale answer is acceptable here; a failed tool call is not.
 */
export async function fetchYouTubeFeed(): Promise<FeedVideo[]> {
  // Escape hatch for tests, offline builds, and ops if the feed ever misbehaves.
  if (process.env.MCP_DISABLE_LIVE_YOUTUBE === "true") return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(FEED_URL, { signal: controller.signal });
    if (!res.ok) {
      logger.debug(`youtube-feed: HTTP ${res.status} — serving seeded videos only`);
      return [];
    }
    return parseYouTubeFeed(await res.text());
  } catch (e) {
    logger.debug(`youtube-feed: ${(e as Error).message} — serving seeded videos only`);
    return [];
  } finally {
    clearTimeout(timer);
  }
}
