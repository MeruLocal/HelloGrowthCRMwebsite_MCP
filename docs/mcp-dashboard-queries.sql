-- ============================================================================
-- Dashboard / reporting queries for MCP AI-name tracking
-- Run with the service role (these tables are not exposed to anon).
-- ============================================================================

-- ── "ChatGPT accessed 120 website pages today" ──────────────────────────────
-- Pages accessed = successful page-reading tool calls, grouped by AI name.
select
  ai_name,
  count(*) as pages_accessed_today
from public.mcp_audit_logs
where created_at >= date_trunc('day', now())
  and status = 'success'
  and tool_name in ('getWebsitePage', 'getWebsiteContent', 'fetch_page_content')
group by ai_name
order by pages_accessed_today desc;

-- ── "Cursor used 8 tools today" (all successful tool calls, any tool) ────────
select
  ai_name,
  count(*) as tool_calls_today
from public.mcp_audit_logs
where created_at >= date_trunc('day', now())
  and status = 'success'
group by ai_name
order by tool_calls_today desc;

-- ── "Invalid clients blocked 3 times" (auth/permission/rate-limit denials) ──
select
  count(*) as invalid_or_denied_today
from public.mcp_audit_logs
where created_at >= date_trunc('day', now())
  and status = 'denied';

-- Break the denials down by reason (stored in metadata->>'reason'):
select
  coalesce(ai_name, 'Unknown / Invalid Client') as ai_name,
  metadata->>'reason'                            as reason,
  count(*)                                        as denials
from public.mcp_audit_logs
where created_at >= date_trunc('day', now())
  and status = 'denied'
group by 1, 2
order by denials desc;

-- ── Full daily summary card (one row per AI) ────────────────────────────────
select
  coalesce(ai_name, 'Unknown / Invalid Client')                      as ai_name,
  count(*)                                                            as total_calls,
  count(*) filter (where status = 'success')                         as successes,
  count(*) filter (where status = 'failed')                          as failures,
  count(*) filter (where status = 'denied')                          as denied,
  count(*) filter (
    where status = 'success'
      and tool_name in ('getWebsitePage','getWebsiteContent','fetch_page_content')
  )                                                                  as pages_accessed,
  count(distinct tool_name) filter (where status = 'success')        as distinct_tools_used
from public.mcp_audit_logs
where created_at >= date_trunc('day', now())
group by 1
order by total_calls desc;

-- ── Tool-usage breakdown per AI (last 7 days) ───────────────────────────────
select
  ai_name,
  tool_name,
  count(*) as calls
from public.mcp_audit_logs
where created_at >= now() - interval '7 days'
  and status = 'success'
group by ai_name, tool_name
order by ai_name, calls desc;

-- ── Daily trend for one AI (last 30 days) ───────────────────────────────────
select
  date_trunc('day', created_at)::date as day,
  count(*) filter (where status = 'success') as successes,
  count(*) filter (where status = 'denied')  as denied
from public.mcp_audit_logs
where ai_name = 'ChatGPT'
  and created_at >= now() - interval '30 days'
group by 1
order by 1;

-- ── Most-accessed URLs per AI (last 7 days) ─────────────────────────────────
select
  ai_name,
  resource_url,
  count(*) as hits
from public.mcp_audit_logs
where created_at >= now() - interval '7 days'
  and status = 'success'
  and resource_url is not null
group by ai_name, resource_url
order by hits desc
limit 50;

-- ── Active clients overview (status + configured limits) ────────────────────
select
  ai_name,
  client_id,
  status,
  rate_limit_per_minute,
  jsonb_array_length(allowed_tools)   as tool_allowlist_size,
  jsonb_array_length(allowed_domains) as domain_allowlist_size,
  created_at
from public.mcp_clients
order by ai_name;

-- ── Optional: a convenience VIEW for the dashboard daily cards ──────────────
create or replace view public.mcp_daily_activity as
select
  date_trunc('day', created_at)::date                                as day,
  coalesce(ai_name, 'Unknown / Invalid Client')                      as ai_name,
  count(*)                                                            as total_calls,
  count(*) filter (where status = 'success')                         as successes,
  count(*) filter (where status = 'denied')                          as denied,
  count(*) filter (
    where status = 'success'
      and tool_name in ('getWebsitePage','getWebsiteContent','fetch_page_content')
  )                                                                  as pages_accessed
from public.mcp_audit_logs
group by 1, 2;
