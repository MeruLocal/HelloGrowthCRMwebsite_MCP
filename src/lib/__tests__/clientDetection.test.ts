import { describe, expect, it } from "vitest";
import { detectClient, safeHost } from "../clientDetection.js";

describe("detectClient — AI clients", () => {
  it("detects ChatGPT / OpenAI", () => {
    const r = detectClient("Mozilla/5.0 ChatGPT-User/1.0 (+https://openai.com/bot)");
    expect(r.clientName).toBe("ChatGPT");
    expect(r.clientType).toBe("ai");
    expect(r.isBot).toBe(false);
  });

  it("detects Claude / Anthropic (non-bot client)", () => {
    const r = detectClient("Claude-User/1.0 (+https://anthropic.com)");
    expect(r.clientName).toBe("Claude");
    expect(r.clientType).toBe("ai");
    expect(r.isBot).toBe(false);
  });

  it("detects Cursor", () => {
    expect(detectClient("Cursor/0.42").clientName).toBe("Cursor");
  });

  it("detects Postman as a tool", () => {
    const r = detectClient("PostmanRuntime/7.39.0");
    expect(r.clientName).toBe("Postman");
    expect(r.clientType).toBe("tool");
  });
});

describe("detectClient — bots", () => {
  it("detects GPTBot as a bot", () => {
    const r = detectClient("Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)");
    expect(r.isBot).toBe(true);
    expect(r.botName).toBe("GPTBot");
    expect(r.clientType).toBe("bot");
  });

  it("detects ClaudeBot as a bot (not the Claude client)", () => {
    const r = detectClient("Mozilla/5.0 (compatible; ClaudeBot/1.0; +https://anthropic.com)");
    expect(r.isBot).toBe(true);
    expect(r.botName).toBe("ClaudeBot");
  });

  it("classifies Google-Extended as a bot, not the Gemini client", () => {
    const r = detectClient("Mozilla/5.0 (compatible; Google-Extended)");
    expect(r.isBot).toBe(true);
    expect(r.botName).toBe("Google-Extended");
  });

  it("detects SemrushBot", () => {
    expect(detectClient("Mozilla/5.0 (compatible; SemrushBot/7~bl)").botName).toBe("SemrushBot");
  });
});

describe("detectClient — browser & unknown", () => {
  it("detects a real browser UA", () => {
    const r = detectClient(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    );
    expect(r.clientName).toBe("Browser");
    expect(r.isBot).toBe(false);
  });

  it("returns Unknown for an empty UA", () => {
    const r = detectClient("");
    expect(r.clientName).toBe("Unknown");
    expect(r.clientType).toBe("unknown");
    expect(r.isBot).toBe(false);
  });

  it("returns Unknown for an unrecognised UA", () => {
    expect(detectClient("some-random-agent/9").clientName).toBe("Unknown");
  });
});

describe("safeHost", () => {
  it("reduces a full URL to its host", () => {
    expect(safeHost("https://app.hellogrowthcrm.com/path?q=1")).toBe("app.hellogrowthcrm.com");
  });

  it("accepts a bare host", () => {
    expect(safeHost("mcp.hellogrowthcrm.com")).toBe("mcp.hellogrowthcrm.com");
  });

  it("drops the port", () => {
    expect(safeHost("http://localhost:3008/sse")).toBe("localhost");
  });

  it("returns undefined for null/empty/'null'", () => {
    expect(safeHost(undefined)).toBeUndefined();
    expect(safeHost("")).toBeUndefined();
    expect(safeHost("null")).toBeUndefined();
  });
});
