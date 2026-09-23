-- Tenant photos (BRD FR-4.1): one optional photo per tenant, captured on the
-- Add Tenant Profile screen. Private bucket, same per-user path-prefix RLS
-- pattern as property-images — see supabase/sql/property_images_storage.sql
-- for the rationale.
--
-- Storage layout: `<user_id>/<tenant_id>.<ext>`.
--
-- Run this once in the Supabase SQL editor for this project, after
-- tenants.sql.

insert into storage.buckets (id, name, public)
values ('tenant-photos', 'tenant-photos', false)
on conflict (id) do update set public = false;

drop policy if exists "Users can read their own tenant photos" on storage.objects;
create policy "Users can read their own tenant photos"
  on storage.objects for select
  using (
    bucket_id = 'tenant-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can upload their own tenant photos" on storage.objects;
create policy "Users can upload their own tenant photos"
  on storage.objects for insert
  with check (
    bucket_id = 'tenant-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can replace their own tenant photos" on storage.objects;
create policy "Users can replace their own tenant photos"
  on storage.objects for update
  using (
    bucket_id = 'tenant-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'tenant-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete their own tenant photos" on storage.objects;
create policy "Users can delete their own tenant photos"
  on storage.objects for delete
  using (
    bucket_id = 'tenant-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
