import { describe, expect, it } from "vitest";
import { humanizeToolName } from "../server.js";

describe("tool titles", () => {
  it("humanizes snake_case names", () => {
    expect(humanizeToolName("pricing_get_plans")).toBe("Pricing: Get plans");
    expect(humanizeToolName("blog_list")).toBe("Blog: List");
    expect(humanizeToolName("scan")).toBe("Scan");
  });
});
