import type { z } from "zod";

/**
 * MCP tool annotations (spec: ToolAnnotations). These are how a client decides
 * what needs human approval — see src/tools/annotations.ts, which assigns them
 * to every registered tool and fails the build for any tool left without one.
 */
export interface McpToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

export interface McpToolDefinition {
  name: string;
  /**
   * Human-readable display name (MCP spec: Tool.title). Assigned centrally by
   * src/tools/titles.ts, never inline — a client that finds no title shows the
   * raw snake_case `name` to the user.
   */
  title?: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
  /**
   * JSON Schema for the tool's result (MCP spec: Tool.outputSchema).
   *
   * Declaring this is a CONTRACT: the spec requires a tool that advertises an
   * outputSchema to return `structuredContent` conforming to it. `ok()` below
   * populates structuredContent for every object payload, so adding a schema
   * here is safe — but only add one you have checked against what the handler
   * actually returns. A wrong schema is worse than none: it tells the client
   * it may skip parsing, and then hands it a different shape.
   */
  outputSchema?: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
  annotations?: McpToolAnnotations;
}

export interface McpTextContent {
  type: "text";
  text: string;
}

export interface McpCallResult {
  content: McpTextContent[];
  /**
   * The same payload as `content`, unstringified (MCP spec: CallToolResult.
   * structuredContent). Set automatically by `ok()` for object payloads, so a
   * client does not have to re-parse JSON out of a text block, and so any tool
   * that declares an `outputSchema` satisfies the spec's requirement to return
   * structured output. `content` is still populated for clients that predate
   * structured results.
   */
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

export interface RegisteredTool {
  definition: McpToolDefinition;
  schema: z.ZodTypeAny;
  handle: (args: unknown) => Promise<McpCallResult>;
}

export function defineTool<S extends z.ZodTypeAny>(config: {
  definition: McpToolDefinition;
  schema: S;
  handle: (args: z.infer<S>) => Promise<McpCallResult>;
}): RegisteredTool {
  return {
    definition: config.definition,
    schema: config.schema,
    handle: (args: unknown) => config.handle(args as z.infer<S>),
  };
}

export function ok(payload: unknown): McpCallResult {
  const text =
    typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  const structured =
    payload !== null && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : undefined;
  return {
    content: [{ type: "text", text }],
    ...(structured ? { structuredContent: structured } : {}),
  };
}

export function fail(message: string): McpCallResult {
  return { content: [{ type: "text", text: message }], isError: true };
}
