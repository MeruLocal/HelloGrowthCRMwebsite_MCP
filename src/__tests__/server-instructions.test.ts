import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";

import { buildServer } from "../server.js";
import { SERVER_INSTRUCTIONS, TOOL_GROUPS, groupMembers } from "../server-instructions.js";
import { PRIVILEGED_TOOLS, publicToolNames } from "../tools/access.js";
import { toolsByName } from "../tools/index.js";

describe("server instructions (#68)", () => {
  it("initialize returns them", async () => {
    const server = buildServer();
    const [a, b] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "t", version: "0" });
    await Promise.all([server.connect(a), client.connect(b)]);
    expect(client.getInstructions()).toBe(SERVER_INSTRUCTIONS);
  });

  it("every public tool falls in exactly one group", () => {
    const names = publicToolNames(toolsByName.keys());
    const problems = names
      .map((n) => ({ n, groups: TOOL_GROUPS.filter((g) => groupMembers(g, [n]).length).length }))
      .filter((x) => x.groups !== 1);
    expect(problems).toEqual([]);
  });

  it("names no privileged tool and no price figure", () => {
    for (const t of PRIVILEGED_TOOLS) expect(SERVER_INSTRUCTIONS).not.toContain(t);
    expect(SERVER_INSTRUCTIONS).not.toMatch(/[₹$£€]\s?\d|\d+\s*\/\s*user/);
  });

  it("is under 2,000 characters", () => {
    expect(SERVER_INSTRUCTIONS.length).toBeLessThan(2_000);
  });
});
