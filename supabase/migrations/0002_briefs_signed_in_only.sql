-- Shared briefs: readable by signed-in users only (0001 also let signed-out visitors read them).
-- Run once in Supabase: SQL Editor > New query > paste > Run.

drop policy if exists "read briefs" on public.briefs;

create policy "read briefs" on public.briefs
  for select
  to authenticated
  using (user_id is null or user_id = auth.uid());
