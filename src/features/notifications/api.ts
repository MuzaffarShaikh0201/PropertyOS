import { addDays, computeRegistrationDeadline, daysUntil, formatInr, todayIsoDate } from '@/features/agreements/calculations';
import * as agreementsApi from '@/features/agreements/api';
import { fetchLatestContent } from '@/features/legal-content/storage';
import type { LegalConfig } from '@/features/legal-content/types';
import { billTypeLabel } from '@/features/utility-bills/types';
import { supabase } from '@/lib/supabase';

import type { AppNotification, NotificationType } from './types';

const COMPLIANCE_WINDOW_DAYS = 30;
const DUE_SOON_WINDOW_DAYS = 7;

type NotificationRow = {
  id: string;
  type: NotificationType;
  read_at: string | null;
  created_at: string;
  related_agreement_id: string | null;
  related_ledger_entry_id: string | null;
  related_bill_id: string | null;
  agreements: {
    start_date: string;
    legal_config_version: string;
    legal_config_snapshot: LegalConfig;
    properties: { name: string } | null;
  } | null;
  rent_ledger_entries: {
    agreement_id: string;
    period_start: string;
    amount_due: number;
    agreements: { properties: { name: string } | null } | null;
  } | null;
  utility_bills: {
    bill_type: string;
    amount: number;
    due_date: string;
    properties: { name: string } | null;
  } | null;
};

const SELECT_WITH_RELATIONS = `
  id, type, read_at, created_at, related_agreement_id, related_ledger_entry_id, related_bill_id,
  agreements ( start_date, legal_config_version, legal_config_snapshot, properties ( name ) ),
  rent_ledger_entries ( agreement_id, period_start, amount_due, agreements ( properties ( name ) ) ),
  utility_bills ( bill_type, amount, due_date, properties ( name ) )
`;

function mapNotification(row: NotificationRow): AppNotification {
  const base = { id: row.id, type: row.type, readAt: row.read_at, createdAt: row.created_at };

  switch (row.type) {
    case 'compliance_deadline': {
      const agreement = row.agreements!;
      const propertyName = agreement.properties?.name ?? 'Property';
      const deadline = computeRegistrationDeadline(
        agreement.start_date,
        agreement.legal_config_snapshot.registration.windowMonths
      );
      return {
        ...base,
        title: 'Registration due',
        message: `${propertyName}'s registration is due ${deadline}.`,
        route: { pathname: '/agreements/[id]', params: { id: row.related_agreement_id! } },
      };
    }
    case 'legal_update': {
      const agreement = row.agreements!;
      const propertyName = agreement.properties?.name ?? 'Property';
      return {
        ...base,
        title: 'Legal Config updated',
        message: `Maharashtra rental law has changed since ${propertyName}'s agreement was created (pinned v${agreement.legal_config_version}).`,
        route: { pathname: '/legal-config' },
      };
    }
    case 'rent_due':
    case 'rent_paid': {
      const entry = row.rent_ledger_entries!;
      const propertyName = entry.agreements?.properties?.name ?? 'Property';
      return {
        ...base,
        title: row.type === 'rent_due' ? 'Rent due' : 'Rent marked paid',
        message:
          row.type === 'rent_due'
            ? `${propertyName}: ${formatInr(entry.amount_due)} due for ${entry.period_start}.`
            : `${propertyName}: ${formatInr(entry.amount_due)} for ${entry.period_start} marked paid.`,
        route: { pathname: '/agreements/[id]', params: { id: entry.agreement_id } },
      };
    }
    case 'bill_due':
    case 'bill_paid': {
      const bill = row.utility_bills!;
      const propertyName = bill.properties?.name ?? 'Property';
      return {
        ...base,
        title: row.type === 'bill_due' ? 'Utility bill due' : 'Utility bill paid',
        message:
          row.type === 'bill_due'
            ? `${propertyName}: ${billTypeLabel(bill.bill_type)} bill of ${formatInr(bill.amount)} due ${bill.due_date}.`
            : `${propertyName}: ${billTypeLabel(bill.bill_type)} bill marked paid.`,
        route: { pathname: '/bills/[id]', params: { id: row.related_bill_id! } },
      };
    }
  }
}

async function requireUserId(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return session.user.id;
}

export async function listNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(SELECT_WITH_RELATIONS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as NotificationRow[]).map(mapNotification);
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .is('read_at', null);
  if (error) throw error;
}

/** Inserted directly at the moment a rent period is marked fully paid — a real one-time event, not something to scan for. */
export async function recordRentPaidNotification(ledgerEntryId: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from('notifications')
    .upsert([{ user_id: userId, type: 'rent_paid', related_ledger_entry_id: ledgerEntryId }], {
      onConflict: 'user_id,type,related_ledger_entry_id',
      ignoreDuplicates: true,
    });
  if (error) throw error;
}

/** Inserted directly at the moment a utility bill is recorded/updated as fully paid. */
export async function recordBillPaidNotification(billId: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from('notifications')
    .upsert([{ user_id: userId, type: 'bill_paid', related_bill_id: billId }], {
      onConflict: 'user_id,type,related_bill_id',
      ignoreDuplicates: true,
    });
  if (error) throw error;
}

/**
 * Scans for anything currently due soon and inserts a reminder for whatever
 * doesn't already have one — safe to call on every Alerts visit, since the
 * partial unique indexes in notifications.sql make every insert here a
 * no-op once that agreement/period/bill has already been notified about.
 */
export async function ensureReminderNotifications(): Promise<void> {
  const userId = await requireUserId();
  const today = todayIsoDate();

  const unregistered = await agreementsApi.listUnregisteredAgreements();
  const complianceAgreementIds = unregistered
    .filter(
      (agreement) =>
        daysUntil(computeRegistrationDeadline(agreement.startDate, agreement.legalConfigSnapshot.registration.windowMonths)) <=
        COMPLIANCE_WINDOW_DAYS
    )
    .map((agreement) => agreement.id);
  if (complianceAgreementIds.length > 0) {
    const { error } = await supabase.from('notifications').upsert(
      complianceAgreementIds.map((id) => ({ user_id: userId, type: 'compliance_deadline', related_agreement_id: id })),
      { onConflict: 'user_id,type,related_agreement_id', ignoreDuplicates: true }
    );
    if (error) throw error;
  }

  // Legal-update reminders check every still-relevant agreement, not just
  // unregistered ones — the law can change after registration too.
  const { data: liveAgreements, error: liveError } = await supabase
    .from('agreements')
    .select('id, legal_config_version')
    .in('status', ['active', 'on_notice']);
  if (liveError) throw liveError;

  let latestVersion: string | null = null;
  try {
    latestVersion = (await fetchLatestContent<LegalConfig>('legal-config/maharashtra')).version;
  } catch {
    // Not critical-path for the rest of the reminder scan.
  }
  if (latestVersion) {
    const outdatedAgreementIds = (liveAgreements ?? [])
      .filter((agreement) => agreement.legal_config_version !== latestVersion)
      .map((agreement) => agreement.id);
    if (outdatedAgreementIds.length > 0) {
      const { error } = await supabase.from('notifications').upsert(
        outdatedAgreementIds.map((id) => ({ user_id: userId, type: 'legal_update', related_agreement_id: id })),
        { onConflict: 'user_id,type,related_agreement_id', ignoreDuplicates: true }
      );
      if (error) throw error;
    }
  }

  const { data: dueLedgerEntries, error: ledgerError } = await supabase
    .from('rent_ledger_entries')
    .select('id')
    .eq('status', 'unpaid')
    .lte('period_start', addDays(today, DUE_SOON_WINDOW_DAYS));
  if (ledgerError) throw ledgerError;
  if (dueLedgerEntries && dueLedgerEntries.length > 0) {
    const { error } = await supabase.from('notifications').upsert(
      dueLedgerEntries.map((entry) => ({ user_id: userId, type: 'rent_due', related_ledger_entry_id: entry.id })),
      { onConflict: 'user_id,type,related_ledger_entry_id', ignoreDuplicates: true }
    );
    if (error) throw error;
  }

  const { data: dueBills, error: billsError } = await supabase
    .from('utility_bills')
    .select('id')
    .neq('status', 'paid')
    .lte('due_date', addDays(today, DUE_SOON_WINDOW_DAYS));
  if (billsError) throw billsError;
  if (dueBills && dueBills.length > 0) {
    const { error } = await supabase.from('notifications').upsert(
      dueBills.map((bill) => ({ user_id: userId, type: 'bill_due', related_bill_id: bill.id })),
      { onConflict: 'user_id,type,related_bill_id', ignoreDuplicates: true }
    );
    if (error) throw error;
  }
}
