-- 0005: stop and target on plans, for the stop/ATR review flags on Life > Trade. Additive only.
alter table public.plans add column if not exists stop numeric;
alter table public.plans add column if not exists target numeric;
