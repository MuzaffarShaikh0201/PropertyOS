export type LedgerStatus = 'unpaid' | 'paid' | 'partial';
/** What the ledger row actually shows — adds the derived 'late' overlay (see lifecycle.ts). */
export type LedgerDisplayStatus = LedgerStatus | 'late';

export const PAYMENT_MODES = ['Cash', 'UPI', 'Bank transfer', 'Cheque', 'Other'] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export type RentLedgerEntry = {
  id: string;
  userId: string;
  agreementId: string;
  /** First day of the month this rent covers — also this period's due date in v1. */
  periodStart: string;
  amountDue: number;
  status: LedgerStatus;
  amountPaid: number | null;
  paidAt: string | null;
  paymentMode: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RecordPaymentInput = {
  status: 'paid' | 'partial';
  amountPaid: number;
  paidAt: string;
  paymentMode: string | null;
};
