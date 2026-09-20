import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as ownersApi from './api';
import type { OwnerInput } from './types';

export const ownerKeys = {
  all: ['owners'] as const,
  detail: (id: string) => ['owners', id] as const,
};

export function useOwners() {
  return useQuery({
    queryKey: ownerKeys.all,
    queryFn: ownersApi.listOwners,
  });
}

export function useOwner(id: string) {
  return useQuery({
    queryKey: ownerKeys.detail(id),
    queryFn: () => ownersApi.getOwner(id),
    enabled: Boolean(id),
  });
}

export function useCreateOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OwnerInput) => ownersApi.createOwner(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerKeys.all });
    },
  });
}

export function useUpdateOwner(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OwnerInput) => ownersApi.updateOwner(id, input),
    onSuccess: (owner) => {
      queryClient.invalidateQueries({ queryKey: ownerKeys.all });
      queryClient.setQueryData(ownerKeys.detail(id), owner);
    },
  });
}

export function useDeleteOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ownersApi.deleteOwner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerKeys.all });
    },
  });
}
