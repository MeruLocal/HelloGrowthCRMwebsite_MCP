/**
 * get_call_recording (BETA) — AI-transcribed call summary + recording metadata.
 * Identify the call by activity_id, or pass contact_id for the latest call.
 * Read scope is sufficient. The raw recording_url is withheld when PII masking
 * is enabled; the AI summary is always returned.
 */

import { z } from "zod";
import {
  defineCrmTool,
  fail,
  ok,
  type CrmToolContext,
} from "./_shared.js";

const schema = z
  .object({
    activity_id: z.string().min(1).optional(),
    contact_id: z.string().min(1).optional(),
  })
  .refine((d) => d.activity_id || d.contact_id, {
    message: "Provide either activity_id or contact_id.",
  });

export const getCallRecording = defineCrmTool({
  schema,
  definition: {
    name: "get_call_recording",
    description:
      "Retrieve the AI-transcribed summary and recording metadata for a CRM call activity. Use activity_id for a specific call, or contact_id for the latest call for that contact.",
    inputSchema: {
      type: "object",
      properties: {
        activity_id: {
          type: "string",
          description: "CRM activity id for the call.",
        },
        contact_id: {
          type: "string",
          description: "Alternative: get the latest call for this contact.",
        },
      },
      additionalProperties: false,
    },
  },
  async handle(args, ctx: CrmToolContext) {
    try {
      // INTEGRATION: confirm call_recordings table/columns and tenant scoping.
      let query = ctx.db
        .from("call_recordings")
        .select(
          "id, duration_seconds, direction, ai_summary, key_topics, action_items, recording_url, occurred_at",
        )
        .eq("tenant_id", ctx.tenantId);

      query = args.activity_id
        ? query.eq("activity_id", args.activity_id)
        : query.eq("contact_id", args.contact_id);

      const { data, error } = await query
        .order("occurred_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return fail(`Error reading recording: ${error.message}`);
      if (!data) return fail("No call recording found.");

      const response: Record<string, unknown> = {
        duration_seconds: data.duration_seconds,
        direction: data.direction,
        ai_summary: data.ai_summary,
        key_topics: data.key_topics ?? [],
        action_items: data.action_items ?? [],
      };
      // Withhold the raw recording URL under PII masking.
      if (!ctx.piiMasking && data.recording_url) {
        response.recording_url = data.recording_url;
      }

      return ok(response);
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});
