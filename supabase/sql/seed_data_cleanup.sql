-- Removes exactly the rows created by seed_data.sql, and nothing else — every
-- delete below is scoped to the specific owner/tenant phone numbers that
-- script used as markers, never a blanket "delete everything for this user"
-- statement. Safe to run even if you've since added your own real data
-- alongside the seed data.
--
-- BEFORE RUNNING: use the same email you seeded with.

do $$
declare
  v_user_email text := 'REPLACE_WITH_YOUR_LOGIN_EMAIL';
  v_user_id uuid;
  v_owner_ids uuid[];
  v_tenant_ids uuid[];
  v_property_ids uuid[];
  v_agreement_ids uuid[];
begin
  select id into v_user_id from auth.users where email = v_user_email;
  if v_user_id is null then
    raise exception 'No auth user found with email %.', v_user_email;
  end if;

  select array_agg(id) into v_owner_ids from public.owners
    where user_id = v_user_id and phone in ('+919876500001', '+919876500002');

  select array_agg(id) into v_tenant_ids from public.tenants
    where user_id = v_user_id and phone in ('+919876511001', '+919876511002', '+919876511003');

  select array_agg(id) into v_property_ids from public.properties
    where user_id = v_user_id and owner_id = any (v_owner_ids);

  select array_agg(id) into v_agreement_ids from public.agreements
    where user_id = v_user_id and property_id = any (v_property_ids);

  delete from public.notifications
    where user_id = v_user_id
      and (related_agreement_id = any (v_agreement_ids)
        or related_ledger_entry_id in (select id from public.rent_ledger_entries where agreement_id = any (v_agreement_ids))
        or related_bill_id in (select id from public.utility_bills where property_id = any (v_property_ids)));

  delete from public.rent_ledger_entries where agreement_id = any (v_agreement_ids);
  delete from public.utility_bills where property_id = any (v_property_ids);
  delete from public.agreements where id = any (v_agreement_ids);
  delete from public.properties where id = any (v_property_ids);
  delete from public.tenants where id = any (v_tenant_ids);
  delete from public.owners where id = any (v_owner_ids);

  raise notice 'Removed seed data for %: % owners, % properties, % tenants, % agreements.',
    v_user_email, coalesce(array_length(v_owner_ids, 1), 0), coalesce(array_length(v_property_ids, 1), 0),
    coalesce(array_length(v_tenant_ids, 1), 0), coalesce(array_length(v_agreement_ids, 1), 0);
end $$;
