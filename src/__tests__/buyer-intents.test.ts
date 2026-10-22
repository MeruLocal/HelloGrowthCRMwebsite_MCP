import { describe, expect, it } from "vitest";
import { BUYER_INTENTS, matchIntents, pageUrl } from "../data/buyer-intents.js";
import { buyerFindAnswerPages } from "../tools/buyer-answers.js";
import { toolsByName } from "../tools/index.js";
import { PROMPTS, getPrompt } from "../prompts.js";
import { buildServerCard, buildMcpLlmsTxt } from "../well-known.js";

describe("buyer intents", () => {
  it("every page is a site-relative path that becomes an https hellogrowthcrm.com URL", () => {
    for (const i of BUYER_INTENTS) {
      expect(i.pages.length).toBeGreaterThan(0);
      for (const p of i.pages) {
        expect(p.path.startsWith("/")).toBe(true);
        expect(pageUrl(p)).toMatch(/^https:\/\/hellogrowthcrm\.com\/[a-z0-9\-/]*$/);
      }
    }
  });

  it("only references tools that exist", () => {
    for (const i of BUYER_INTENTS) for (const t of i.tools) expect(toolsByName.has(t), `${i.id}: ${t}`).toBe(true);
  });

  it("carries no price or count claims", () => {
    expect(JSON.stringify(BUYER_INTENTS)).not.toMatch(/[₹$£]\s?\d|\d+\s?(users|leads|integrations)/i);
  });

  it("routes real buyer questions", () => {
    expect(matchIntents("what is a good salesforce alternative")[0]?.id).toBe("competitors");
    expect(matchIntents("how much does it cost per user in india")[0]?.id).toBe("pricing");
    expect(matchIntents("best crm for real estate agents")[0]?.id).toBe("industries");
    expect(matchIntents("zzzz")).toEqual([]);
  });

  it("tool returns canonical pages and follow-up tools", async () => {
    const r = await buyerFindAnswerPages.handle({ question: "is there a free crm plan?" });
    const body = JSON.parse(r.content[0]!.text);
    expect(body.matched).toBe(true);
    expect(JSON.stringify(body)).toContain("https://hellogrowthcrm.com/free-crm");
  });

  it("lists topics when nothing matches", async () => {
    const body = JSON.parse((await buyerFindAnswerPages.handle({ question: "zzzz" })).content[0]!.text);
    expect(body.matched).toBe(false);
    expect(body.topics.length).toBe(BUYER_INTENTS.length);
  });
});

describe("prompts", () => {
  it("each prompt builds text that names real tools and carries the brand/price rules", () => {
    for (const p of PROMPTS) {
      const args = Object.fromEntries(p.arguments.map((a) => [a.name, "x"]));
      const text = p.build(args);
      expect(text).toContain("never from memory");
      expect(text).not.toMatch(/[₹$£]\s?\d/);
      for (const m of text.matchAll(/\b([a-z]+_[a-z_]+)\b/g)) {
        const name = m[1]!;
        if (/^(pricing|alternatives|content|features|buyer|faqs|company)_/.test(name)) expect(toolsByName.has(name), name).toBe(true);
      }
    }
    expect(getPrompt("nope")).toBeUndefined();
  });
});

describe("discovery documents", () => {
  it("server card is valid JSON with counts", () => {
    const c = JSON.parse(buildServerCard({ tools: 77, resources: 9, prompts: 4 }));
    expect(c.capabilities.prompts.count).toBe(4);
    expect(c.authentication.required).toBe(false);
  });
  it("mcp llms.txt points at the canonical site and the entry tool", () => {
    const t = buildMcpLlmsTxt();
    expect(t).toContain("buyer_find_answer_pages");
    expect(t).toContain("https://hellogrowthcrm.com/pricing");
    expect(t).not.toMatch(/WhatsApp CRM/i);
  });
});
