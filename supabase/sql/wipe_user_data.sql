-- Wipes EVERY row this user owns across every app table — not just seed
-- data, all of it (their own real properties, owners, tenants, agreements,
-- rent ledger, utility bills and notifications). This is irreversible and
-- there is no confirmation prompt beyond you editing the email below — read
-- it before running it.
--
-- This does NOT touch their uploaded files (property photos, tenant photos,
-- agreement documents, utility bill proofs) — Supabase blocks direct SQL
-- deletes on storage.objects now ("Direct deletion from storage tables is
-- not allowed. Use the Storage API instead."), a platform-level safeguard
-- against orphaning references. Run scripts/wipe-user-storage.js for those,
-- either before or after this script — the two don't depend on each other.
--
-- Use this to fully reset a test account. For removing only what
-- seed_data.sql created (leaving any of your own real data alone), use
-- seed_data_cleanup.sql instead.
--
-- BEFORE RUNNING: replace the email with the account to wipe.

do $$
declare
  v_user_email text := 'REPLACE_WITH_YOUR_LOGIN_EMAIL';
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_user_email;
  if v_user_id is null then
    raise exception 'No auth user found with email %.', v_user_email;
  end if;

  -- Breaks the self-referencing renewal chain (agreement -> previous
  -- agreement) first, so the agreements delete below isn't order-sensitive.
  update public.agreements set previous_agreement_id = null where user_id = v_user_id;

  delete from public.notifications where user_id = v_user_id;
  delete from public.rent_ledger_entries where user_id = v_user_id;
  delete from public.utility_bills where user_id = v_user_id;
  delete from public.agreements where user_id = v_user_id;
  delete from public.tenants where user_id = v_user_id;
  delete from public.properties where user_id = v_user_id;
  delete from public.owners where user_id = v_user_id;

  raise notice 'Wiped all app data for % (user id %). Run scripts/wipe-user-storage.js separately for their uploaded files.', v_user_email, v_user_id;
end $$;
