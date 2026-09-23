// Pure date/money math shared by the New Agreement wizard, Agreement Detail,
// and Give Notice. Dates in and out are always "YYYY-MM-DD" strings — the
// same format TextField-based date entry produces elsewhere in this app.

function parseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayIsoDate(): string {
  return formatDate(new Date());
}

export function addDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}

export function addMonths(dateStr: string, months: number): string {
  const date = parseDate(dateStr);
  date.setUTCMonth(date.getUTCMonth() + months);
  return formatDate(date);
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = parseDate(value);
  return !Number.isNaN(date.getTime()) && formatDate(date) === value;
}

/** Whole months between two dates, rounded down — used for the tenure shown under Step 1's date fields and the max-tenure check on Step 2. */
export function tenureMonths(startDate: string, endDate: string): number {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
  return end.getUTCDate() < start.getUTCDate() ? months - 1 : months;
}

export function isDateOnOrBefore(dateStr: string, referenceDateStr: string): boolean {
  return dateStr <= referenceDateStr;
}

/** Whole days from today to `dateStr` — negative once it's passed. Used for every "Nd left" / "Overdue" deadline chip. */
export function daysUntil(dateStr: string): number {
  return Math.ceil((parseDate(dateStr).getTime() - parseDate(todayIsoDate()).getTime()) / (1000 * 60 * 60 * 24));
}

/** BR-10: registration is due within `windowMonths` of the execution (start) date. */
export function computeRegistrationDeadline(startDate: string, windowMonths: number): string {
  return addMonths(startDate, windowMonths);
}

/** Screen 18: notice date + the agreement's notice period. */
export function computeExpectedVacateDate(noticeDate: string, noticePeriodDays: number): string {
  return addDays(noticeDate, noticePeriodDays);
}

/**
 * BR-11: 0.25% of total rent over the license period + 0.25% of a notional
 * 10% p.a. interest on the refundable deposit. Labeled an estimate on every
 * screen that shows it — never final, per the Legal Config disclaimer.
 */
export function computeStampDutyEstimate(params: {
  monthlyRent: number;
  securityDeposit: number;
  startDate: string;
  endDate: string;
}): number {
  const months = Math.max(0, tenureMonths(params.startDate, params.endDate));
  const totalRent = params.monthlyRent * months;
  const rentDuty = totalRent * 0.0025;
  const notionalInterest = params.securityDeposit * 0.1 * (months / 12);
  const depositDuty = notionalInterest * 0.0025;
  return Math.round(rentDuty + depositDuty);
}

export function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}
