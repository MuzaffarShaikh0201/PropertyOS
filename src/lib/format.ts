const AADHAAR_PATTERN = /^\d{12}$/;
const PAN_PATTERN = /^[A-Z]{5}\d{4}[A-Z]$/;

/** "+919876543210" -> "+91 98xxxxxx10" */
export function maskPhone(e164Phone: string): string {
  const digits = e164Phone.replace(/^\+91/, '');
  if (digits.length !== 10) return e164Phone;
  return `+91 ${digits.slice(0, 2)}xxxxxx${digits.slice(-2)}`;
}

export function isValidAadhaar(value: string): boolean {
  return AADHAAR_PATTERN.test(value);
}

export function isValidPan(value: string): boolean {
  return PAN_PATTERN.test(value.toUpperCase());
}
