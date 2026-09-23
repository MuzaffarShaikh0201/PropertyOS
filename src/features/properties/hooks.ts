import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as propertiesApi from './api';
import { getPropertyImageSignedUrl } from './image';
import type { OccupancyStatus, PropertyInput } from './types';

export const propertyKeys = {
  all: ['properties'] as const,
  detail: (id: string) => ['properties', id] as const,
  imageUrl: (imagePath: string) => ['properties', 'image-url', imagePath] as const,
};

export function useProperties() {
  return useQuery({
    queryKey: propertyKeys.all,
    queryFn: propertiesApi.listProperties,
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: () => propertiesApi.getProperty(id),
    enabled: Boolean(id),
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PropertyInput) => propertiesApi.createProperty(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
  });
}

export function useUpdateProperty(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PropertyInput) => propertiesApi.updateProperty(id, input),
    onSuccess: (property) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
      queryClient.setQueryData(propertyKeys.detail(id), property);
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => propertiesApi.deleteProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
  });
}

export function useSetPropertyOccupancyStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, occupancyStatus }: { id: string; occupancyStatus: OccupancyStatus }) =>
      propertiesApi.setPropertyOccupancyStatus(id, occupancyStatus),
    onSuccess: (property) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
      queryClient.setQueryData(propertyKeys.detail(property.id), property);
    },
  });
}

export function useSetPropertyImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, imagePath }: { id: string; imagePath: string | null }) =>
      propertiesApi.setPropertyImagePath(id, imagePath),
    onSuccess: (property) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
      queryClient.setQueryData(propertyKeys.detail(property.id), property);
    },
  });
}

/** Resolves a private storage path to a short-lived signed URL for display. */
export function usePropertyImageUrl(imagePath: string | null) {
  return useQuery({
    queryKey: propertyKeys.imageUrl(imagePath ?? ''),
    queryFn: () => getPropertyImageSignedUrl(imagePath as string),
    enabled: Boolean(imagePath),
    // Well under the 1-hour signed URL TTL (image.ts), so a stale URL is
    // never handed out and re-fetched right before it would expire.
    staleTime: 45 * 60 * 1000,
  });
}
