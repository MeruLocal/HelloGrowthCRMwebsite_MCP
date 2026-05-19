import { z } from "zod";
import { getSupabase } from "../lib/supabase.js";
import { defineTool, fail, ok } from "./tool-types.js";

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
      const { data: subs, error: subErr } = await getSupabase()
        .from("newsletter_subscribers")
        .select("email, subscribed_at")
        .eq("status", "confirmed")
        .order("subscribed_at", { ascending: false })
        .limit(args.limit);

      if (subErr) return fail(`Error fetching social proof: ${subErr.message}`);

      // Obfuscate emails for privacy
      const signups = (subs ?? []).map((s) => {
        const [user, domain] = s.email.split("@");
        return {
          email: `${user.slice(0, 2)}***@${domain}`,
          subscribed_at: s.subscribed_at,
        };
      });

      return ok({
        recent_signups_count: signups.length,
        signups,
        note: "Email addresses are partially obfuscated for privacy.",
      });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});
