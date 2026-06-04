import { z } from "zod";
import { getSupabase } from "../lib/supabase.js";
import { defineTool, fail, ok } from "./tool-types.js";

// ── forms_list_submissions ────────────────────────────────────────────────────

export const formsListSubmissions = defineTool({
  schema: z.object({
    limit: z.number().int().positive().max(200).default(50),
    offset: z.number().int().min(0).default(0),
    date_from: z.string().optional().describe("ISO 8601 date — filter submissions on or after this date."),
    date_to: z.string().optional().describe("ISO 8601 date — filter submissions on or before this date."),
  }),
  definition: {
    name: "forms_list_submissions",
    description: "List contact form submissions with optional date range filter and pagination.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", minimum: 1, maximum: 200, default: 50 },
        offset: { type: "integer", minimum: 0, default: 0 },
        date_from: { type: "string", description: "ISO 8601 date (inclusive)." },
        date_to: { type: "string", description: "ISO 8601 date (inclusive)." },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    try {
      let query = getSupabase()
        .from("contact_submissions")
        .select("id, name, email, company, message, created_at")
        .order("created_at", { ascending: false })
        .range(args.offset, args.offset + args.limit - 1);

      if (args.date_from) query = query.gte("created_at", args.date_from);
      if (args.date_to) query = query.lte("created_at", args.date_to);

      const { data, error } = await query;
      if (error) return fail(`Error: ${error.message}`);
      return ok({ count: data?.length ?? 0, offset: args.offset, submissions: data });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});

// ── forms_get_submission ──────────────────────────────────────────────────────

export const formsGetSubmission = defineTool({
  schema: z.object({
    id: z.string().describe("Submission UUID."),
  }),
  definition: {
    name: "forms_get_submission",
    description: "Fetch a single contact form submission by ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    try {
      const { data, error } = await getSupabase()
        .from("contact_submissions")
        .select("*")
        .eq("id", args.id)
        .single();
      if (error) return fail(`Submission not found or error: ${error.message}`);
      return ok(data);
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});

// ── forms_submit ──────────────────────────────────────────────────────────────

export const formsSubmit = defineTool({
  schema: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    company: z.string().optional(),
    phone: z.string().optional(),
    message: z.string().min(10),
    source: z.string().optional().describe("Page or campaign source."),
  }),
  definition: {
    name: "forms_submit",
    description: "Submit a contact form entry directly into the database (bypasses CAPTCHA — use for internal/automation submissions only).",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", minLength: 2 },
        email: { type: "string", format: "email" },
        company: { type: "string" },
        phone: { type: "string" },
        message: { type: "string", minLength: 10 },
        source: { type: "string" },
      },
      required: ["name", "email", "message"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    try {
      const { data, error } = await getSupabase()
        .from("contact_submissions")
        .insert({ ...args, created_at: new Date().toISOString() })
        .select("id, email, created_at")
        .single();
      if (error) return fail(`Submit error: ${error.message}`);
      return ok({ message: "Submission recorded.", submission: data });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});

// ── forms_export_csv ──────────────────────────────────────────────────────────

export const formsExportCsv = defineTool({
  schema: z.object({
    date_from: z.string().optional().describe("ISO 8601 date (inclusive)."),
    date_to: z.string().optional().describe("ISO 8601 date (inclusive)."),
  }),
  definition: {
    name: "forms_export_csv",
    description: "Export contact form submissions as CSV text for the given date range.",
    inputSchema: {
      type: "object",
      properties: {
        date_from: { type: "string" },
        date_to: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    try {
      let query = getSupabase()
        .from("contact_submissions")
        .select("id, name, email, company, phone, message, source, created_at")
        .order("created_at", { ascending: false });

      if (args.date_from) query = query.gte("created_at", args.date_from);
      if (args.date_to) query = query.lte("created_at", args.date_to);

      const { data, error } = await query;
      if (error) return fail(`Export error: ${error.message}`);
      if (!data || data.length === 0) return ok("No submissions found for the given date range.");

      const headers = ["id", "name", "email", "company", "phone", "message", "source", "created_at"];
      const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const rows = data.map((row) =>
        headers.map((h) => escape(row[h as keyof typeof row])).join(","),
      );
      const csv = [headers.join(","), ...rows].join("\n");
      return ok(csv);
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});
