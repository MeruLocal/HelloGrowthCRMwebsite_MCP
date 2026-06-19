-- ============================================================================
-- Seed: standard MCP clients
--
-- PREFERRED: run  `npx tsx scripts/seed-mcp-clients.ts`  instead — it generates
-- real random keys, prints each plaintext key ONCE, and stores only the hash.
--
-- This SQL is for environments where you seed manually. The api_key_hash values
-- below are PLACEHOLDERS — replace each with a real SHA-256 hex digest of the
-- plaintext key you intend to issue. Generate one with:
--
--   node -e "console.log(require('crypto').createHash('sha256').update('mcp_live_REPLACE_ME').digest('hex'))"
--   # or:  printf '%s' 'mcp_live_REPLACE_ME' | sha256sum
--
-- Never commit real plaintext keys. Only the hash belongs in the database.
-- ============================================================================

insert into public.mcp_clients
  (ai_name, client_id, api_key_hash, status, allowed_tools, allowed_domains, rate_limit_per_minute)
values
  ('ChatGPT',     'client_chatgpt',     'REPLACE_WITH_SHA256_HASH_CHATGPT',     'active',
    '["getWebsitePage","searchWebsite","getWebsiteSitemap","getWebsiteContent"]'::jsonb,
    '["hellobooks.ai","hellogrowthcrm.com"]'::jsonb, 60),

  ('Claude',      'client_claude',      'REPLACE_WITH_SHA256_HASH_CLAUDE',      'active',
    '["getWebsitePage","searchWebsite","getWebsiteSitemap","getWebsiteContent"]'::jsonb,
    '["hellobooks.ai","hellogrowthcrm.com"]'::jsonb, 60),

  ('Gemini',      'client_gemini',      'REPLACE_WITH_SHA256_HASH_GEMINI',      'active',
    '["getWebsitePage","searchWebsite","getWebsiteSitemap","getWebsiteContent"]'::jsonb,
    '["hellobooks.ai","hellogrowthcrm.com"]'::jsonb, 60),

  ('Cursor',      'client_cursor',      'REPLACE_WITH_SHA256_HASH_CURSOR',      'active',
    '["getWebsitePage","searchWebsite","getWebsiteSitemap","getWebsiteContent"]'::jsonb,
    '["hellobooks.ai","hellogrowthcrm.com"]'::jsonb, 120),

  ('Windsurf',    'client_windsurf',    'REPLACE_WITH_SHA256_HASH_WINDSURF',    'active',
    '["getWebsitePage","searchWebsite","getWebsiteSitemap","getWebsiteContent"]'::jsonb,
    '["hellobooks.ai","hellogrowthcrm.com"]'::jsonb, 120),

  ('Perplexity',  'client_perplexity',  'REPLACE_WITH_SHA256_HASH_PERPLEXITY',  'active',
    '["getWebsitePage","searchWebsite","getWebsiteSitemap","getWebsiteContent"]'::jsonb,
    '["hellobooks.ai","hellogrowthcrm.com"]'::jsonb, 60),

  -- Internal AI: empty allowed_tools = unrestricted (all tools), higher limit.
  ('Internal AI', 'client_internal_ai', 'REPLACE_WITH_SHA256_HASH_INTERNAL_AI', 'active',
    '[]'::jsonb,
    '["hellobooks.ai","hellogrowthcrm.com"]'::jsonb, 300)

on conflict (client_id) do update
  set ai_name               = excluded.ai_name,
      status                = excluded.status,
      allowed_tools         = excluded.allowed_tools,
      allowed_domains       = excluded.allowed_domains,
      rate_limit_per_minute = excluded.rate_limit_per_minute,
      updated_at            = now();
