import { todayIsoDate } from '@/features/agreements/calculations';

import type { LedgerDisplayStatus, LedgerStatus, RentLedgerEntry } from './types';

/** 'late' is never stored — an 'unpaid' row past its due date is shown as Late, exactly like an agreement past its end date is shown as Ended (see features/agreements/lifecycle.ts). */
export function getLedgerDisplayStatus(entry: Pick<RentLedgerEntry, 'status' | 'periodStart'>): LedgerDisplayStatus {
  if (entry.status !== 'unpaid') return entry.status;
  return entry.periodStart < todayIsoDate() ? 'late' : 'unpaid';
}

export const LEDGER_STATUS_LABELS: Record<LedgerDisplayStatus, string> = {
  unpaid: 'Unpaid',
  paid: 'Paid',
  partial: 'Partial',
  late: 'Late',
};

export function ledgerShortfall(entry: Pick<RentLedgerEntry, 'status' | 'amountDue' | 'amountPaid'>): number {
  if (entry.status !== 'partial') return 0;
  return entry.amountDue - (entry.amountPaid ?? 0);
}

export const LEDGER_STATUSES: LedgerStatus[] = ['unpaid', 'paid', 'partial'];
