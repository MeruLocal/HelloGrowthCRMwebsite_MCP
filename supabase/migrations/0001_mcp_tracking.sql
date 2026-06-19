-- ============================================================================
-- Migration: MCP AI-name tracking
-- Tracks WHICH AI / client (ChatGPT, Claude, Gemini, Cursor, Windsurf,
-- Perplexity, Internal AI, ...) is accessing website data through the MCP
-- server. Identity is established by API key / OAuth client id — NEVER by
-- user-agent alone (user-agents are trivially spoofed).
--
-- Apply with:  psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_mcp_tracking.sql
--          or paste into the Supabase SQL editor.
-- ============================================================================

-- gen_random_uuid() lives in pgcrypto on most Postgres builds.
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. Registered MCP clients (one row per AI/client identity)
-- ----------------------------------------------------------------------------
create table if not exists public.mcp_clients (
  id                    uuid primary key default gen_random_uuid(),
  -- Low-cardinality label we report on: 'ChatGPT', 'Claude', 'Gemini', ...
  ai_name               text        not null,
  -- Stable opaque identifier for this credential (OAuth client_id style).
  client_id             text        not null unique,
  -- SHA-256 hex digest of the plaintext API key. The plaintext is NEVER stored.
  api_key_hash          text        not null unique,
  status                text        not null default 'active',
  -- Whitelist of tool names this client may call. Empty array = allow all.
  allowed_tools         jsonb       not null default '[]'::jsonb,
  -- Whitelist of registrable domains this client may read. Empty = allow all.
  allowed_domains       jsonb       not null default '[]'::jsonb,
  rate_limit_per_minute integer     not null default 60,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint mcp_clients_status_chk
    check (status in ('active', 'inactive', 'blocked'))
);

comment on table public.mcp_clients is
  'Registered AI/MCP client identities. Identity is proven by api_key_hash, not user-agent.';
comment on column public.mcp_clients.api_key_hash is
  'SHA-256 hex digest of the plaintext key. Plaintext is shown once at creation and never stored.';

-- ----------------------------------------------------------------------------
-- 2. Audit log (one row per website tool call)
-- ----------------------------------------------------------------------------
create table if not exists public.mcp_audit_logs (
  id             uuid primary key default gen_random_uuid(),
  -- Denormalised client_id + ai_name so logs survive client deletion and stay
  -- cheap to query/report on. NULL client_id = unidentified / invalid client.
  client_id      text,
  ai_name        text,
  tool_name      text        not null,
  resource_type  text        not null default 'website',
  resource_url   text,
  method         text,
  ip_address     text,
  user_agent     text,
  request_id     text,
  status         text        not null,
  error_message  text,
  -- Short, non-sensitive summaries only. Never store full page bodies here.
  input_summary  text,
  output_summary text,
  metadata       jsonb       not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),

  constraint mcp_audit_logs_status_chk
    check (status in ('success', 'failed', 'denied'))
);

comment on table public.mcp_audit_logs is
  'Per-tool-call audit trail for MCP website access. Stores URL + summaries only, never full content.';

-- ----------------------------------------------------------------------------
-- 3. Indexes
-- ----------------------------------------------------------------------------
create index if not exists idx_mcp_audit_logs_ai_name    on public.mcp_audit_logs (ai_name);
create index if not exists idx_mcp_audit_logs_client_id  on public.mcp_audit_logs (client_id);
create index if not exists idx_mcp_audit_logs_tool_name  on public.mcp_audit_logs (tool_name);
create index if not exists idx_mcp_audit_logs_status     on public.mcp_audit_logs (status);
create index if not exists idx_mcp_audit_logs_created_at on public.mcp_audit_logs (created_at desc);

create index if not exists idx_mcp_clients_client_id on public.mcp_clients (client_id);
create index if not exists idx_mcp_clients_status    on public.mcp_clients (status);

-- ----------------------------------------------------------------------------
-- 4. updated_at trigger for mcp_clients
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_mcp_clients_updated_at on public.mcp_clients;
create trigger trg_mcp_clients_updated_at
  before update on public.mcp_clients
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. Row Level Security
--    Both tables hold operational/security data. They must NEVER be readable
--    by the anon or authenticated (browser) roles. Only the service role
--    (used by the MCP server backend) may read/write.
--
--    Note: in Supabase the service_role key BYPASSES RLS entirely, so the
--    backend keeps full access. Enabling RLS with no anon/authenticated policy
--    means those roles get nothing. We add an explicit service_role policy too
--    for clarity and for any direct-Postgres / role-scoped connections.
-- ----------------------------------------------------------------------------
alter table public.mcp_clients    enable row level security;
alter table public.mcp_audit_logs enable row level security;

-- Lock out anon/authenticated by simply not granting them any policy.
revoke all on public.mcp_clients    from anon, authenticated;
revoke all on public.mcp_audit_logs from anon, authenticated;

drop policy if exists mcp_clients_service_all on public.mcp_clients;
create policy mcp_clients_service_all
  on public.mcp_clients
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists mcp_audit_logs_service_all on public.mcp_audit_logs;
create policy mcp_audit_logs_service_all
  on public.mcp_audit_logs
  for all
  to service_role
  using (true)
  with check (true);

-- ============================================================================
-- End migration
-- ============================================================================
