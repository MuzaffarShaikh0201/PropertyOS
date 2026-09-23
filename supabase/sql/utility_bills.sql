-- Utility Bills (BRD FR-6.3): electricity, water, maintenance/society
-- charges and property tax, each with its own responsible party (owner or
-- tenant — BR-17, varies by negotiated terms, so it's recorded per bill
-- rather than assumed). Amounts are never a stored recurring figure — each
-- bill is entered fresh as it arrives (Screen 17), since these vary cycle to
-- cycle.
--
-- Partial payments (confirmed in review): same rule as the rent ledger — a
-- shortfall never rolls into the next bill. The "Pending payments" list is
-- computed on the fly from rows with status = 'partial', not its own table.
--
-- Run this once in the Supabase SQL editor (or via the CLI) for this
-- project, after properties.sql and agreements.sql.

create table if not exists public.utility_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  -- Nullable — a utility bill can exist on a self-occupied property with no
  -- agreement at all (e.g. property tax the owner pays directly).
  agreement_id uuid references public.agreements (id) on delete set null,

  bill_type text not null check (bill_type in ('electricity', 'water', 'maintenance', 'property_tax', 'other')),
  responsible_party text not null check (responsible_party in ('owner', 'tenant')),

  bill_date date not null,
  due_date date not null,
  amount numeric not null,

  status text not null default 'unpaid' check (status in ('unpaid', 'paid', 'partial')),
  amount_paid numeric,
  paid_at date,
  -- Path inside the private `utility-bill-proofs` storage bucket (see
  -- utility_bill_proofs_storage.sql), or null — the upload is optional.
  proof_document_path text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists utility_bills_user_id_idx on public.utility_bills (user_id);
create index if not exists utility_bills_property_id_idx on public.utility_bills (property_id);

alter table public.utility_bills enable row level security;

drop policy if exists "Utility bills are selectable by their creator" on public.utility_bills;
create policy "Utility bills are selectable by their creator"
  on public.utility_bills for select
  using (auth.uid() = user_id);

drop policy if exists "Utility bills are insertable by their creator" on public.utility_bills;
create policy "Utility bills are insertable by their creator"
  on public.utility_bills for insert
  with check (auth.uid() = user_id);

drop policy if exists "Utility bills are updatable by their creator" on public.utility_bills;
create policy "Utility bills are updatable by their creator"
  on public.utility_bills for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Utility bills are deletable by their creator" on public.utility_bills;
create policy "Utility bills are deletable by their creator"
  on public.utility_bills for delete
  using (auth.uid() = user_id);

drop trigger if exists utility_bills_set_updated_at on public.utility_bills;
create trigger utility_bills_set_updated_at
  before update on public.utility_bills
  for each row
  execute function public.set_updated_at();
