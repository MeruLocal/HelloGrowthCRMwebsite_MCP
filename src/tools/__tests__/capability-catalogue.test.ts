import { describe, expect, it } from "vitest";
import { CAPABILITY_CATALOGUE, CATALOGUE_VERIFIED_AT } from "../../data/capability-catalogue.js";
import { featuresGet, featuresList } from "../features.js";

type Handler = { handle: (a: unknown) => Promise<{ content: { text: string }[]; isError?: boolean }> };

async function json(tool: Handler, args: unknown = {}) {
  const res = await tool.handle(args);
  expect(res.isError).toBeFalsy();
  return JSON.parse(res.content[0]!.text) as Record<string, any>;
}

describe("verified capability catalogue", () => {
  it("every entry says how to get it and carries a limitations array", () => {
    for (const c of CAPABILITY_CATALOGUE) {
      expect(c.availability_note.length, c.title).toBeGreaterThan(20);
      expect(Array.isArray(c.limitations), c.title).toBe(true);
      expect(c.bullets.length, c.title).toBeGreaterThan(0);
      expect(c.summary.length, c.title).toBeGreaterThan(30);
    }
  });

  it("has no duplicate titles", () => {
    const titles = CAPABILITY_CATALOGUE.map((c) => c.title.toLowerCase());
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("makes none of the claims the audit found to be false", () => {
    const text = JSON.stringify(CAPABILITY_CATALOGUE);
    expect(text).not.toMatch(/Unlimited users/i);
    expect(text).not.toMatch(/SOC 2/i);
    expect(text).not.toMatch(/WhatsApp[- ](first|native)/i);
    expect(text).not.toMatch(/₹1,099/);
  });

  it("states the honest limits for the capabilities most often over-promised", () => {
    const by = (t: string) => CAPABILITY_CATALOGUE.find((c) => c.title === t)!;
    expect(by("Instagram DM & Comment Management").limitations.join(" ")).toMatch(/auto/i);
    expect(by("Call Transcription & Analysis").limitations.join(" ")).toMatch(/stored call recording/i);
    expect(by("Report Builder").limitations.join(" ")).toMatch(/Scheduled or emailed reports are not built/);
    expect(by("Public REST API & Webhooks").limitations.join(" ")).toMatch(/No endpoints to create or read invoices/);
    expect(by("Customer Portal").limitations.join(" ")).toMatch(/vendor or supplier portal is not built/i);
    expect(by("Field Sales & Sales Planning (Agri Inputs)").availability_note).toMatch(/Agri Inputs/);
  });
});

describe("features_list / features_get serve the catalogue", () => {
  it("lists catalogue entries with availability_note and a verified stamp", async () => {
    const out = await json(featuresList, { category: "Calling & AI Voice", plan: "all" });
    expect(out.total).toBeGreaterThanOrEqual(5);
    expect(out.catalogue.verified_at).toBe(CATALOGUE_VERIFIED_AT);
    for (const f of out.features) {
      expect(f.availability_note).toBeTruthy();
      expect(f.availability).toBeUndefined();
    }
  });

  it("keeps the 58 original entries and does not leak catalogue entries into plan filters", async () => {
    const all = await json(featuresList, { category: "all", plan: "all" });
    expect(all.total).toBe(58 + CAPABILITY_CATALOGUE.length);
    const free = await json(featuresList, { category: "all", plan: "free" });
    expect(free.features.every((f: any) => f.availability_note === undefined)).toBe(true);
  });

  it("finds a catalogue entry by an alias keyword", async () => {
    const out = await json(featuresList, { category: "all", plan: "all", search: "sales planning" });
    expect(out.features.some((f: any) => f.slug === "field-sales-sales-planning-agri-inputs")).toBe(true);
  });

  it("features_get returns limitations and verified_at for a catalogue entry", async () => {
    const out = await json(featuresGet, { slug: "ticketing-sla" });
    expect(out.limitations.join(" ")).toMatch(/round-robin/i);
    expect(out.verified_at).toBe(CATALOGUE_VERIFIED_AT);
  });
});
