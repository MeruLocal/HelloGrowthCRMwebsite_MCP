import { describe, expect, it } from "vitest";
import { parseYouTubeFeed } from "../youtube-feed.js";

// A trimmed copy of the real Atom feed shape, including the entities YouTube
// actually emits in titles (&amp;, &#39;).
const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/">
  <entry>
    <yt:videoId>nyKc38wIEM8</yt:videoId>
    <published>2026-08-27T09:00:00+00:00</published>
    <media:group>
      <media:title>HelloGrowthCRM Explained: 7 Modules, 12 AI Agents and an MCP Server</media:title>
      <media:description>A tour of the whole product.</media:description>
    </media:group>
  </entry>
  <entry>
    <yt:videoId>t2TnzY3YpX0</yt:videoId>
    <published>2026-08-27T08:00:00+00:00</published>
    <media:group>
      <media:title>Veterinary Clinics CRM | Manage Appointments, Pets &amp; Clients</media:title>
      <media:description></media:description>
    </media:group>
  </entry>
</feed>`;

describe("parseYouTubeFeed", () => {
  it("extracts id, title, description and upload date", () => {
    const videos = parseYouTubeFeed(FEED);
    expect(videos).toHaveLength(2);
    expect(videos[0].id).toBe("nyKc38wIEM8");
    expect(videos[0].title).toContain("12 AI Agents");
    expect(videos[0].uploadDate).toBe("2026-08-27T09:00:00+00:00");
    expect(videos[0].description).toBe("A tour of the whole product.");
  });

  it("decodes XML entities in titles", () => {
    // Raw feed titles carry &amp; — a client rendering "Pets &amp;amp; Clients"
    // is the visible symptom of skipping this.
    expect(parseYouTubeFeed(FEED)[1].title).toContain("Pets & Clients");
  });

  it("tolerates a missing description", () => {
    expect(parseYouTubeFeed(FEED)[1].description).toBe("");
  });

  it("returns [] rather than throwing on junk input", () => {
    expect(parseYouTubeFeed("")).toEqual([]);
    expect(parseYouTubeFeed("<html>not a feed</html>")).toEqual([]);
    expect(parseYouTubeFeed("<entry><published>2026-01-01</published></entry>")).toEqual([]);
  });

  it("skips entries with no id or no title", () => {
    const partial = `<entry><yt:videoId>abc</yt:videoId></entry>`;
    expect(parseYouTubeFeed(partial)).toEqual([]);
  });
});
