/**
 * get_sequence_status (BETA) — is a contact in an active outreach sequence?
 * Read scope is sufficient.
 */

import { z } from "zod";
import {
  defineCrmTool,
  fail,
  ok,
  type CrmToolContext,
} from "./_shared.js";

const schema = z.object({
  contact_id: z.string().min(1),
});

export const getSequenceStatus = defineCrmTool({
  schema,
  definition: {
    name: "get_sequence_status",
    description:
      "Check whether a contact is enrolled in an active outreach sequence, and if so the sequence name, current step, next step time, and total steps.",
    inputSchema: {
      type: "object",
      required: ["contact_id"],
      properties: {
        contact_id: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  async handle(args, ctx: CrmToolContext) {
    try {
      // INTEGRATION: confirm sequence_enrollments table/columns and tenant scoping.
      const { data, error } = await ctx.db
        .from("sequence_enrollments")
        .select(
          "sequence_name, current_step, next_step_at, total_steps, status",
        )
        .eq("tenant_id", ctx.tenantId)
        .eq("contact_id", args.contact_id)
        .eq("status", "active")
        .order("next_step_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) return fail(`Error reading sequence status: ${error.message}`);

      if (!data) return ok({ enrolled: false });

      return ok({
        enrolled: true,
        sequence_name: data.sequence_name,
        current_step: data.current_step,
        next_step_at: data.next_step_at,
        total_steps: data.total_steps,
      });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});
