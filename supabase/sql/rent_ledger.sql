-- Rent Ledger (BRD FR-6.1): one row per due period on an agreement. Periods
-- are generated lazily by the app the first time an agreement's ledger is
-- opened (one row per month from the agreement's start date through its end
-- date) rather than by a backend job — this project has no server-side cron.
-- See src/features/rent-ledger/hooks.ts.
--
-- Partial payments (confirmed in review): a shortfall never rolls into a
-- later period's `amount_due`. Every period always shows the full contracted
-- rent as due; the "Pending payments" list on the Rent Ledger screen is
-- computed on the fly from rows with status = 'partial' (amount_due -
-- amount_paid), not stored as its own table — there is nothing to keep in
-- sync that way.
--
-- Run this once in the Supabase SQL editor (or via the CLI) for this
-- project, after agreements.sql.

create table if not exists public.rent_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  agreement_id uuid not null references public.agreements (id) on delete cascade,

  -- The first day of the month this rent covers; also this period's due date
  -- in v1 (no separate "rent due day" field on the agreement yet).
  period_start date not null,
  amount_due numeric not null,

  status text not null default 'unpaid' check (status in ('unpaid', 'paid', 'partial')),
  amount_paid numeric,
  paid_at date,
  payment_mode text,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (agreement_id, period_start)
);

create index if not exists rent_ledger_entries_user_id_idx on public.rent_ledger_entries (user_id);
create index if not exists rent_ledger_entries_agreement_id_idx on public.rent_ledger_entries (agreement_id);

alter table public.rent_ledger_entries enable row level security;

drop policy if exists "Rent ledger entries are selectable by their creator" on public.rent_ledger_entries;
create policy "Rent ledger entries are selectable by their creator"
  on public.rent_ledger_entries for select
  using (auth.uid() = user_id);

drop policy if exists "Rent ledger entries are insertable by their creator" on public.rent_ledger_entries;
create policy "Rent ledger entries are insertable by their creator"
  on public.rent_ledger_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "Rent ledger entries are updatable by their creator" on public.rent_ledger_entries;
create policy "Rent ledger entries are updatable by their creator"
  on public.rent_ledger_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Rent ledger entries are deletable by their creator" on public.rent_ledger_entries;
create policy "Rent ledger entries are deletable by their creator"
  on public.rent_ledger_entries for delete
  using (auth.uid() = user_id);

drop trigger if exists rent_ledger_entries_set_updated_at on public.rent_ledger_entries;
create trigger rent_ledger_entries_set_updated_at
  before update on public.rent_ledger_entries
  for each row
  execute function public.set_updated_at();
