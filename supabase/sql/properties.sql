-- Property Registry (BRD FR-2.x): a rental property owned by one of the
-- account's Owner profiles. v1 is scoped to Maharashtra rental law, so state
-- is fixed rather than editable.
--
-- Run this once in the Supabase SQL editor (or via the CLI) for this project,
-- after owners.sql.

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  owner_id uuid not null references public.owners (id) on delete restrict,
  name text not null,
  property_type text not null,
  bhk text not null,
  area_sqft numeric,
  furnishing text not null,
  address_line1 text not null,
  locality text not null,
  city text not null,
  pincode text not null,
  state text not null default 'Maharashtra',
  -- Path of this property's photo inside the private `property-images`
  -- storage bucket (see property_images_storage.sql), or null to fall back
  -- to the app's default placeholder image. Never a public URL — the bucket
  -- is private, so the app resolves this to a short-lived signed URL.
  image_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe to re-run against a table created before image_path existed.
alter table public.properties add column if not exists image_path text;

-- Safe to re-run against a table created before occupancy_status existed.
-- Set explicitly, not derived: creating an agreement sets this to 'rented';
-- it stays 'rented' through On Notice and past an agreement's end date until
-- the owner explicitly picks "Mark property vacant" (BRD FR-3.2, confirmed
-- in review — ending a tenancy never silently flips occupancy).
alter table public.properties add column if not exists occupancy_status text not null default 'vacant';
alter table public.properties drop constraint if exists properties_occupancy_status_check;
alter table public.properties add constraint properties_occupancy_status_check
  check (occupancy_status in ('vacant', 'self_occupied', 'rented'));

create index if not exists properties_user_id_idx on public.properties (user_id);
create index if not exists properties_owner_id_idx on public.properties (owner_id);

alter table public.properties enable row level security;

drop policy if exists "Properties are selectable by their creator" on public.properties;
create policy "Properties are selectable by their creator"
  on public.properties for select
  using (auth.uid() = user_id);

drop policy if exists "Properties are insertable by their creator" on public.properties;
create policy "Properties are insertable by their creator"
  on public.properties for insert
  with check (auth.uid() = user_id);

drop policy if exists "Properties are updatable by their creator" on public.properties;
create policy "Properties are updatable by their creator"
  on public.properties for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Properties are deletable by their creator" on public.properties;
create policy "Properties are deletable by their creator"
  on public.properties for delete
  using (auth.uid() = user_id);

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
  before update on public.properties
  for each row
  execute function public.set_updated_at();
