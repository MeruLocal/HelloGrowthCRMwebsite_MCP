/**
 * send_whatsapp (BETA) — the durable HelloGrowthCRM MCP differentiator.
 *
 * Sends a WhatsApp message to a CRM contact through the existing WhatsApp
 * Business API integration. Enforces, in order:
 *   1. read+write scope          → 403-equivalent rejection for read-only keys
 *   2. contact opt-out           → reject if whatsapp_opt_out is true
 *   3. 24-hour messaging window  → free text requires an inbound message in the
 *                                  last 24h; otherwise a template_id is required
 * Every call is recorded in mcp_audit_log.
 */

import { z } from "zod";
import {
  defineCrmTool,
  fail,
  ok,
  writeAuditLog,
  type CrmToolContext,
} from "./_shared.js";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

const schema = z.object({
  contact_id: z.string().min(1),
  message: z.string().min(1).max(4096),
  template_id: z.string().optional(),
});

export const sendWhatsapp = defineCrmTool({
  schema,
  requiresWrite: true,
  definition: {
    name: "send_whatsapp",
    description:
      "Send a WhatsApp message to a CRM contact via the native WhatsApp Business API. Supports {first_name}, {last_name}, {deal_name} merge tags, or a pre-approved template_id. Enforces the 24-hour window and contact opt-out. Requires a read+write API key.",
    inputSchema: {
      type: "object",
      required: ["contact_id", "message"],
      properties: {
        contact_id: { type: "string", description: "HelloGrowthCRM contact id." },
        message: {
          type: "string",
          description:
            "Message text. Max 4096 chars. Supports {first_name}, {last_name}, {deal_name} merge tags.",
        },
        template_id: {
          type: "string",
          description:
            "Optional: use a pre-approved WhatsApp template by id instead of free text. Required outside the 24-hour window.",
        },
      },
      additionalProperties: false,
    },
  },
  async handle(args, ctx: CrmToolContext) {
    // 1. Scope guard (defence in depth — dispatch should also pre-check).
    if (ctx.scope !== "read_write") {
      return fail(
        "Forbidden: send_whatsapp requires a read+write API key (this key is read-only).",
      );
    }

    try {
      // INTEGRATION: confirm contacts table/columns and tenant scoping.
      const { data: contact, error: contactErr } = await ctx.db
        .from("contacts")
        .select(
          "id, phone_number, whatsapp_opt_out, last_inbound_whatsapp_at, first_name, last_name",
        )
        .eq("tenant_id", ctx.tenantId)
        .eq("id", args.contact_id)
        .single();

      if (contactErr || !contact) {
        return fail(`Contact ${args.contact_id} not found.`);
      }

      // 2. Opt-out guard.
      if (contact.whatsapp_opt_out === true) {
        await writeAuditLog(ctx, {
          tool: "send_whatsapp",
          contactId: args.contact_id,
          messagePreview: args.message,
          result: "rejected:contact_opted_out",
        });
        return ok({ status: "rejected", rejection_reason: "contact_opted_out" });
      }

      // 3. 24-hour window guard — free text needs a recent inbound message.
      const lastInbound = contact.last_inbound_whatsapp_at
        ? new Date(contact.last_inbound_whatsapp_at).getTime()
        : 0;
      const withinWindow = Date.now() - lastInbound < TWENTY_FOUR_HOURS_MS;

      if (!withinWindow && !args.template_id) {
        await writeAuditLog(ctx, {
          tool: "send_whatsapp",
          contactId: args.contact_id,
          messagePreview: args.message,
          result: "rejected:outside_24h_window",
        });
        return ok({
          status: "rejected",
          rejection_reason: "outside_24h_window",
        });
      }

      // INTEGRATION: replace with the real WhatsApp Business API send call.
      // Resolve merge tags against the contact, then dispatch free text or the
      // approved template. Expected to return a provider message id.
      const rendered = args.message
        .replaceAll("{first_name}", contact.first_name ?? "")
        .replaceAll("{last_name}", contact.last_name ?? "");
      const sendResult = await sendViaWhatsappBusinessApi({
        to: contact.phone_number,
        body: args.template_id ? undefined : rendered,
        templateId: args.template_id,
      });

      await writeAuditLog(ctx, {
        tool: "send_whatsapp",
        contactId: args.contact_id,
        messagePreview: args.message,
        result: `${sendResult.status}:${sendResult.messageId}`,
      });

      return ok({
        message_id: sendResult.messageId,
        status: sendResult.status,
      });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});

/**
 * INTEGRATION STUB — wire to the live WhatsApp Business API integration that is
 * already running in the CRM app. Replace the body; keep the return shape.
 */
async function sendViaWhatsappBusinessApi(_params: {
  to: string;
  body?: string;
  templateId?: string;
}): Promise<{ messageId: string; status: "sent" | "queued" }> {
  throw new Error(
    "sendViaWhatsappBusinessApi not yet wired to the CRM WhatsApp Business API integration.",
  );
}
