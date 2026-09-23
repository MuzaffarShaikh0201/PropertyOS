-- Notifications Center (BRD FR-7.2 / FR-7.3, Screen 14): the reminder feed
-- behind the Dashboard's "Needs your attention" summary. This project has no
-- server-side cron, so nothing pushes these — the app generates them itself,
-- opportunistically:
--   - "due soon" reminders (compliance_deadline, rent_due, bill_due,
--     legal_update) are scanned for and inserted the moment someone opens
--     the Alerts screen (see ensureReminderNotifications in
--     src/features/notifications/api.ts) — a no-op once already generated,
--     thanks to the partial unique indexes below.
--   - "completed action" notifications (rent_paid, bill_paid) are inserted
--     directly at the moment a payment is recorded (see the Finance screen
--     and Record Utility Bill), since those are real one-time events rather
--     than something to scan for.
--
-- Deliberately minimal columns: no stored title/message text. The display
-- copy is composed at read time from whichever related row is joined in
-- (see listNotifications) — the same "derive, don't duplicate" approach used
-- for every other computed status in this app (Ended, Late, Overdue, ...).
-- This also means a notification never goes stale if the property/agreement
-- it's about is renamed later.
--
-- Run this once in the Supabase SQL editor (or via the CLI) for this
-- project, after agreements.sql, rent_ledger.sql and utility_bills.sql.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  type text not null check (
    type in ('compliance_deadline', 'rent_due', 'bill_due', 'rent_paid', 'bill_paid', 'legal_update')
  ),

  -- Exactly one of these three is set, depending on `type`.
  related_agreement_id uuid references public.agreements (id) on delete cascade,
  related_ledger_entry_id uuid references public.rent_ledger_entries (id) on delete cascade,
  related_bill_id uuid references public.utility_bills (id) on delete cascade,

  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- One reminder per (type, related row) ever — generation upserts against
-- these and ignores conflicts, so re-scanning on every Alerts visit is safe.
create unique index if not exists notifications_unique_agreement_type
  on public.notifications (user_id, type, related_agreement_id) where related_agreement_id is not null;
create unique index if not exists notifications_unique_ledger_entry_type
  on public.notifications (user_id, type, related_ledger_entry_id) where related_ledger_entry_id is not null;
create unique index if not exists notifications_unique_bill_type
  on public.notifications (user_id, type, related_bill_id) where related_bill_id is not null;

create index if not exists notifications_user_id_created_at_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Notifications are selectable by their owner" on public.notifications;
create policy "Notifications are selectable by their owner"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Notifications are insertable by their owner" on public.notifications;
create policy "Notifications are insertable by their owner"
  on public.notifications for insert
  with check (auth.uid() = user_id);

drop policy if exists "Notifications are updatable by their owner" on public.notifications;
create policy "Notifications are updatable by their owner"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Notifications are deletable by their owner" on public.notifications;
create policy "Notifications are deletable by their owner"
  on public.notifications for delete
  using (auth.uid() = user_id);
