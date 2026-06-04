import type { z } from "zod";

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
}

export interface McpTextContent {
  type: "text";
  text: string;
}

export interface McpCallResult {
  content: McpTextContent[];
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
