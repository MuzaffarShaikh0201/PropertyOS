import { todayIsoDate } from '@/features/agreements/calculations';

import type { BillDisplayStatus, UtilityBill } from './types';

/** 'overdue' is never stored — an 'unpaid' bill past its due date is shown as Overdue, the same derived-not-stored pattern used for agreements ('ended') and the rent ledger ('late'). */
export function getBillDisplayStatus(bill: Pick<UtilityBill, 'status' | 'dueDate'>): BillDisplayStatus {
  if (bill.status !== 'unpaid') return bill.status;
  return bill.dueDate < todayIsoDate() ? 'overdue' : 'unpaid';
}

export const BILL_STATUS_LABELS: Record<BillDisplayStatus, string> = {
  unpaid: 'Due',
  paid: 'Paid',
  partial: 'Partial',
  overdue: 'Overdue',
};

export function billShortfall(bill: Pick<UtilityBill, 'status' | 'amount' | 'amountPaid'>): number {
  if (bill.status !== 'partial') return 0;
  return bill.amount - (bill.amountPaid ?? 0);
}
