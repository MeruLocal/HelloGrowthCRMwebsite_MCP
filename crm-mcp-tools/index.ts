/**
 * Registry of the 4 BETA WhatsApp/voice CRM MCP tools.
 *
 * These belong to the authenticated CRM product MCP server
 * (`mcp.hellogrowthcrm.com`) — NOT the public bot-crawler server in `src/`.
 * The CRM backend should: authenticate the Bearer API key, build a
 * `CrmToolContext`, look the tool up here, pre-reject write tools when the key
 * is read-only (`requiresWrite && scope !== "read_write"`), validate args with
 * `tool.schema`, then call `tool.handle(args, ctx)`.
 */

import { getCallRecording } from "./get_call_recording.js";
import { getSequenceStatus } from "./get_sequence_status.js";
import { getWhatsappThread } from "./get_whatsapp_thread.js";
import { sendWhatsapp } from "./send_whatsapp.js";
import type { RegisteredCrmTool } from "./_shared.js";

export const crmBetaTools: RegisteredCrmTool[] = [
  sendWhatsapp,
  getWhatsappThread,
  getCallRecording,
  getSequenceStatus,
];

export const crmBetaToolsByName: Map<string, RegisteredCrmTool> = new Map(
  crmBetaTools.map((t) => [t.definition.name, t]),
);

export * from "./_shared.js";
