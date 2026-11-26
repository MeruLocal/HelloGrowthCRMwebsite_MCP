import { z } from "zod";
import { getSupabase } from "../lib/supabase.js";
import { defineTool, fail, ok } from "./tool-types.js";
import { logger } from "../utils/logger.js";

// ── analytics_social_proof ────────────────────────────────────────────────────

export const analyticsSocialProof = defineTool({
  schema: z.object({
    limit: z.number().int().positive().max(50).default(10),
  }),
  definition: {
    name: "analytics_social_proof",
    description: "Fetch recent signup and testimonial data used for social proof widgets on hellogrowthcrm.com.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", minimum: 1, maximum: 50, default: 10 },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    try {
      // newsletter_subscribers has no `status` column (website schema: id, email,
      // source, subscribed_at, unsubscribed_at). `.eq("status", "confirmed")` failed
      // on every call with "column newsletter_subscribers.status does not exist"
      // (live audit 2026-11-19). A subscriber is active while unsubscribed_at is null.
      //
      // Only signup timestamps are returned: this is a public, unauthenticated
      // endpoint, and even a partially masked email plus its domain identifies a
      // person at a small company. A social-proof widget needs "N people joined
      // recently", not who they are.
      const { data: subs, error: subErr } = await getSupabase()
        .from("newsletter_subscribers")
        .select("subscribed_at")
        .is("unsubscribed_at", null)
        .order("subscribed_at", { ascending: false })
        .limit(args.limit);

      if (subErr) {
        logger.warn("analytics_social_proof: query failed", { message: subErr.message });
        return fail("Could not read recent signups. The server log has the reason.");
      }

      const signups = (subs ?? []).map((s) => ({ subscribed_at: s.subscribed_at }));

      return ok({
        recent_signups_count: signups.length,
        signups,
        note: "Recent active newsletter signups, newest first. Identities are not returned.",
      });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});
