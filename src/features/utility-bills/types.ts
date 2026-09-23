export const BILL_TYPES = [
  { value: 'electricity', label: 'Electricity' },
  { value: 'water', label: 'Water' },
  { value: 'maintenance', label: 'Maintenance / Society' },
  { value: 'property_tax', label: 'Property tax' },
  { value: 'other', label: 'Other' },
] as const;
export type BillType = (typeof BILL_TYPES)[number]['value'];

export const RESPONSIBLE_PARTIES = [
  { value: 'owner', label: 'Owner' },
  { value: 'tenant', label: 'Tenant' },
] as const;
export type ResponsibleParty = (typeof RESPONSIBLE_PARTIES)[number]['value'];

export type BillStatus = 'unpaid' | 'paid' | 'partial';
/** What the row actually shows — adds the derived 'overdue' overlay (see lifecycle.ts). */
export type BillDisplayStatus = BillStatus | 'overdue';

export type UtilityBill = {
  id: string;
  userId: string;
  propertyId: string;
  agreementId: string | null;
  billType: BillType;
  responsibleParty: ResponsibleParty;
  billDate: string;
  dueDate: string;
  amount: number;
  status: BillStatus;
  amountPaid: number | null;
  paidAt: string | null;
  /** Path inside the private `utility-bill-proofs` storage bucket, or null — the upload is optional. */
  proofDocumentPath: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UtilityBillInput = {
  propertyId: string;
  agreementId: string | null;
  billType: BillType;
  responsibleParty: ResponsibleParty;
  billDate: string;
  dueDate: string;
  amount: number;
  status: BillStatus;
  amountPaid: number | null;
  paidAt: string | null;
};

export function billTypeLabel(value: string): string {
  return BILL_TYPES.find((type) => type.value === value)?.label ?? value;
}

export function responsiblePartyLabel(value: string): string {
  return RESPONSIBLE_PARTIES.find((party) => party.value === value)?.label ?? value;
}
