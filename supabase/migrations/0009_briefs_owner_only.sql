-- Round 22: shared briefs (user_id NULL: her Daily Intel Brief, scans, Kumo's weekly review) are readable by the
-- owner only, inside the database, not just hidden by the app. A friend can still read briefs written for their own
-- account (user_id = their id). The owner is the first account created, the same rule the app uses (lib/usage.ts
-- ownerId). Writes are unchanged: they come from the server (service role key), which bypasses RLS.
-- Run once in Supabase: SQL Editor > New query > paste > Run. Safe to run twice.

-- true only for the signed-in owner. Security definer so it can look at auth.users without opening that table to
-- anyone; it answers yes or no about the caller and nothing else.
create or replace function public.is_court_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $f$
  select coalesce(auth.uid() = (select u.id from auth.users u order by u.created_at asc limit 1), false)
$f$;

revoke all on function public.is_court_owner() from public, anon;
grant execute on function public.is_court_owner() to authenticated;

drop policy if exists "read briefs" on public.briefs;

create policy "read briefs" on public.briefs
  for select
  to authenticated
  using (user_id = auth.uid() or (user_id is null and public.is_court_owner()));
