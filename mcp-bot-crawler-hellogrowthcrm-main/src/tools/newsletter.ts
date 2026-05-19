import { z } from "zod";
import { getSupabase } from "../lib/supabase.js";
import { defineTool, fail, ok } from "./tool-types.js";

// ── newsletter_subscribe ──────────────────────────────────────────────────────

export const newsletterSubscribe = defineTool({
  schema: z.object({
    email: z.string().email(),
    name: z.string().optional(),
  }),
  definition: {
    name: "newsletter_subscribe",
    description: "Add a new newsletter subscriber (sets status to 'pending' until email confirmed).",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", format: "email" },
        name: { type: "string" },
      },
      required: ["email"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    try {
      const token = crypto.randomUUID();
      const { data, error } = await getSupabase()
        .from("newsletter_subscribers")
        .insert({
          email: args.email,
          name: args.name ?? null,
          status: "pending",
          confirmation_token: token,
          subscribed_at: new Date().toISOString(),
        })
        .select("email, status")
        .single();
      if (error) {
        if (error.code === "23505") return fail(`${args.email} is already subscribed.`);
        return fail(`Subscribe error: ${error.message}`);
      }
      return ok({ message: "Subscriber added (pending confirmation).", subscriber: data });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});

// ── newsletter_unsubscribe ────────────────────────────────────────────────────

export const newsletterUnsubscribe = defineTool({
  schema: z.object({
    email: z.string().email().optional().describe("Email address to unsubscribe."),
    token: z.string().optional().describe("Unsubscribe token from email link."),
  }).refine((d) => d.email || d.token, { message: "Provide either email or token." }),
  definition: {
    name: "newsletter_unsubscribe",
    description: "Remove a newsletter subscriber by email address or unsubscribe token.",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", format: "email" },
        token: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    try {
      const db = getSupabase();
      let query = db.from("newsletter_subscribers").update({ status: "unsubscribed" });

      if (args.email) query = query.eq("email", args.email);
      else if (args.token) query = query.eq("unsubscribe_token", args.token);

      const { error, count } = await query;
      if (error) return fail(`Unsubscribe error: ${error.message}`);
      if (!count) return fail("Subscriber not found.");
      return ok({ message: "Unsubscribed successfully." });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});

// ── newsletter_get_subscribers ────────────────────────────────────────────────

export const newsletterGetSubscribers = defineTool({
  schema: z.object({
    status: z.enum(["all", "confirmed", "pending", "unsubscribed"]).default("confirmed"),
    limit: z.number().int().positive().max(500).default(50),
    offset: z.number().int().min(0).default(0),
  }),
  definition: {
    name: "newsletter_get_subscribers",
    description: "List newsletter subscribers with status filter and pagination.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["all", "confirmed", "pending", "unsubscribed"], default: "confirmed" },
        limit: { type: "integer", minimum: 1, maximum: 500, default: 50 },
        offset: { type: "integer", minimum: 0, default: 0 },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    try {
      let query = getSupabase()
        .from("newsletter_subscribers")
        .select("email, name, status, subscribed_at")
        .order("subscribed_at", { ascending: false })
        .range(args.offset, args.offset + args.limit - 1);

      if (args.status !== "all") {
        query = query.eq("status", args.status);
      }

      const { data, error } = await query;
      if (error) return fail(`Error: ${error.message}`);
      return ok({ count: data?.length ?? 0, offset: args.offset, status: args.status, subscribers: data });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});

// ── newsletter_get_stats ──────────────────────────────────────────────────────

export const newsletterGetStats = defineTool({
  schema: z.object({}),
  definition: {
    name: "newsletter_get_stats",
    description: "Get total newsletter subscriber counts broken down by status (confirmed, pending, unsubscribed).",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  async handle(_args) {
    try {
      const db = getSupabase();
      const [all, confirmed, pending, unsubscribed] = await Promise.all([
        db.from("newsletter_subscribers").select("*", { count: "exact", head: true }),
        db.from("newsletter_subscribers").select("*", { count: "exact", head: true }).eq("status", "confirmed"),
        db.from("newsletter_subscribers").select("*", { count: "exact", head: true }).eq("status", "pending"),
        db.from("newsletter_subscribers").select("*", { count: "exact", head: true }).eq("status", "unsubscribed"),
      ]);
      return ok({
        total: all.count ?? 0,
        confirmed: confirmed.count ?? 0,
        pending: pending.count ?? 0,
        unsubscribed: unsubscribed.count ?? 0,
      });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});
