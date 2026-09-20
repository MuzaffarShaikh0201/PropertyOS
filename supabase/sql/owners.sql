-- Owner Profiles (BRD FR-1.1–1.4): the legal owner of a property, who may be
-- the App User themselves or a relative, reusable across any number of
-- properties on one account.
--
-- Run this once in the Supabase SQL editor (or via the CLI) for this project.

create table if not exists public.owners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  relation text not null,
  phone text not null,
  email text,
  -- Not required at creation — only required before this owner's profile can
  -- be used as Licensor on an agreement (BRD FR-1.4).
  aadhaar_number text,
  pan_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists owners_user_id_idx on public.owners (user_id);

alter table public.owners enable row level security;

create policy "Owners are selectable by their creator"
  on public.owners for select
  using (auth.uid() = user_id);

create policy "Owners are insertable by their creator"
  on public.owners for insert
  with check (auth.uid() = user_id);

create policy "Owners are updatable by their creator"
  on public.owners for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Owners are deletable by their creator"
  on public.owners for delete
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists owners_set_updated_at on public.owners;
create trigger owners_set_updated_at
  before update on public.owners
  for each row
  execute function public.set_updated_at();
