export const NOTIFICATION_TYPES = [
  'compliance_deadline',
  'rent_due',
  'bill_due',
  'rent_paid',
  'bill_paid',
  'legal_update',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationRoute =
  | { pathname: '/agreements/[id]'; params: { id: string } }
  | { pathname: '/bills/[id]'; params: { id: string } }
  | { pathname: '/legal-config' };

/** Display copy and the navigation target are composed at read time from
 * whichever row is joined in — see mapNotification in api.ts. Nothing here
 * is stored text, so it never goes stale. */
export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  route: NotificationRoute;
  readAt: string | null;
  createdAt: string;
};
