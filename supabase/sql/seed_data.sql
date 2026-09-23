-- Seed data for manual testing — NOT part of the schema. Creates a small,
-- realistic dataset under your own account: 2 owners, 4 properties (one
-- vacant, three rented), 3 tenants, 3 agreements covering Active/On Notice/
-- Ended, a mixed rent ledger (paid, partial, late, due-today, upcoming),
-- and a few utility bills (paid, unpaid, overdue, partial).
--
-- Run this ONCE, after every other supabase/sql/*.sql script has been run
-- (owners, properties, tenants, agreements, rent_ledger, utility_bills,
-- notifications — schema + storage buckets all need to already exist).
--
-- BEFORE RUNNING: replace the email below with the address you log into the
-- app with. This looks up your existing Supabase Auth user by email — it
-- does not create one. If no matching user is found, the whole script does
-- nothing (and raises a clear error) rather than silently seeding nobody's
-- account.
--
-- To remove this data later, run seed_data_cleanup.sql (same email).

do $$
declare
  v_user_email text := 'REPLACE_WITH_YOUR_LOGIN_EMAIL';
  v_user_id uuid;

  v_owner1_id uuid;
  v_owner2_id uuid;

  v_property1_id uuid; -- vacant
  v_property2_id uuid; -- active, registered
  v_property3_id uuid; -- on notice, unregistered
  v_property4_id uuid; -- ended, past term

  v_tenant1_id uuid;
  v_tenant2_id uuid;
  v_tenant3_id uuid;

  v_agreement1_id uuid;
  v_agreement2_id uuid;
  v_agreement3_id uuid;

  v_legal_config jsonb := '{
    "version": "2026.1",
    "state": "Maharashtra",
    "lastUpdated": "2026-09-12",
    "registration": {
      "summary": "Mandatory for every Leave & License agreement, regardless of duration — including 11-month terms.",
      "windowMonths": 4,
      "dutyOn": "licensor",
      "nonRegistrationRisk": "Non-registration risks inadmissibility as evidence and a fine up to ₹5,000."
    },
    "maxTenureMonths": 60,
    "stampDuty": {
      "formula": "0.25% of total rent over the license period + 0.25% of a notional 10% p.a. interest on the refundable deposit"
    },
    "witnessesRequired": 2,
    "policeVerification": {
      "summary": "Recommended, not system-enforced.",
      "note": "Online verification is available via the Maharashtra Police citizen portal."
    },
    "disclaimer": "This is guidance, not legal advice. Review against the current Maharashtra Rent Control Act, 1999 and any amendments, or a qualified legal professional, before relying on it."
  }'::jsonb;

  -- Same content, but pinned under a deliberately stale version — this is
  -- what makes Alerts show a "Legal Config updated" notification for
  -- Agreement 2, demonstrating that notification type without needing a
  -- second real historical law-content file.
  v_legal_config_stale jsonb;
begin
  select id into v_user_id from auth.users where email = v_user_email;
  if v_user_id is null then
    raise exception 'No auth user found with email %. Edit v_user_email at the top of this script first.', v_user_email;
  end if;

  v_legal_config_stale := jsonb_set(v_legal_config, '{version}', '"2025.1"'::jsonb);

  -- Owners ------------------------------------------------------------
  insert into public.owners (user_id, name, relation, phone, aadhaar_number, pan_number)
  values (v_user_id, 'Rajesh Sharma', 'Self', '+919876500001', '123456789012', 'ABCDE1234F')
  returning id into v_owner1_id;

  insert into public.owners (user_id, name, relation, phone, aadhaar_number, pan_number)
  values (v_user_id, 'Sunita Sharma', 'Mother', '+919876500002', '234567890123', 'BCDEF2345G')
  returning id into v_owner2_id;

  -- Properties ----------------------------------------------------------
  insert into public.properties
    (user_id, owner_id, name, property_type, bhk, area_sqft, furnishing, address_line1, locality, city, pincode, occupancy_status)
  values
    (v_user_id, v_owner1_id, 'A-402, Sunshine CHS', 'apartment', '2_bhk', 650, 'semi_furnished', 'Sunshine CHS, A-402', 'Powai', 'Mumbai', '400076', 'vacant')
  returning id into v_property1_id;

  insert into public.properties
    (user_id, owner_id, name, property_type, bhk, area_sqft, furnishing, address_line1, locality, city, pincode, occupancy_status)
  values
    (v_user_id, v_owner1_id, 'B-101, Palm Residency', 'apartment', '1_bhk', 450, 'fully_furnished', 'Palm Residency, B-101', 'Andheri West', 'Mumbai', '400058', 'rented')
  returning id into v_property2_id;

  insert into public.properties
    (user_id, owner_id, name, property_type, bhk, area_sqft, furnishing, address_line1, locality, city, pincode, occupancy_status)
  values
    (v_user_id, v_owner2_id, 'Shop No. 5, Market Complex', 'commercial', 'other', 300, 'unfurnished', 'Market Complex, Shop 5', 'Naupada', 'Thane', '400602', 'rented')
  returning id into v_property3_id;

  insert into public.properties
    (user_id, owner_id, name, property_type, bhk, area_sqft, furnishing, address_line1, locality, city, pincode, occupancy_status)
  values
    (v_user_id, v_owner2_id, 'C-204, Green Meadows', 'apartment', '2_bhk', 720, 'unfurnished', 'Green Meadows, C-204', 'Vashi', 'Navi Mumbai', '400703', 'rented')
  returning id into v_property4_id;

  -- Tenants ---------------------------------------------------------------
  insert into public.tenants (user_id, name, phone, aadhaar_number, pan_number, permanent_address, occupants_count, emergency_contact_name, emergency_contact_phone)
  values (v_user_id, 'Amit Verma', '+919876511001', '345678901234', 'CDEFG3456H', '12 MG Road, Pune, Maharashtra 411001', 2, 'Sanjay Verma', '+919876511099')
  returning id into v_tenant1_id;

  insert into public.tenants (user_id, name, phone, aadhaar_number, pan_number, permanent_address, occupants_count, emergency_contact_name, emergency_contact_phone)
  values (v_user_id, 'Priya Nair', '+919876511002', '456789012345', 'DEFGH4567I', '45 Church Street, Bengaluru, Karnataka 560001', 1, 'Ramesh Nair', '+919876511098')
  returning id into v_tenant2_id;

  insert into public.tenants (user_id, name, phone, aadhaar_number, pan_number, permanent_address, occupants_count)
  values (v_user_id, 'Vikram Rao', '+919876511003', '567890123456', 'EFGHI5678J', '78 Anna Salai, Chennai, Tamil Nadu 600002', 3)
  returning id into v_tenant3_id;

  -- Agreement 1 — Active, registered, on Property 2 (Amit Verma) -----------
  insert into public.agreements (
    user_id, property_id, tenant_id, status,
    start_date, end_date, lock_in_months, notice_period_days,
    monthly_rent, security_deposit, escalation_percent, escalation_frequency, auto_renewal,
    witness1_name, witness1_phone, witness2_name, witness2_phone, police_verification_done,
    legal_config_version, legal_config_snapshot, stamp_duty_estimate,
    registered_at
  ) values (
    v_user_id, v_property2_id, v_tenant1_id, 'active',
    '2026-01-23', '2027-01-23', 6, 30,
    25000, 100000, null, 'none', false,
    'Deepak Joshi', '+919876522001', 'Meena Kulkarni', '+919876522002', true,
    '2026.1', v_legal_config, 775,
    '2026-02-15 10:00:00+05:30'
  ) returning id into v_agreement1_id;

  -- Agreement 2 — On Notice, unregistered, on Property 3 (Priya Nair) ------
  insert into public.agreements (
    user_id, property_id, tenant_id, status,
    start_date, end_date, lock_in_months, notice_period_days,
    monthly_rent, security_deposit, escalation_percent, escalation_frequency, auto_renewal,
    police_verification_done,
    legal_config_version, legal_config_snapshot, stamp_duty_estimate,
    notice_raised_by, notice_date, expected_vacate_date, notice_note
  ) values (
    v_user_id, v_property3_id, v_tenant2_id, 'on_notice',
    '2025-11-01', '2026-11-01', null, 30,
    18000, 72000, null, 'none', false,
    false,
    '2025.1', v_legal_config_stale, 558,
    'tenant', '2026-09-10', '2026-10-10', 'Relocating for work.'
  ) returning id into v_agreement2_id;

  -- Agreement 3 — term ended, not yet vacated/renewed, on Property 4 -------
  insert into public.agreements (
    user_id, property_id, tenant_id, status,
    start_date, end_date, lock_in_months, notice_period_days,
    monthly_rent, security_deposit, escalation_percent, escalation_frequency, auto_renewal,
    police_verification_done,
    legal_config_version, legal_config_snapshot, stamp_duty_estimate,
    registered_at
  ) values (
    v_user_id, v_property4_id, v_tenant3_id, 'active',
    '2025-06-01', '2026-06-01', null, 60,
    30000, 150000, null, 'none', false,
    false,
    '2026.1', v_legal_config, 938,
    '2025-06-20 10:00:00+05:30'
  ) returning id into v_agreement3_id;

  -- Rent ledger for Agreement 1 — a full 12-period term with a deliberate
  -- mix of statuses. The app would normally generate these itself the first
  -- time the ledger is opened (or right at agreement creation, going
  -- forward) — they're hand-seeded here so the ledger already has history
  -- to look at immediately.
  insert into public.rent_ledger_entries (user_id, agreement_id, period_start, amount_due, status, amount_paid, paid_at, payment_mode)
  values
    (v_user_id, v_agreement1_id, '2026-01-23', 25000, 'paid', 25000, '2026-01-25', 'UPI'),
    (v_user_id, v_agreement1_id, '2026-02-23', 25000, 'paid', 25000, '2026-02-24', 'UPI'),
    (v_user_id, v_agreement1_id, '2026-03-23', 25000, 'paid', 25000, '2026-03-23', 'Bank transfer'),
    (v_user_id, v_agreement1_id, '2026-04-23', 25000, 'paid', 25000, '2026-04-26', 'UPI'),
    (v_user_id, v_agreement1_id, '2026-05-23', 25000, 'paid', 25000, '2026-05-23', 'Cash'),
    (v_user_id, v_agreement1_id, '2026-06-23', 25000, 'paid', 25000, '2026-06-25', 'UPI'),
    (v_user_id, v_agreement1_id, '2026-07-23', 25000, 'partial', 20000, '2026-07-28', 'UPI'),
    (v_user_id, v_agreement1_id, '2026-08-23', 25000, 'unpaid', null, null, null),
    (v_user_id, v_agreement1_id, '2026-09-23', 25000, 'unpaid', null, null, null),
    (v_user_id, v_agreement1_id, '2026-10-23', 25000, 'unpaid', null, null, null),
    (v_user_id, v_agreement1_id, '2026-11-23', 25000, 'unpaid', null, null, null),
    (v_user_id, v_agreement1_id, '2026-12-23', 25000, 'unpaid', null, null, null)
  on conflict (agreement_id, period_start) do nothing;

  -- Agreements 2 and 3 deliberately have no pre-seeded ledger rows — opening
  -- their property's Rent Ledger tab for the first time exercises the app's
  -- own lazy period-generation instead.

  -- Utility bills -----------------------------------------------------------
  insert into public.utility_bills (user_id, property_id, agreement_id, bill_type, responsible_party, bill_date, due_date, amount, status, amount_paid, paid_at)
  values
    (v_user_id, v_property2_id, v_agreement1_id, 'electricity', 'tenant', '2026-09-01', '2026-09-15', 2400, 'unpaid', null, null),
    (v_user_id, v_property2_id, v_agreement1_id, 'water', 'owner', '2026-08-01', '2026-08-15', 600, 'paid', 600, '2026-08-10'),
    (v_user_id, v_property3_id, v_agreement2_id, 'maintenance', 'tenant', '2026-09-10', '2026-09-30', 3200, 'unpaid', null, null),
    (v_user_id, v_property4_id, v_agreement3_id, 'property_tax', 'owner', '2026-07-01', '2026-07-31', 18000, 'partial', 10000, '2026-07-20');

  raise notice 'Seed data created for %: owners %, %; properties %, %, %, %; agreements %, %, %.',
    v_user_email, v_owner1_id, v_owner2_id, v_property1_id, v_property2_id, v_property3_id, v_property4_id,
    v_agreement1_id, v_agreement2_id, v_agreement3_id;
end $$;
