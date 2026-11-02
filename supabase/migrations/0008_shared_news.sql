-- 0008: the shared friend news feed, round 22. Additive only: two new tables, nothing existing is changed.
-- NOT APPLIED automatically: the owner applies it by hand after approving it.
--
-- One shared feed for every account, written once by the server from free public RSS feeds: headline, publisher,
-- time, category and link only, never article text. Any signed-in account may read it; no browser may write it
-- (only the server, with the service role). news_sources keeps each source's last good fetch, and its "_run" row
-- is the refresh lock (at most one refresh every two hours, however many people open News).
create table public.news_items (
  id text primary key,
  title text not null,
  publisher text not null,
  source text not null,
  category text not null check (category in ('crypto', 'macro', 'markets', 'world', 'local', 'tech', 'politics', 'health', 'science')),
  link text not null,
  published_at timestamptz,
  fetched_at timestamptz not null default now()
);
create index news_items_cat_time on public.news_items (category, published_at desc);

create table public.news_sources (
  id text primary key,
  last_ok timestamptz,
  last_error text,
  checked_at timestamptz not null default now()
);
insert into public.news_sources (id, checked_at) values ('_run', '2000-01-01');

alter table public.news_items enable row level security;
alter table public.news_sources enable row level security;
create policy "signed in reads the shared feed" on public.news_items for select to authenticated using (true);
create policy "signed in reads source health" on public.news_sources for select to authenticated using (true);
revoke insert, update, delete on public.news_items, public.news_sources from anon, authenticated;
