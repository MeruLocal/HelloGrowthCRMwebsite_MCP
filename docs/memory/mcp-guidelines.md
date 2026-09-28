# MCP guidelines (recall card)

The rules any tool, auth, manifest or distribution change must meet. Verified by research on 2026-09-02; the full yardstick is §6 of the audit skill (`.claude/skills/mcp-server-audit/SKILL.md`, PR #31). Update this card when the spec or a directory's rules change.

## Spec and transport
- Current stable spec: **2025-11-25** (what this server and SDK 1.29.x speak: async Tasks, OIDC discovery, incremental scope consent, Client ID Metadata Documents, tool icons).
- **2026-07-28 goes stateless:** the initialize handshake and `Mcp-Session-Id` are removed. Plan session handling before bumping the SDK past 1.29.x.
- Streamable HTTP is the standard; the old HTTP+SSE transport is deprecated.

## Auth
- An MCP server is an **OAuth 2.1 resource server**: RFC 9728 protected-resource metadata, PKCE S256 mandatory, token audience binding.
- **Token passthrough is forbidden:** never forward a client's token to a downstream API.
- Authless is acceptable **only** for public-data servers (this one qualifies). Account data needs OAuth; bearer-only blocks the Claude directory.
- Sessions must not be used for authentication; session IDs must be non-deterministic and bound to the user.
- Minimal initial scopes; elevate incrementally via `WWW-Authenticate`.

## Tools
- A `title` on every tool; names ≤ 64 characters.
- Accurate `readOnlyHint` / `destructiveHint` annotations (`src/tools/annotations.ts`, tested).
- Separate read tools from write tools; paginate results; return useful validation errors.
- Prefer **few smart tools** over 1:1 API wrappers (tool-selection accuracy decays as the list grows).
- Reads can be auto-approved; writes are gated with a preview ("AI proposes, human commits"). Tool **visibility** is scoped by token (our `MCP_ADMIN_TOKEN` gate).
- Money-moving tools: quote, then confirm. None exist here.
- **Never mix untrusted content + private data + write tools in one session** (the "lethal trifecta"). Wrap user-generated content as data, not instructions; prefer excluding it.

## Claude Connectors Directory
- Production HTTPS + Streamable HTTP. OAuth (DCR or Client ID Metadata Documents) for account data; authless allowed for public operations.
- Tool titles, accurate annotations, pagination, a populated reviewer account, multi-tenant isolation tests, no financial-asset transfers. Submission goes through a Team/Enterprise org admin.

## Official MCP Registry (registry.modelcontextprotocol.io)
- `server.json` with `$schema`. Namespace is reverse-DNS proven by domain ownership (`com.hellogrowthcrm` needs DNS/HTTP verification); ours is currently `io.github.merulocal/...`.
- The npm package must embed a matching `mcpName` marker.
- **Never advertise an unpublished package.** Publish npm first, then the registry. One registry publish propagates to aggregators; Smithery, Glama and PulseMCP index from npm.

## Our standing rule
- Describe only what the live server serves. Manifest, marketing, schema and code change in the same release. Verify against `GET /version`.
