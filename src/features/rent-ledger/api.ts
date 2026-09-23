import { addDays, todayIsoDate } from '@/features/agreements/calculations';
import type { Agreement } from '@/features/agreements/types';
import { supabase } from '@/lib/supabase';

import { generatePeriods } from './calculations';
import type { LedgerStatus, RecordPaymentInput, RentLedgerEntry } from './types';

type RentLedgerEntryRow = {
  id: string;
  user_id: string;
  agreement_id: string;
  period_start: string;
  amount_due: number;
  status: string;
  amount_paid: number | null;
  paid_at: string | null;
  payment_mode: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapEntry(row: RentLedgerEntryRow): RentLedgerEntry {
  return {
    id: row.id,
    userId: row.user_id,
    agreementId: row.agreement_id,
    periodStart: row.period_start,
    amountDue: row.amount_due,
    status: row.status as LedgerStatus,
    amountPaid: row.amount_paid,
    paidAt: row.paid_at,
    paymentMode: row.payment_mode,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function requireUserId(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return session.user.id;
}

/** Inserts any of the agreement's term periods that don't have a ledger row yet — a no-op once the full term's periods already exist. */
export async function ensurePeriodsGenerated(agreement: Agreement): Promise<void> {
  const periods = generatePeriods(agreement);
  if (periods.length === 0) return;
  const userId = await requireUserId();
  const { error } = await supabase
    .from('rent_ledger_entries')
    .upsert(
      periods.map((period) => ({
        user_id: userId,
        agreement_id: agreement.id,
        period_start: period.periodStart,
        amount_due: period.amountDue,
      })),
      { onConflict: 'agreement_id,period_start', ignoreDuplicates: true }
    );
  if (error) throw error;
}

export async function listLedgerEntries(agreementId: string): Promise<RentLedgerEntry[]> {
  const { data, error } = await supabase
    .from('rent_ledger_entries')
    .select('*')
    .eq('agreement_id', agreementId)
    .order('period_start');
  if (error) throw error;
  return (data as RentLedgerEntryRow[]).map(mapEntry);
}

export type UpcomingRentDue = { entry: RentLedgerEntry; propertyName: string };

/** Dashboard's "Upcoming rent" source — every unpaid period due within the next `windowDays` across every agreement on the account (including already-overdue ones), each with its property name via a Postgrest embed through agreements -> properties. */
export async function listUpcomingRentDue(windowDays = 31): Promise<UpcomingRentDue[]> {
  const { data, error } = await supabase
    .from('rent_ledger_entries')
    .select('*, agreements(properties(name))')
    .eq('status', 'unpaid')
    .lte('period_start', addDays(todayIsoDate(), windowDays))
    .order('period_start');
  if (error) throw error;
  return (data as (RentLedgerEntryRow & { agreements: { properties: { name: string } | null } | null })[]).map((row) => ({
    entry: mapEntry(row),
    propertyName: row.agreements?.properties?.name ?? 'Property',
  }));
}

export async function recordLedgerPayment(id: string, input: RecordPaymentInput): Promise<RentLedgerEntry> {
  const { data, error } = await supabase
    .from('rent_ledger_entries')
    .update({
      status: input.status,
      amount_paid: input.amountPaid,
      paid_at: input.paidAt,
      payment_mode: input.paymentMode,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapEntry(data as RentLedgerEntryRow);
}

export async function revertLedgerEntryToUnpaid(id: string): Promise<RentLedgerEntry> {
  const { data, error } = await supabase
    .from('rent_ledger_entries')
    .update({ status: 'unpaid', amount_paid: null, paid_at: null, payment_mode: null })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapEntry(data as RentLedgerEntryRow);
}
