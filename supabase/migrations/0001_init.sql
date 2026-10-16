-- 1(WAN) first schema. Every table has row-level security (RLS) on.
-- Run once in Supabase: SQL Editor > New query > paste > Run.

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- Briefs: user_id NULL means a shared brief (written once, everyone can read).
create table public.briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  kind text not null,                -- pulse | intel | scan | movers
  title text not null default '',
  body text not null default '',
  at timestamptz not null default now()
);
create index briefs_kind_at on public.briefs (kind, at desc);

create table public.agent_memory (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,                 -- intel | protocol | pulse | scan | review
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

create table public.feedback (
  user_id uuid not null references auth.users(id) on delete cascade,
  brief_kind text not null,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, brief_kind)
);

-- Everything the old dashboard kept in its one big state document.
create table public.user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  version int not null default 1,
  updated_at timestamptz not null default now()
);

-- Token log per user and per feature (feeds the Crew Cost Calculator).
create table public.usage (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  feature text not null,
  model text,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  at timestamptz not null default now()
);

alter table public.profiles     enable row level security;
alter table public.briefs       enable row level security;
alter table public.agent_memory enable row level security;
alter table public.feedback     enable row level security;
alter table public.user_state   enable row level security;
alter table public.usage        enable row level security;

create policy "own profile"  on public.profiles     for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "read briefs"  on public.briefs       for select using (user_id is null or user_id = auth.uid());
create policy "own memory"   on public.agent_memory for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own feedback" on public.feedback     for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own state"    on public.user_state   for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "read own usage" on public.usage      for select using (user_id = auth.uid());
-- Writes to briefs and usage come from the server (service role key), which bypasses RLS.
