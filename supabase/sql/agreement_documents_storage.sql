-- Agreement documents (BRD FR-4.8-4.9): the document checklist captured on
-- New Agreement Step 3 and shown as the document vault on Agreement Detail
-- (signed/registered copy, tenant ID proof, witness ID records, police
-- verification). Private bucket, same per-user path-prefix RLS pattern as
-- property-images — see supabase/sql/property_images_storage.sql for the
-- rationale.
--
-- Storage layout: `<user_id>/<agreement_id>/<doc_type>.<ext>`.
--
-- Run this once in the Supabase SQL editor for this project, after
-- agreements.sql.

insert into storage.buckets (id, name, public)
values ('agreement-documents', 'agreement-documents', false)
on conflict (id) do update set public = false;

drop policy if exists "Users can read their own agreement documents" on storage.objects;
create policy "Users can read their own agreement documents"
  on storage.objects for select
  using (
    bucket_id = 'agreement-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can upload their own agreement documents" on storage.objects;
create policy "Users can upload their own agreement documents"
  on storage.objects for insert
  with check (
    bucket_id = 'agreement-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can replace their own agreement documents" on storage.objects;
create policy "Users can replace their own agreement documents"
  on storage.objects for update
  using (
    bucket_id = 'agreement-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'agreement-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete their own agreement documents" on storage.objects;
create policy "Users can delete their own agreement documents"
  on storage.objects for delete
  using (
    bucket_id = 'agreement-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
