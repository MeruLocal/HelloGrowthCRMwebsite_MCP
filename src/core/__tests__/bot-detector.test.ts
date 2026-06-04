import { describe, expect, it } from "vitest";
import {
  detectByUserAgent,
  recommendAction,
  scoreRisk,
  type BehaviorSignals,
} from "../bot-detector.js";

const quietSignals: BehaviorSignals = {
  hits: 10,
  uniquePaths: 3,
  errorRate: 0,
  hoursObserved: 24,
  ignoresRobots: false,
};

describe("detectByUserAgent", () => {
  it("treats an empty / placeholder UA as a likely scraper", () => {
    const result = detectByUserAgent("-");
    expect(result.matched).toBe(true);
    expect(result.inferredCategory).toBe("scraper");
  });

  it("matches a known bot signature", () => {
    const result = detectByUserAgent(
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    );
    expect(result.matched).toBe(true);
    expect(result.bot?.name.toLowerCase()).toContain("google");
  });

  it("does not match an ordinary browser UA", () => {
    const result = detectByUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    );
    expect(result.matched).toBe(false);
  });
});

describe("scoreRisk", () => {
  it("returns the baseline for quiet, compliant traffic", () => {
    const { score } = scoreRisk(null, quietSignals);
    expect(score).toBe(50);
  });

  it("raises the score when robots.txt is ignored", () => {
    const { score, notes } = scoreRisk(null, {
      ...quietSignals,
      ignoresRobots: true,
    });
    expect(score).toBe(70);
    expect(notes.join(" ")).toMatch(/robots\.txt/i);
  });

  it("clamps the score to a 0-100 range", () => {
    const { score } = scoreRisk(null, {
      hits: 1_000_000,
      uniquePaths: 10_000,
      errorRate: 1,
      hoursObserved: 1,
      ignoresRobots: true,
    });
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe("recommendAction", () => {
  it("allows well-behaved search engines", () => {
    expect(recommendAction(20, "search")).toEqual({
      status: "allowed",
      action: "allow",
    });
  });

  it("blocks high-risk actors regardless of category", () => {
    expect(recommendAction(85, "ai").action).toBe("block");
  });

  it("asks to verify identity for unknown mid-risk actors", () => {
    expect(recommendAction(30, "unknown").action).toBe("verify-identity");
  });
});
