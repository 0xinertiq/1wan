-- 0004: life trackers (swing trade ledger, gamble, spending) and garden watering events.
-- Additive only. Every table is private: row-level security, own rows only.
-- user_state.data gains the keys wins, money, grid and samsara (no schema change needed).

create table public.trades (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  date date,
  inst text,
  dir text,
  entry numeric,
  exit numeric,
  stop numeric,
  size numeric,
  lev numeric,
  pnl numeric,
  setup text,
  lesson text,
  tags text[] not null default '{}',
  rules jsonb,                 -- rules kept, as the ledger stored them
  checks jsonb,                -- "Before you enter" ticks, c1..c9
  plan_id text,
  at timestamptz not null default now(),   -- when it was placed or logged (late-night rule c6)
  primary key (user_id, id)
);

create table public.plans (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  date date,
  inst text,
  dir text,
  entry numeric,
  until date,                  -- timeframe end
  thesis text,
  wrong text,                  -- what would prove it wrong
  -- Samsara thesis template fields, merged into plans (one form, not two)
  narrative text,
  seen_where text,
  stage text,
  confidence smallint,
  lesson text,
  share_x boolean not null default false,
  checks jsonb,
  triggered boolean not null default false,
  placed boolean not null default false,
  outcome text not null default 'open',
  at timestamptz not null default now(),
  primary key (user_id, id)
);

-- Gamble results are kept apart and never count in trading stats.
create table public.gamble (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  date date,
  what text,
  pnl numeric,
  note text,
  at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.ledger_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account numeric,
  risk_pct numeric,
  rules text[] not null default '{}',      -- "My three rules"
  wallets jsonb not null default '[]',     -- gamble wallets: name and amount, no account numbers
  updated_at timestamptz not null default now()
);

-- Coco's spending log: manual entry or CSV. No account numbers.
create table public.spending (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  at timestamptz not null default now(),
  amount numeric not null,
  category text not null,
  note text
);
create index spending_user_at on public.spending (user_id, at desc);

-- Every real activity that waters the garden. ref makes each event unique, so writers are idempotent
-- (for example quest:anchors:2026-10-23 or trade:<id>).
create table public.watering_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  at timestamptz not null default now(),
  source text not null,
  ref text not null,
  weight numeric not null default 1,
  unique (user_id, source, ref)
);
create index watering_user_at on public.watering_events (user_id, at desc);

alter table public.trades          enable row level security;
alter table public.plans           enable row level security;
alter table public.gamble          enable row level security;
alter table public.ledger_settings enable row level security;
alter table public.spending        enable row level security;
alter table public.watering_events enable row level security;

create policy "own trades"   on public.trades          for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own plans"    on public.plans           for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own gamble"   on public.gamble          for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own ledger"   on public.ledger_settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own spending" on public.spending        for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own watering" on public.watering_events for all using (user_id = auth.uid()) with check (user_id = auth.uid());
