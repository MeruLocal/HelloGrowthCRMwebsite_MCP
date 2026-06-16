/**
 * get_whatsapp_thread (BETA) — read a contact's WhatsApp conversation history.
 * Read scope is sufficient. Phone numbers are masked when PII masking is on.
 * Capped at 100 messages to avoid overflowing AI-client context windows.
 */

import { z } from "zod";
import {
  defineCrmTool,
  fail,
  maskPhone,
  ok,
  type CrmToolContext,
} from "./_shared.js";

const schema = z.object({
  contact_id: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(20),
  since: z.string().datetime().optional(),
});

export const getWhatsappThread = defineCrmTool({
  schema,
  definition: {
    name: "get_whatsapp_thread",
    description:
      "Read the WhatsApp conversation history for a CRM contact in chronological order. Returns direction, timestamp, and content for up to 100 messages.",
    inputSchema: {
      type: "object",
      required: ["contact_id"],
      properties: {
        contact_id: { type: "string" },
        limit: {
          type: "integer",
          default: 20,
          description: "Number of messages to return (max 100).",
        },
        since: {
          type: "string",
          format: "date-time",
          description: "Only return messages after this timestamp.",
        },
      },
      additionalProperties: false,
    },
  },
  async handle(args, ctx: CrmToolContext) {
    try {
      // INTEGRATION: confirm whatsapp_messages table/columns and tenant scoping.
      let query = ctx.db
        .from("whatsapp_messages")
        .select("direction, content, phone_number, created_at")
        .eq("tenant_id", ctx.tenantId)
        .eq("contact_id", args.contact_id)
        .order("created_at", { ascending: true })
        .limit(args.limit);

      if (args.since) query = query.gte("created_at", args.since);

      const { data, error } = await query;
      if (error) return fail(`Error reading thread: ${error.message}`);

      const messages = (data ?? []).map((m) => ({
        direction: m.direction,
        content: m.content,
        timestamp: m.created_at,
        phone_number: ctx.piiMasking
          ? maskPhone(m.phone_number)
          : m.phone_number,
      }));

      return ok({
        contact_id: args.contact_id,
        count: messages.length,
        messages,
      });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});
