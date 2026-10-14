import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { writeReport } from "../../reports/report-generator.js";
import { runWithCallContext } from "../call-context.js";
import { exportBotReport } from "../export-bot-report.js";

const LOG =
  '203.0.113.5 - - [10/Oct/2025:13:55:36 +0000] "GET / HTTP/1.1" 200 512 "-" "Mozilla/5.0 (compatible; GPTBot/1.0)"';

let root: string;
let dir: string;
const saved = process.env.REPORT_OUTPUT_DIR;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "report-test-"));
  dir = join(root, "a", "b", "reports");
  process.env.REPORT_OUTPUT_DIR = dir;
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  if (saved === undefined) delete process.env.REPORT_OUTPUT_DIR;
  else process.env.REPORT_OUTPUT_DIR = saved;
});

function call(args: Record<string, unknown>, authorized: boolean) {
  const parsed = exportBotReport.schema.parse({ logText: LOG, ...args });
  return runWithCallContext({ authorized }, () => exportBotReport.handle(parsed));
}

function listAll(): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else out.push(p);
    }
  };
  walk(root);
  return out;
}

describe("export_bot_report on the public endpoint", () => {
  it("never writes, even when asked, and returns the report inline", async () => {
    const res = await call({ saveToDisk: true, filename: "../../escape.md" }, false);
    expect(res.isError).toBeUndefined();
    const payload = JSON.parse(res.content[0]!.text);
    expect(payload.savedTo).toBeNull();
    expect(payload.report).toContain("Bot Activity Report");
    expect(payload.notes.join(" ")).toMatch(/not available on the public endpoint/);
    expect(listAll()).toEqual([]);
  });

  it("defaults to not saving", async () => {
    const res = await call({}, true);
    expect(JSON.parse(res.content[0]!.text).savedTo).toBeNull();
    expect(listAll()).toEqual([]);
  });
});

describe("export_bot_report for an authorised session", () => {
  it("writes a plain file name inside REPORT_OUTPUT_DIR", async () => {
    const res = await call({ saveToDisk: true, filename: "weekly.csv", format: "csv" }, true);
    const payload = JSON.parse(res.content[0]!.text);
    expect(payload.savedTo).toBe(join(dir, "weekly.csv"));
    expect(listAll()).toEqual([join(dir, "weekly.csv")]);
  });

  it.each(["../escape.md", "/etc/cron.d/x", "a/b.md", ".hidden", "..", "x\0.md", "C:\\x.md"])(
    "rejects %j and writes nothing",
    async (filename) => {
      const res = await call({ saveToDisk: true, filename }, true);
      expect(res.isError).toBe(true);
      expect(res.content[0]!.text).not.toContain(root);
      expect(listAll()).toEqual([]);
    },
  );
});

describe("writeReport", () => {
  it("rejects traversal when called directly", async () => {
    await expect(writeReport("x", "markdown", "../../pwn.md")).rejects.toThrow(/Unsafe/);
    expect(listAll()).toEqual([]);
  });
});
