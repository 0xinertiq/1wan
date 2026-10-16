-- Optional metadata on briefs, for example which sources a scheduled task used:
--   { "sources": "Bigdata unavailable, used web search and RSS" }
-- Additive and safe: adds one nullable column, changes no existing rows.
-- Run once in Supabase: SQL Editor > New query > paste > Run.

alter table public.briefs add column if not exists meta jsonb;
