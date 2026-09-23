-- Tenant Profiles (BRD FR-4.1): the Licensee on a Leave & License agreement.
-- Not reusable/searchable across agreements in v1 (confirmed in review) — each
-- agreement's tenant is entered fresh from the agreement wizard's Licensee
-- step, so this table has no link back to a property; the link lives on
-- agreements.tenant_id instead.
--
-- Run this once in the Supabase SQL editor (or via the CLI) for this project,
-- after owners.sql.

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  phone text not null,
  aadhaar_number text,
  pan_number text,
  permanent_address text not null,
  occupants_count integer not null default 1,
  emergency_contact_name text,
  emergency_contact_phone text,
  -- Path inside the private `tenant-photos` storage bucket (see
  -- tenant_photos_storage.sql), or null — photo capture is optional.
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tenants_user_id_idx on public.tenants (user_id);

alter table public.tenants enable row level security;

drop policy if exists "Tenants are selectable by their creator" on public.tenants;
create policy "Tenants are selectable by their creator"
  on public.tenants for select
  using (auth.uid() = user_id);

drop policy if exists "Tenants are insertable by their creator" on public.tenants;
create policy "Tenants are insertable by their creator"
  on public.tenants for insert
  with check (auth.uid() = user_id);

drop policy if exists "Tenants are updatable by their creator" on public.tenants;
create policy "Tenants are updatable by their creator"
  on public.tenants for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Tenants are deletable by their creator" on public.tenants;
create policy "Tenants are deletable by their creator"
  on public.tenants for delete
  using (auth.uid() = user_id);

drop trigger if exists tenants_set_updated_at on public.tenants;
create trigger tenants_set_updated_at
  before update on public.tenants
  for each row
  execute function public.set_updated_at();
