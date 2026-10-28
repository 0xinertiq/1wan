-- 0006: round 6 tables (Trades long-term watchlist, Calendar tasks, Life Hub, Dungeon journal, research notes).
-- Additive only: new tables, nothing existing is changed. NOT APPLIED automatically: the owner applies it by hand
-- (PROGRESS.md, "Round 6: storage") and then sets NEXT_PUBLIC_1WAN_TABLES=on. Until then the app keeps these
-- records on the device ("Preview storage, this device only").
--
-- Every table is owner-only: row-level security, one policy, own rows only. Journal entries and finance entries
-- are never readable by anyone else (no sharing policy exists for any of these tables).
-- Each row keeps its fields in `data` (jsonb), so the app can add a field without a new migration; a few
-- columns are real for sorting and filtering.

create table public.journal_entries (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  day date,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.goals (            -- milestones live inside data.milestones
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.finance_entries (  -- manual only: no bank link, no account numbers
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.research_notes (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  kind text not null default 'note' check (kind in ('note', 'macro')),
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.longterm_watchlist (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.tasks (            -- Kumo tasks; never written to Google Calendar
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.routines (         -- pets and self-care routines
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.journal_entries    enable row level security;
alter table public.goals              enable row level security;
alter table public.finance_entries    enable row level security;
alter table public.research_notes     enable row level security;
alter table public.longterm_watchlist enable row level security;
alter table public.tasks              enable row level security;
alter table public.routines           enable row level security;

create policy "own journal"   on public.journal_entries    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own goals"     on public.goals              for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own finance"   on public.finance_entries    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own research"  on public.research_notes     for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own longterm"  on public.longterm_watchlist for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own tasks"     on public.tasks              for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own routines"  on public.routines           for all using (user_id = auth.uid()) with check (user_id = auth.uid());
