import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Free-plan truth (PLAN-HCW-0200 P0c emergency patch). hellocrm enforces a
 * 150-lead cap on Free, WhatsApp click-to-chat only, and puts Task Boards,
 * the scheduler, the dialer and AI lead scoring on Growth. The site FAQ and
 * the alternatives tables said "200 leads", "task boards" and "scheduling"
 * on Free, and named a retired "Software Only" plan. These are source-text
 * guards so a hand-typed copy cannot drift back.
 */

const ROOT = path.resolve(__dirname, "..");
const FILES = ["faqs.ts", "alternatives.ts"];

const FORBIDDEN: Array<[string, RegExp]> = [
  ["stale 200-lead Free cap", /\b200 (leads|contacts)\b/],
  ["task boards / scheduling on Free", /free plan[^"]{0,120}(task boards|scheduling)/i],
  ["retired Software Only plan", /Software Only plan/],
  ["unlimited automation on Free", /free plan has unlimited[^"]{0,40}automation/i],
];

describe("Free-plan truth in MCP knowledge data", () => {
  for (const file of FILES) {
    it(`${file} states no Free-plan claim the product does not enforce`, () => {
      const src = fs.readFileSync(path.join(ROOT, file), "utf8");
      const hits = FORBIDDEN.filter(([, re]) => re.test(src)).map(([name]) => name);
      expect(hits).toEqual([]);
    });
  }
});
