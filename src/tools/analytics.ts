import { z } from "zod";
import { getSupabase } from "../lib/supabase.js";
import { logger } from "../utils/logger.js";
import { defineTool, fail, ok } from "./tool-types.js";

// ── analytics_social_proof ────────────────────────────────────────────────────
//
// Public tool, so it returns COUNTS ONLY. It used to return partially masked
// subscriber emails with exact subscribe timestamps; a masked local part plus
// the full domain plus the exact time is still personal data, and for small or
// company domains it identifies the person outright.

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const analyticsSocialProof = defineTool({
  schema: z.object({
    // Accepted and ignored, so existing callers that pass it do not break.
    limit: z.number().int().positive().max(50).optional(),
  }),
  definition: {
    name: "analytics_social_proof",
    description:
      "Return aggregate social-proof numbers for hellogrowthcrm.com: the count of confirmed newsletter subscribers and how many joined in the last 30 days. Counts only — never names, emails or timestamps of individuals.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", minimum: 1, maximum: 50, description: "Deprecated; ignored." },
      },
      additionalProperties: false,
    },
  },
  async handle(_args) {
    try {
      const db = getSupabase();
      const since = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
      const [all, recent] = await Promise.all([
        db
          .from("newsletter_subscribers")
          .select("*", { count: "exact", head: true })
          .eq("status", "confirmed"),
        db
          .from("newsletter_subscribers")
          .select("*", { count: "exact", head: true })
          .eq("status", "confirmed")
          .gte("subscribed_at", since),
      ]);

      // A failed count is an error, never a confident zero.
      if (all.error || recent.error || all.count == null || recent.count == null) {
        logger.error("analytics_social_proof count failed", {
          err: all.error?.message ?? recent.error?.message ?? "null count",
        });
        return fail("Social-proof numbers are unavailable right now. The error was logged.");
      }

      return ok({
        confirmed_subscribers: all.count,
        new_last_30_days: recent.count,
        synced_at: new Date().toISOString(),
      });
    } catch (e) {
      logger.error("analytics_social_proof failed", { err: (e as Error).message });
      return fail("Social-proof numbers are unavailable right now. The error was logged.");
    }
  },
});
