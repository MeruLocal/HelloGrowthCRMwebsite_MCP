import { describe, expect, it } from "vitest";

import { getCallContext, publicInputSchema, runWithCallContext } from "../call-context.js";

describe("call context", () => {
  it("is public outside any context (fails closed)", () => {
    expect(getCallContext().authorized).toBe(false);
  });

  it("carries across await", async () => {
    const seen = await runWithCallContext({ authorized: true, clientIp: "203.0.113.7" }, async () => {
      await new Promise((r) => setTimeout(r, 5));
      return getCallContext();
    });
    expect(seen).toEqual({ authorized: true, clientIp: "203.0.113.7" });
    expect(getCallContext().authorized).toBe(false);
  });

  it("only a literal true authorises", () => {
    const seen = runWithCallContext({ authorized: "yes" as unknown as boolean }, () => getCallContext());
    expect(seen.authorized).toBe(false);
  });

  it("strips operator-only properties from a public schema", () => {
    const out = publicInputSchema({
      type: "object",
      properties: { logPath: {}, logText: {}, saveToDisk: {}, filename: {}, robotsTxtPath: {} },
      required: ["logPath", "logText"],
    });
    expect(Object.keys(out.properties)).toEqual(["logText"]);
    expect(out.required).toEqual(["logText"]);
  });
});
