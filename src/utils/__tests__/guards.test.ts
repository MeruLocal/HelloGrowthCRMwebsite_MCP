import { afterEach, describe, expect, it } from "vitest";
import { assertPublicUrl, isBlockedIp } from "../ssrf-guard.js";
import { assertSafeFilename, resolveLogPath } from "../safe-paths.js";
import { exportBotReport } from "../../tools/export-bot-report.js";
import { analyzeAccessLogs } from "../../tools/analyze-access-logs.js";

describe("ssrf guard", () => {
  it.each(["127.0.0.1", "10.1.2.3", "169.254.169.254", "172.16.0.1", "192.168.1.1", "::1", "fd00::1", "::ffff:127.0.0.1"])(
    "blocks %s",
    (ip) => expect(isBlockedIp(ip)).toBe(true),
  );
  it("allows a public address", () => expect(isBlockedIp("8.8.8.8")).toBe(false));
  it("rejects non-http schemes, localhost and metadata", async () => {
    await expect(assertPublicUrl("file:///etc/passwd")).rejects.toThrow();
    await expect(assertPublicUrl("http://localhost:3001/")).rejects.toThrow();
    await expect(assertPublicUrl("http://169.254.169.254/latest/meta-data/")).rejects.toThrow();
    await expect(assertPublicUrl("http://[::1]/")).rejects.toThrow();
  });
});

describe("path confinement", () => {
  const saved = { ...process.env };
  afterEach(() => { process.env = { ...saved }; });

  it("refuses log paths when MCP_LOG_DIR is unset", () => {
    delete process.env.MCP_LOG_DIR;
    expect(() => resolveLogPath("/etc/passwd")).toThrow(/disabled/);
  });
  it("refuses traversal out of MCP_LOG_DIR", () => {
    process.env.MCP_LOG_DIR = process.cwd();
    expect(() => resolveLogPath("../../etc/passwd")).toThrow(/outside/);
  });
  it("accepts only plain file names for reports", () => {
    expect(() => assertSafeFilename("../../x.md")).toThrow();
    expect(() => assertSafeFilename("a/b.md")).toThrow();
    expect(assertSafeFilename("bot-report.md")).toBe("bot-report.md");
  });
  it("export_bot_report does not write to disk by default", async () => {
    delete process.env.MCP_ALLOW_REPORT_WRITES;
    const r = await exportBotReport.handle({ logText: `1.2.3.4 - - [01/Jan/2026:00:00:00 +0000] "GET / HTTP/1.1" 200 10 "-" "Googlebot/2.1"`, format: "markdown", saveToDisk: true, filename: "../../pwn.md" });
    expect(r.isError).toBeFalsy();
    expect(r.content[0].text).toContain('"savedTo": null');
  });
  it("analyze_access_logs refuses an arbitrary logPath without echoing it", async () => {
    delete process.env.MCP_LOG_DIR;
    const r = await analyzeAccessLogs.handle({ logPath: "/etc/passwd", topN: 5 });
    expect(r.isError).toBe(true);
    expect(r.content[0].text).not.toContain("/etc/passwd");
  });
});
