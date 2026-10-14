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
  /** Human-readable name for client UIs; set from src/tools/titles.ts. */
  title?: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
  annotations?: McpToolAnnotations;
  /**
   * JSON Schema of `structuredContent`. Set from src/tools/output-schemas.ts;
   * the server then attaches structuredContent to every successful result.
   */
  outputSchema?: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
    [key: string]: unknown;
  };
}

export interface McpTextContent {
  type: "text";
  text: string;
}

export interface McpCallResult {
  content: McpTextContent[];
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
  return { content: [{ type: "text", text }] };
}

export function fail(message: string): McpCallResult {
  return { content: [{ type: "text", text: message }], isError: true };
}
