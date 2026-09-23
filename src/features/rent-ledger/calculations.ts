import { addMonths, tenureMonths } from '@/features/agreements/calculations';
import type { Agreement } from '@/features/agreements/types';

/**
 * One period per calendar month of the agreement's term, due on the same
 * day-of-month as `startDate` (there's no separate "rent due day" field on
 * the agreement in v1). Escalation compounds once per elapsed year when the
 * agreement has annual escalation — never a mid-year jump.
 */
export function generatePeriods(
  agreement: Pick<Agreement, 'startDate' | 'endDate' | 'monthlyRent' | 'escalationFrequency' | 'escalationPercent'>
): { periodStart: string; amountDue: number }[] {
  const periodCount = Math.max(0, tenureMonths(agreement.startDate, agreement.endDate));
  const periods: { periodStart: string; amountDue: number }[] = [];
  for (let i = 0; i < periodCount; i++) {
    const yearsElapsed = Math.floor(i / 12);
    const amountDue =
      agreement.escalationFrequency === 'annual' && agreement.escalationPercent
        ? Math.round(agreement.monthlyRent * (1 + agreement.escalationPercent / 100) ** yearsElapsed)
        : agreement.monthlyRent;
    periods.push({ periodStart: addMonths(agreement.startDate, i), amountDue });
  }
  return periods;
}
