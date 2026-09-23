import type { LegalConfig } from '@/features/legal-content/types';

export const ESCALATION_FREQUENCIES = [
  { value: 'none', label: 'None' },
  { value: 'annual', label: 'Annually' },
] as const;

export type EscalationFrequency = (typeof ESCALATION_FREQUENCIES)[number]['value'];

/** Stored, explicit lifecycle state. "Ended" also has a derived, unstored
 * form — see `getLifecycleStatus` in ./lifecycle — for a still-'active'
 * agreement whose end date has passed with no action taken yet. */
export const AGREEMENT_STATUSES = ['active', 'on_notice', 'ended', 'renewed'] as const;
export type AgreementStatus = (typeof AGREEMENT_STATUSES)[number];

export const NOTICE_RAISED_BY = [
  { value: 'owner', label: 'Owner' },
  { value: 'tenant', label: 'Tenant' },
] as const;
export type NoticeRaisedBy = (typeof NOTICE_RAISED_BY)[number]['value'];

export const AGREEMENT_DOC_TYPES = [
  { value: 'signed_agreement', label: 'Signed / registered agreement copy', required: true },
  { value: 'tenant_id_proof', label: 'Tenant ID proof', required: true },
  { value: 'witness1_id', label: 'Witness 1 ID record', required: true },
  { value: 'witness2_id', label: 'Witness 2 ID record', required: true },
  { value: 'police_verification', label: 'Police verification', required: false },
] as const;
export type AgreementDocType = (typeof AGREEMENT_DOC_TYPES)[number]['value'];

export type AgreementDocumentEntry = { path: string; uploadedAt: string };
export type AgreementDocuments = Partial<Record<AgreementDocType, AgreementDocumentEntry>>;

export type Agreement = {
  id: string;
  userId: string;
  propertyId: string;
  tenantId: string;
  status: AgreementStatus;
  startDate: string;
  endDate: string;
  lockInMonths: number | null;
  noticePeriodDays: number;
  monthlyRent: number;
  securityDeposit: number;
  escalationPercent: number | null;
  escalationFrequency: EscalationFrequency | null;
  autoRenewal: boolean;
  witness1Name: string | null;
  witness1Phone: string | null;
  witness2Name: string | null;
  witness2Phone: string | null;
  policeVerificationDone: boolean;
  legalConfigVersion: string;
  legalConfigSnapshot: LegalConfig;
  stampDutyEstimate: number | null;
  registeredAt: string | null;
  noticeRaisedBy: NoticeRaisedBy | null;
  noticeDate: string | null;
  expectedVacateDate: string | null;
  noticeNote: string | null;
  previousAgreementId: string | null;
  documents: AgreementDocuments;
  createdAt: string;
  updatedAt: string;
};

export type AgreementInput = {
  propertyId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  lockInMonths: number | null;
  noticePeriodDays: number;
  monthlyRent: number;
  securityDeposit: number;
  escalationPercent: number | null;
  escalationFrequency: EscalationFrequency | null;
  autoRenewal: boolean;
  witness1Name: string | null;
  witness1Phone: string | null;
  witness2Name: string | null;
  witness2Phone: string | null;
  policeVerificationDone: boolean;
  legalConfigVersion: string;
  legalConfigSnapshot: LegalConfig;
  stampDutyEstimate: number | null;
  previousAgreementId?: string | null;
};

export type GiveNoticeInput = {
  raisedBy: NoticeRaisedBy;
  noticeDate: string;
  expectedVacateDate: string;
  note: string | null;
};

export function agreementDocLabel(value: string): string {
  return AGREEMENT_DOC_TYPES.find((doc) => doc.value === value)?.label ?? value;
}
