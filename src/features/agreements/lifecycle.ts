import { todayIsoDate } from './calculations';
import type { Agreement, AgreementStatus } from './types';

/** Everything `getLifecycleStatus` can return — a superset of the stored
 * `AgreementStatus`. 'upcoming' is never written to the database; it's purely
 * a display-time overlay (see below), the same way 'ended' can be. */
export type LifecycleStatus = AgreementStatus | 'upcoming';

/**
 * `agreement.status` only ever changes to 'ended' or 'renewed' through an
 * explicit owner action (see the SQL comment in agreements.sql). Until that
 * happens, a still-'active' row is displayed differently depending on its
 * dates relative to today, with nothing written back to the database:
 * - before `start_date`: Upcoming — the agreement has been created and the
 *   property is already marked Rented (the unit is committed), but the
 *   tenancy itself hasn't started yet.
 * - after `end_date`: Ended — "no automatic action [on occupancy], but the
 *   state itself is visible" behavior confirmed in review.
 * Everywhere the UI needs to know what to show, it should call this instead
 * of reading `agreement.status` directly.
 */
export function getLifecycleStatus(agreement: Pick<Agreement, 'status' | 'startDate' | 'endDate'>): LifecycleStatus {
  if (agreement.status !== 'active') return agreement.status;
  const today = todayIsoDate();
  if (agreement.startDate > today) return 'upcoming';
  if (agreement.endDate < today) return 'ended';
  return 'active';
}

export function isTermPassed(agreement: Pick<Agreement, 'endDate'>): boolean {
  return agreement.endDate < todayIsoDate();
}

export const LIFECYCLE_LABELS: Record<LifecycleStatus, string> = {
  upcoming: 'Upcoming',
  active: 'Active',
  on_notice: 'On Notice',
  ended: 'Ended',
  renewed: 'Renewed',
};
