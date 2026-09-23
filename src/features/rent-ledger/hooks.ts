import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Agreement } from '@/features/agreements/types';

import * as rentLedgerApi from './api';
import type { RecordPaymentInput } from './types';

export const rentLedgerKeys = {
  forAgreement: (agreementId: string) => ['rent-ledger', agreementId] as const,
  upcoming: ['rent-ledger', 'upcoming'] as const,
};

/** Dashboard's "Upcoming rent" source. */
export function useUpcomingRentDue(windowDays?: number) {
  return useQuery({
    queryKey: rentLedgerKeys.upcoming,
    queryFn: () => rentLedgerApi.listUpcomingRentDue(windowDays),
  });
}

/** Generates any missing periods for the agreement's term, then returns the full ledger — see ensurePeriodsGenerated. */
export function useLedgerEntries(agreement: Agreement | null | undefined) {
  return useQuery({
    queryKey: rentLedgerKeys.forAgreement(agreement?.id ?? ''),
    queryFn: async () => {
      await rentLedgerApi.ensurePeriodsGenerated(agreement as Agreement);
      return rentLedgerApi.listLedgerEntries((agreement as Agreement).id);
    },
    enabled: Boolean(agreement),
  });
}

export function useRecordLedgerPayment(agreementId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RecordPaymentInput }) =>
      rentLedgerApi.recordLedgerPayment(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentLedgerKeys.forAgreement(agreementId) });
      queryClient.invalidateQueries({ queryKey: rentLedgerKeys.upcoming });
    },
  });
}

export function useRevertLedgerEntryToUnpaid(agreementId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rentLedgerApi.revertLedgerEntryToUnpaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentLedgerKeys.forAgreement(agreementId) });
      queryClient.invalidateQueries({ queryKey: rentLedgerKeys.upcoming });
    },
  });
}
