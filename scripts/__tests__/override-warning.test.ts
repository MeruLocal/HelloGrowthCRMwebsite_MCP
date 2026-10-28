import { describe, expect, it } from "vitest";
// @ts-expect-error plain .mjs helper without types
import { overrideWarning } from "../lib/override-warning.mjs";

describe("overrideWarning (AC-12)", () => {
  it("is silent when no override is expired", () => {
    expect(overrideWarning({ status: "ok", overrides: { total: 25, expired: 0 } })).toBeNull();
  });
  it("warns when overrides are expired", () => {
    expect(overrideWarning({ overrides: { total: 25, expired: 3 } })).toMatch(/3 of 25 claim override/);
  });
  it("is silent on an older server that does not report overrides", () => {
    expect(overrideWarning({ status: "ok" })).toBeNull();
    expect(overrideWarning(null)).toBeNull();
  });
});
