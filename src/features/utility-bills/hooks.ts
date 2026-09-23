import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as utilityBillsApi from './api';
import { getUtilityBillProofSignedUrl } from './image';
import type { UtilityBillInput } from './types';

export const utilityBillKeys = {
  all: ['utility-bills'] as const,
  forProperty: (propertyId: string) => ['utility-bills', 'by-property', propertyId] as const,
  detail: (id: string) => ['utility-bills', id] as const,
  proofUrl: (path: string) => ['utility-bills', 'proof-url', path] as const,
};

export function useUtilityBills(propertyId?: string) {
  return useQuery({
    queryKey: propertyId ? utilityBillKeys.forProperty(propertyId) : utilityBillKeys.all,
    queryFn: () => utilityBillsApi.listUtilityBills(propertyId),
  });
}

export function useUtilityBill(id: string | null | undefined) {
  return useQuery({
    queryKey: utilityBillKeys.detail(id ?? ''),
    queryFn: () => utilityBillsApi.getUtilityBill(id as string),
    enabled: Boolean(id),
  });
}

function invalidateBills(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: utilityBillKeys.all });
}

export function useCreateUtilityBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UtilityBillInput) => utilityBillsApi.createUtilityBill(input),
    onSuccess: () => invalidateBills(queryClient),
  });
}

export function useUpdateUtilityBill(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UtilityBillInput) => utilityBillsApi.updateUtilityBill(id, input),
    onSuccess: (bill) => {
      queryClient.setQueryData(utilityBillKeys.detail(bill.id), bill);
      invalidateBills(queryClient);
    },
  });
}

export function useSetUtilityBillProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, proofDocumentPath }: { id: string; proofDocumentPath: string | null }) =>
      utilityBillsApi.setUtilityBillProofPath(id, proofDocumentPath),
    onSuccess: (bill) => {
      queryClient.setQueryData(utilityBillKeys.detail(bill.id), bill);
      invalidateBills(queryClient);
    },
  });
}

export function useDeleteUtilityBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => utilityBillsApi.deleteUtilityBill(id),
    onSuccess: () => invalidateBills(queryClient),
  });
}

/** Resolves a private storage path to a short-lived signed URL for display. */
export function useUtilityBillProofUrl(path: string | null) {
  return useQuery({
    queryKey: utilityBillKeys.proofUrl(path ?? ''),
    queryFn: () => getUtilityBillProofSignedUrl(path as string),
    enabled: Boolean(path),
    staleTime: 45 * 60 * 1000,
  });
}
