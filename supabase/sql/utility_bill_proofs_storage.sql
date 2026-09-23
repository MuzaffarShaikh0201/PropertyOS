-- Utility bill payment proofs (BRD FR-6.3 / Screen 17): an optional
-- receipt/screenshot uploaded when recording a bill. Private bucket, same
-- per-user path-prefix RLS pattern as property-images — see
-- supabase/sql/property_images_storage.sql for the rationale.
--
-- Storage layout: `<user_id>/<utility_bill_id>.<ext>`.
--
-- Run this once in the Supabase SQL editor for this project, after
-- utility_bills.sql.

insert into storage.buckets (id, name, public)
values ('utility-bill-proofs', 'utility-bill-proofs', false)
on conflict (id) do update set public = false;

drop policy if exists "Users can read their own utility bill proofs" on storage.objects;
create policy "Users can read their own utility bill proofs"
  on storage.objects for select
  using (
    bucket_id = 'utility-bill-proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can upload their own utility bill proofs" on storage.objects;
create policy "Users can upload their own utility bill proofs"
  on storage.objects for insert
  with check (
    bucket_id = 'utility-bill-proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can replace their own utility bill proofs" on storage.objects;
create policy "Users can replace their own utility bill proofs"
  on storage.objects for update
  using (
    bucket_id = 'utility-bill-proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'utility-bill-proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete their own utility bill proofs" on storage.objects;
create policy "Users can delete their own utility bill proofs"
  on storage.objects for delete
  using (
    bucket_id = 'utility-bill-proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
