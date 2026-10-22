# Connecting a client

The hosted server is public and read-only: no API key, no CRM access. The path is `/sse` but the transport is **Streamable HTTP** (`/mcp` is an alias).

| Client | File |
|---|---|
| Claude Code | `claude-code.sh` |
| Cursor | `cursor.mcp.json` → `.cursor/mcp.json` |
| VS Code | `vscode.mcp.json` → `.vscode/mcp.json` |
| Claude Desktop | `claude-desktop.json` (uses the `mcp-remote` bridge; not verified here) |

Smoke test: `npx @modelcontextprotocol/inspector --cli https://mcp.hellogrowthcrm.com/sse --transport http --method tools/list`

Try asking: "What does HelloGrowthCRM cost in India?", "Compare HelloGrowthCRM with Zoho", "Is there a CRM for recruitment agencies?" — the server's `buyer_find_answer_pages` tool routes these to canonical pages.
