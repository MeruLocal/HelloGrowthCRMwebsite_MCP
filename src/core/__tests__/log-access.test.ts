import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { runWithCallContext } from "../../tools/call-context.js";
import { analyzeAccessLogs } from "../../tools/analyze-access-logs.js";
import { exportBotReport } from "../../tools/export-bot-report.js";
import { listAllowedBots } from "../../tools/list-allowed-bots.js";
import { listBlockedBots } from "../../tools/list-blocked-bots.js";
import { scanWebsiteBots } from "../../tools/scan-website-bots.js";
import { suggestBotPolicy } from "../../tools/suggest-bot-policy.js";
import type { RegisteredTool } from "../../tools/tool-types.js";

const LINE =
  '203.0.113.5 - - [10/Oct/2025:13:55:36 +0000] "GET / HTTP/1.1" 200 512 "-" "Mozilla/5.0 (compatible; GPTBot/1.0)"';

let root: string;
let logDir: string;
let outside: string;
const env = { ...process.env };

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "logaccess-"));
  logDir = join(root, "logs");
  mkdirSync(logDir);
  writeFileSync(join(logDir, "access.log"), `${LINE}\n`);
  outside = join(root, "secret.log");
  writeFileSync(outside, `${LINE}\n`);
  symlinkSync(outside, join(logDir, "link.log"));
});
afterAll(() => rmSync(root, { recursive: true, force: true }));
beforeEach(() => {
  process.env = { ...env };
  delete process.env.DEFAULT_ACCESS_LOG;
  delete process.env.LOG_DIR;
  delete process.env.DEFAULT_TARGET_URL;
});

async function run(tool: RegisteredTool, args: Record<string, unknown>, authorized = false) {
  const parsed = tool.schema.parse(args);
  const res = await runWithCallContext({ authorized }, () => tool.handle(parsed));
  return { res, text: res.content.map((c) => c.text).join("\n") };
}

const logPathTools: [string, RegisteredTool][] = [
  ["analyze_access_logs", analyzeAccessLogs],
  ["export_bot_report", exportBotReport],
  ["suggest_bot_policy", suggestBotPolicy],
];

describe("public callers cannot read server files", () => {
  it.each(logPathTools)("%s refuses logPath without echoing it", async (_n, tool) => {
    for (const p of ["/etc/hostname", "/nope"]) {
      const { res, text } = await run(tool, { logPath: p });
      expect(res.isError).toBe(true);
      expect(text).toMatch(/not available on the public endpoint/);
      expect(text).not.toContain(p);
      expect(text).not.toMatch(/ENOENT|EACCES/);
    }
  });

  it("scan_website_bots refuses logPath as a warning", async () => {
    // targetUrl unset → fails before any network; the refusal is checked via a
    // private address so no real fetch happens.
    const { text } = await run(scanWebsiteBots, {
      targetUrl: "http://127.0.0.1:9/",
      sampleSize: 0,
      logPath: "/etc/hostname",
    });
    expect(text).toMatch(/not available on the public endpoint/);
    expect(text).not.toContain("/etc/hostname");
  });

  it.each([
    ["list_allowed_bots", listAllowedBots],
    ["list_blocked_bots", listBlockedBots],
  ] as [string, RegisteredTool][])("%s refuses robotsTxtPath", async (_n, tool) => {
    for (const p of ["/etc/hostname", "/nope"]) {
      const { text } = await run(tool, { robotsTxtPath: p });
      expect(text).toMatch(/not available on the public endpoint/);
      expect(text).not.toContain(p);
      expect(text).not.toMatch(/ENOENT/);
    }
  });

  it("list_* accept robots.txt content inline", async () => {
    const { text } = await run(listBlockedBots, { robotsTxt: "User-agent: GPTBot\nDisallow: /\n" });
    const payload = JSON.parse(text);
    expect(payload.source).toBe("inline-text");
    expect(payload.bots.map((b: { name: string }) => b.name)).toContain("GPTBot");
  });
});

describe("what still works", () => {
  it("logText works for public callers", async () => {
    const { res, text } = await run(analyzeAccessLogs, { logText: LINE });
    expect(res.isError).toBeUndefined();
    expect(JSON.parse(text).source).toBe("inline-text");
  });

  it("DEFAULT_ACCESS_LOG works and is reported by label, not path", async () => {
    process.env.DEFAULT_ACCESS_LOG = join(logDir, "access.log");
    const { res, text } = await run(analyzeAccessLogs, {});
    expect(res.isError).toBeUndefined();
    expect(JSON.parse(text).source).toBe("DEFAULT_ACCESS_LOG");
    expect(text).not.toContain(logDir);
  });

  it("an authorised read inside LOG_DIR works", async () => {
    process.env.LOG_DIR = logDir;
    const { res, text } = await run(analyzeAccessLogs, { logPath: "access.log" }, true);
    expect(res.isError).toBeUndefined();
    expect(JSON.parse(text).totalLines).toBe(1);
  });
});

describe("authorised escapes are denied", () => {
  it.each(["../secret.log", "link.log"])("%s is denied (traversal and symlink)", async (p) => {
    process.env.LOG_DIR = logDir;
    const { res, text } = await run(analyzeAccessLogs, { logPath: p }, true);
    expect(res.isError).toBe(true);
    expect(text).toMatch(/not available on the public endpoint/);
  });

  it("an absolute path outside LOG_DIR is denied", async () => {
    process.env.LOG_DIR = logDir;
    const { res } = await run(analyzeAccessLogs, { logPath: outside }, true);
    expect(res.isError).toBe(true);
  });

  it("a missing file gives the same generic answer, no ENOENT", async () => {
    process.env.LOG_DIR = logDir;
    const { res, text } = await run(analyzeAccessLogs, { logPath: "missing.log" }, true);
    expect(res.isError).toBe(true);
    expect(text).not.toMatch(/ENOENT|missing\.log/);
  });

  it("without LOG_DIR even an authorised session cannot pass logPath", async () => {
    const { res } = await run(analyzeAccessLogs, { logPath: join(logDir, "access.log") }, true);
    expect(res.isError).toBe(true);
  });

  it("a read error on DEFAULT_ACCESS_LOG is generic", async () => {
    process.env.DEFAULT_ACCESS_LOG = join(root, "does-not-exist.log");
    const { res, text } = await run(analyzeAccessLogs, {});
    expect(res.isError).toBe(true);
    expect(text).toBe("Could not read the log file.");
  });
});
