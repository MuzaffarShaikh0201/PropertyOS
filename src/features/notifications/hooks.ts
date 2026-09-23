import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as notificationsApi from './api';

export const notificationKeys = {
  all: ['notifications'] as const,
};

/** Runs the reminder scan, then returns the full feed — see ensureReminderNotifications. */
export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: async () => {
      await notificationsApi.ensureReminderNotifications();
      return notificationsApi.listNotifications();
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
