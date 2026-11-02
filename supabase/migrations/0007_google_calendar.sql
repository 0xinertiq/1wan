-- 0007: friends' Google Calendar (read-only), round 22. Additive only: one new table, nothing existing is changed.
-- NOT APPLIED automatically: the owner applies it by hand after approving it.
--
-- One row per account that connected Google Calendar. The tokens are secrets: row-level security is on with NO
-- policy at all, and the signed-in and anonymous roles have no rights on the table, so no browser can ever read
-- them. Only the server (service role, lib/gcal.ts) reads and writes this table.
create table public.google_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  refresh_token text not null,
  access_token text,
  expires_at timestamptz,
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.google_tokens enable row level security;
revoke all on public.google_tokens from anon, authenticated;
