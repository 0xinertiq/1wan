-- RLS test for migration 0006 (pgTAP). Run only on a local or branch database AFTER applying 0006, never on
-- production data:  supabase test db   (or psql -f with pgTAP installed).
-- Two made-up users; each must see only their own rows in every round 6 table, and must not write as the other.
begin;
select plan(22);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'a@test.invalid'),
  ('00000000-0000-0000-0000-0000000000b2', 'b@test.invalid');

-- user A writes one row in every table
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
insert into public.journal_entries (id, day, data) values ('j1', '2026-10-28', '{"text":"private"}');
insert into public.goals (id, data) values ('g1', '{}');
insert into public.finance_entries (id, data) values ('f1', '{}');
insert into public.research_notes (id, kind, data) values ('r1', 'note', '{}');
insert into public.longterm_watchlist (id, data) values ('l1', '{}');
insert into public.tasks (id, data) values ('t1', '{}');
insert into public.routines (id, data) values ('o1', '{}');
select is((select count(*)::int from public.journal_entries), 1, 'A sees own journal');
select is((select count(*)::int from public.finance_entries), 1, 'A sees own finance');

-- user B sees none of it and cannot write as A
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}';
select is((select count(*)::int from public.journal_entries), 0, 'B cannot read A journal');
select is((select count(*)::int from public.goals), 0, 'B cannot read A goals');
select is((select count(*)::int from public.finance_entries), 0, 'B cannot read A finance');
select is((select count(*)::int from public.research_notes), 0, 'B cannot read A research');
select is((select count(*)::int from public.longterm_watchlist), 0, 'B cannot read A watchlist');
select is((select count(*)::int from public.tasks), 0, 'B cannot read A tasks');
select is((select count(*)::int from public.routines), 0, 'B cannot read A routines');
select throws_ok($$ insert into public.journal_entries (user_id, id, data) values ('00000000-0000-0000-0000-0000000000a1', 'x', '{}') $$, '42501', null, 'B cannot insert as A (journal)');
select throws_ok($$ insert into public.finance_entries (user_id, id, data) values ('00000000-0000-0000-0000-0000000000a1', 'x', '{}') $$, '42501', null, 'B cannot insert as A (finance)');
select throws_ok($$ insert into public.research_notes (user_id, id, data) values ('00000000-0000-0000-0000-0000000000a1', 'x', '{}') $$, '42501', null, 'B cannot insert as A (research)');
update public.journal_entries set data = '{"text":"x"}' where id = 'j1';
delete from public.goals where id = 'g1';
select throws_ok($$ insert into public.research_notes (id, kind, data) values ('bad', 'other', '{}') $$, '23514', null, 'research kind is note or macro');

-- A's rows are unchanged by B's update and delete attempts
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
select is((select data->>'text' from public.journal_entries where id = 'j1'), 'private', 'B could not change A journal');
select is((select count(*)::int from public.goals), 1, 'B could not delete A goal');

-- anonymous sees nothing
set local role anon;
set local request.jwt.claims = '{}';
select is((select count(*)::int from public.journal_entries), 0, 'anon cannot read journal');
select is((select count(*)::int from public.finance_entries), 0, 'anon cannot read finance');
select is((select count(*)::int from public.research_notes), 0, 'anon cannot read research');
select is((select count(*)::int from public.tasks), 0, 'anon cannot read tasks');
select is((select count(*)::int from public.routines), 0, 'anon cannot read routines');
select is((select count(*)::int from public.goals), 0, 'anon cannot read goals');
select is((select count(*)::int from public.longterm_watchlist), 0, 'anon cannot read watchlist');

select * from finish();
rollback;
