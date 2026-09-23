import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as propertiesApi from '@/features/properties/api';

import * as agreementsApi from './api';
import { getLifecycleStatus } from './lifecycle';
import type { AgreementDocuments, AgreementInput, GiveNoticeInput } from './types';

export const agreementKeys = {
  detail: (id: string) => ['agreements', id] as const,
  forProperty: (propertyId: string) => ['agreements', 'by-property', propertyId] as const,
  renewedInto: (agreementId: string) => ['agreements', 'renewed-into', agreementId] as const,
  unregistered: ['agreements', 'unregistered'] as const,
};

/** Dashboard's compliance-deadlines source — see listUnregisteredAgreements. */
export function useUnregisteredAgreements() {
  return useQuery({
    queryKey: agreementKeys.unregistered,
    queryFn: agreementsApi.listUnregisteredAgreements,
  });
}

export function useAgreement(id: string | null | undefined) {
  return useQuery({
    queryKey: agreementKeys.detail(id ?? ''),
    queryFn: () => agreementsApi.getAgreement(id as string),
    enabled: Boolean(id),
  });
}

export function useLatestAgreementForProperty(propertyId: string | null | undefined) {
  return useQuery({
    queryKey: agreementKeys.forProperty(propertyId ?? ''),
    queryFn: () => agreementsApi.getLatestAgreementForProperty(propertyId as string),
    enabled: Boolean(propertyId),
  });
}

export function useRenewedIntoAgreement(agreementId: string | null | undefined) {
  return useQuery({
    queryKey: agreementKeys.renewedInto(agreementId ?? ''),
    queryFn: () => agreementsApi.getRenewedIntoAgreement(agreementId as string),
    enabled: Boolean(agreementId),
  });
}

function invalidateAgreement(queryClient: ReturnType<typeof useQueryClient>, agreement: { id: string; propertyId: string }) {
  queryClient.setQueryData(agreementKeys.detail(agreement.id), agreement);
  queryClient.invalidateQueries({ queryKey: agreementKeys.forProperty(agreement.propertyId) });
  queryClient.invalidateQueries({ queryKey: agreementKeys.unregistered });
}

/** Creates the agreement, then marks its property Rented — the two actions the wizard's "Create agreement" always does together. */
export function useCreateAgreement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AgreementInput) => {
      const agreement = await agreementsApi.createAgreement(input);
      await propertiesApi.setPropertyOccupancyStatus(input.propertyId, 'rented');
      return agreement;
    },
    onSuccess: (agreement) => {
      invalidateAgreement(queryClient, agreement);
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

export function useUpdateAgreementDocuments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, documents }: { id: string; documents: AgreementDocuments }) =>
      agreementsApi.updateAgreementDocuments(id, documents),
    onSuccess: (agreement) => invalidateAgreement(queryClient, agreement),
  });
}

export function useMarkAgreementRegistered() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agreementsApi.markAgreementRegistered(id),
    onSuccess: (agreement) => invalidateAgreement(queryClient, agreement),
  });
}

export function useGiveNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: GiveNoticeInput }) => agreementsApi.giveNotice(id, input),
    onSuccess: (agreement) => invalidateAgreement(queryClient, agreement),
  });
}

export function useWithdrawNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agreementsApi.withdrawNotice(id),
    onSuccess: (agreement) => invalidateAgreement(queryClient, agreement),
  });
}

/** "Mark vacated" (from On Notice) and "Mark property vacant" (from Ended) are the same action: end the agreement explicitly and revert the property to Vacant. */
export function useEndAgreementAndVacate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ agreementId, propertyId }: { agreementId: string; propertyId: string }) => {
      const agreement = await agreementsApi.markAgreementEnded(agreementId);
      await propertiesApi.setPropertyOccupancyStatus(propertyId, 'vacant');
      return agreement;
    },
    onSuccess: (agreement) => {
      invalidateAgreement(queryClient, agreement);
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

/**
 * Deletes the agreement, then reconciles the property's occupancy: if no
 * other agreement on that property is still committed (active, upcoming, or
 * on notice), the property reverts to Vacant — an older Ended/Renewed row
 * left behind doesn't count, since those are already resolved.
 */
export function useDeleteAgreement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, propertyId }: { id: string; propertyId: string }) => {
      await agreementsApi.deleteAgreement(id);
      const remaining = await agreementsApi.getLatestAgreementForProperty(propertyId);
      const stillCommitted = remaining ? !['ended', 'renewed'].includes(getLifecycleStatus(remaining)) : false;
      if (!stillCommitted) {
        await propertiesApi.setPropertyOccupancyStatus(propertyId, 'vacant');
      }
      return { propertyId };
    },
    onSuccess: ({ propertyId }) => {
      queryClient.invalidateQueries({ queryKey: agreementKeys.forProperty(propertyId) });
      queryClient.invalidateQueries({ queryKey: agreementKeys.unregistered });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

export function useMarkAgreementRenewed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agreementsApi.markAgreementRenewed(id),
    onSuccess: (agreement) => invalidateAgreement(queryClient, agreement),
  });
}
