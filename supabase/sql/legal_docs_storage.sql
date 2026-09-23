-- Public, versioned legal content: Legal Config (Maharashtra compliance
-- reference), Terms of Service and Privacy Policy. Read-only from the app —
-- there's no admin UI yet, so new versions are uploaded manually to this
-- bucket. The app fetches everything by exact known path via the bucket's
-- public URL (which bypasses storage RLS for a public bucket), so no
-- storage.objects policy is needed or wanted here — a SELECT policy broad
-- enough to allow "fetch this known file" also allows "list everything in
-- the bucket" (RLS can't tell those apart), which is exactly what the
-- Supabase security advisor flags as "Clients can list all files in this
-- bucket". If you ran an earlier version of this script that created that
-- policy, this drops it.
--
-- Expected paths inside the bucket — each folder has a manifest.json saying
-- which dated version is current, plus one JSON file per version:
--   legal-config/maharashtra/manifest.json
--   legal-config/maharashtra/<YYYY-MM-DD>.json
--   terms/manifest.json
--   terms/<YYYY-MM-DD>.json
--   privacy/manifest.json
--   privacy/<YYYY-MM-DD>.json
--
-- To publish a new version: upload the new dated file, then edit that
-- folder's manifest.json — set "current" to the new date and append it to
-- "versions". Nothing else changes; no app code, no policy, no redeploy.
--
-- Run this once in the Supabase SQL editor for this project.

insert into storage.buckets (id, name, public)
values ('legal-docs', 'legal-docs', true)
on conflict (id) do nothing;

drop policy if exists "Public read access to legal-docs" on storage.objects;
