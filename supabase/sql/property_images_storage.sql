-- Property photos (BRD FR-2.x): one optional image per property, uploaded
-- by the owner of the account. Unlike legal-docs, this bucket is private —
-- each user must only be able to read, write, and delete their OWN photos,
-- never another account's.
--
-- Storage layout: every object's path is prefixed with the uploading
-- user's auth uid, e.g. `<user_id>/<property_id>.jpg`. Postgres RLS on
-- storage.objects then just has to check that the first path segment
-- (storage.foldername(name))[1] matches auth.uid() — this is the standard
-- Supabase pattern for per-user private storage.
--
-- The app never uses a public URL for this bucket (there isn't one, since
-- it's private) — it resolves `properties.image_path` to a short-lived
-- signed URL on read, which itself only succeeds if the requesting user
-- passes the SELECT policy below. See src/features/properties/image.ts.
--
-- Run this once in the Supabase SQL editor for this project, after
-- properties.sql.

insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', false)
on conflict (id) do update set public = false;

drop policy if exists "Users can read their own property images" on storage.objects;
create policy "Users can read their own property images"
  on storage.objects for select
  using (
    bucket_id = 'property-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can upload their own property images" on storage.objects;
create policy "Users can upload their own property images"
  on storage.objects for insert
  with check (
    bucket_id = 'property-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can replace their own property images" on storage.objects;
create policy "Users can replace their own property images"
  on storage.objects for update
  using (
    bucket_id = 'property-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'property-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete their own property images" on storage.objects;
create policy "Users can delete their own property images"
  on storage.objects for delete
  using (
    bucket_id = 'property-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
