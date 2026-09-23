import { useSyncExternalStore } from 'react';

import type { AgreementDocType, EscalationFrequency, NoticeRaisedBy } from './types';

// Shared state for the 3-step New Agreement wizard (agreements/new/step1-3).
// Expo Router mounts each step as its own screen component, so this can't
// live in local useState — a plain module-level store is the simplest thing
// that survives navigating between them without adding a state library or a
// nested layout (the wizard's three steps are each registered as their own
// modal-presented Stack.Screen at the root layout, not a nested navigator).
// It's reset explicitly on entering the wizard fresh, on a successful
// "Create agreement", and if the wizard is abandoned via its close button.

export type AgreementDraft = {
  propertyId: string;
  tenantId: string | null;
  startDate: string;
  endDate: string;
  lockInMonths: string;
  noticePeriodDays: string;
  monthlyRent: string;
  securityDeposit: string;
  escalationPercent: string;
  escalationFrequency: EscalationFrequency;
  autoRenewal: boolean;
  witness1Name: string;
  witness1Phone: string;
  witness2Name: string;
  witness2Phone: string;
  policeVerificationDone: boolean;
  pickedDocuments: Partial<Record<AgreementDocType, { uri: string; mimeType: string | null; name: string }>>;
  previousAgreementId: string | null;
  noticeRaisedByOnRenew?: NoticeRaisedBy | null;
};

function emptyDraft(propertyId: string): AgreementDraft {
  return {
    propertyId,
    tenantId: null,
    startDate: '',
    endDate: '',
    lockInMonths: '',
    noticePeriodDays: '',
    monthlyRent: '',
    securityDeposit: '',
    escalationPercent: '',
    escalationFrequency: 'none',
    autoRenewal: false,
    witness1Name: '',
    witness1Phone: '',
    witness2Name: '',
    witness2Phone: '',
    policeVerificationDone: false,
    pickedDocuments: {},
    previousAgreementId: null,
  };
}

let draft: AgreementDraft | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): AgreementDraft | null {
  return draft;
}

/** Starts (or restarts) the wizard for a given property. Call once, from Step 1, before reading the draft. */
export function initAgreementDraft(propertyId: string, prefill?: Partial<AgreementDraft>) {
  draft = { ...emptyDraft(propertyId), ...prefill };
  notify();
}

export function updateAgreementDraft(patch: Partial<AgreementDraft>) {
  if (!draft) return;
  draft = { ...draft, ...patch };
  notify();
}

export function clearAgreementDraft() {
  draft = null;
  notify();
}

/** Read-only snapshot for screens that just need to render draft values, without subscribing to updates (e.g. a review summary computed once on Step 3). */
export function getAgreementDraft(): AgreementDraft | null {
  return draft;
}

export function useAgreementDraft(): AgreementDraft | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
