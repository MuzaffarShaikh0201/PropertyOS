import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as tenantsApi from './api';
import { getTenantPhotoSignedUrl } from './image';
import type { TenantInput } from './types';

export const tenantKeys = {
  detail: (id: string) => ['tenants', id] as const,
  photoUrl: (photoPath: string) => ['tenants', 'photo-url', photoPath] as const,
};

export function useTenant(id: string | null | undefined) {
  return useQuery({
    queryKey: tenantKeys.detail(id ?? ''),
    queryFn: () => tenantsApi.getTenant(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TenantInput) => tenantsApi.createTenant(input),
    onSuccess: (tenant) => {
      queryClient.setQueryData(tenantKeys.detail(tenant.id), tenant);
    },
  });
}

export function useUpdateTenant(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TenantInput) => tenantsApi.updateTenant(id, input),
    onSuccess: (tenant) => {
      queryClient.setQueryData(tenantKeys.detail(tenant.id), tenant);
    },
  });
}

export function useSetTenantPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, photoPath }: { id: string; photoPath: string | null }) =>
      tenantsApi.setTenantPhotoPath(id, photoPath),
    onSuccess: (tenant) => {
      queryClient.setQueryData(tenantKeys.detail(tenant.id), tenant);
    },
  });
}

/** Resolves a private storage path to a short-lived signed URL for display. */
export function useTenantPhotoUrl(photoPath: string | null) {
  return useQuery({
    queryKey: tenantKeys.photoUrl(photoPath ?? ''),
    queryFn: () => getTenantPhotoSignedUrl(photoPath as string),
    enabled: Boolean(photoPath),
    staleTime: 45 * 60 * 1000,
  });
}
