-- Agreements (BRD FR-4.x): a Leave & License tenancy on one property, between
-- that property's Owner Profile (Licensor) and a fresh Tenant Profile
-- (Licensee). v1 is scoped to Maharashtra, so the Legal Config used to
-- compute registration/stamp-duty numbers is captured as a full snapshot at
-- creation time (`legal_config_snapshot`) rather than a version pointer —
-- confirmed in review: a later law update must never recompute an existing
-- agreement's numbers, so the agreement must not depend on that version's
-- file still existing or reading the same way later.
--
-- Lifecycle (confirmed in review): active -> on_notice -> ended | renewed.
-- "Ended" also has a derived, unstored form: once `end_date` has passed with
-- no explicit action, the app displays the agreement as Ended even while
-- `status` is still 'active' — nothing here flips automatically. `status`
-- only changes to 'ended' or 'renewed' when the owner explicitly picks
-- "Mark property vacant" or "Renew with same tenant". A renewal is always a
-- new row (`previous_agreement_id` points back at the one it replaced) —
-- never an extension of the old one's end date.
--
-- Run this once in the Supabase SQL editor (or via the CLI) for this
-- project, after properties.sql and tenants.sql.

create table if not exists public.agreements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete restrict,
  tenant_id uuid not null references public.tenants (id) on delete restrict,

  status text not null default 'active'
    check (status in ('active', 'on_notice', 'ended', 'renewed')),

  start_date date not null,
  end_date date not null,
  lock_in_months integer,
  notice_period_days integer not null,
  monthly_rent numeric not null,
  security_deposit numeric not null,
  escalation_percent numeric,
  escalation_frequency text check (escalation_frequency in ('none', 'annual')),
  auto_renewal boolean not null default false,

  witness1_name text,
  witness1_phone text,
  witness2_name text,
  witness2_phone text,
  police_verification_done boolean not null default false,

  -- Pinned at creation — see note above. `legal_config_version` is kept
  -- alongside purely as a display label (e.g. "2026.1"); every number shown
  -- on this agreement is read from the snapshot, never re-fetched.
  legal_config_version text not null,
  legal_config_snapshot jsonb not null,
  stamp_duty_estimate numeric,

  registered_at timestamptz,

  notice_raised_by text check (notice_raised_by in ('owner', 'tenant')),
  notice_date date,
  expected_vacate_date date,
  notice_note text,

  previous_agreement_id uuid references public.agreements (id),

  -- One entry per checklist item from the New Agreement wizard's Step 3 /
  -- the Agreement Detail document vault, e.g.
  -- {"signed_agreement": {"path": "...", "uploadedAt": "..."}, ...}
  documents jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe to re-run against a table created before witnesses were captured by
-- phone number instead of an ID reference — a no-op once already renamed.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'agreements' and column_name = 'witness1_id_ref'
  ) then
    alter table public.agreements rename column witness1_id_ref to witness1_phone;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'agreements' and column_name = 'witness2_id_ref'
  ) then
    alter table public.agreements rename column witness2_id_ref to witness2_phone;
  end if;
end $$;

create index if not exists agreements_user_id_idx on public.agreements (user_id);
create index if not exists agreements_property_id_idx on public.agreements (property_id);
create index if not exists agreements_tenant_id_idx on public.agreements (tenant_id);
create index if not exists agreements_previous_agreement_id_idx on public.agreements (previous_agreement_id);

alter table public.agreements enable row level security;

drop policy if exists "Agreements are selectable by their creator" on public.agreements;
create policy "Agreements are selectable by their creator"
  on public.agreements for select
  using (auth.uid() = user_id);

drop policy if exists "Agreements are insertable by their creator" on public.agreements;
create policy "Agreements are insertable by their creator"
  on public.agreements for insert
  with check (auth.uid() = user_id);

drop policy if exists "Agreements are updatable by their creator" on public.agreements;
create policy "Agreements are updatable by their creator"
  on public.agreements for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Agreements are deletable by their creator" on public.agreements;
create policy "Agreements are deletable by their creator"
  on public.agreements for delete
  using (auth.uid() = user_id);

drop trigger if exists agreements_set_updated_at on public.agreements;
create trigger agreements_set_updated_at
  before update on public.agreements
  for each row
  execute function public.set_updated_at();
