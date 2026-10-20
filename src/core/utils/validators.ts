/** Validasi form & input. */
export const PIN_LENGTH = 6;

export function isPin(value: string): boolean {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(value);
}

export function isRequired(value: string | null | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

export function minLength(value: string, min: number): boolean {
  return value.trim().length >= min;
}

export function autoUsername(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 32);
}

export function isUsername(value: string): boolean {
  return /^[a-z0-9_]{3,32}$/.test(value);
}

export function isPhoneID(value: string): boolean {
  const digits = value.replace(/[\s-]/g, '');
  return /^(\+62|62|0)8\d{7,12}$/.test(digits);
}

export function normalizePhoneID(value: string): string {
  const digits = value.replace(/[^\d+]/g, '');
  if (digits.startsWith('+62')) return digits;
  if (digits.startsWith('62')) return `+${digits}`;
  if (digits.startsWith('0')) return `+62${digits.slice(1)}`;
  return digits;
}

export function isBarcode(value: string): boolean {
  return /^[A-Za-z0-9._\-]{3,64}$/.test(value.trim());
}

export function isPositiveNumber(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function isNonNegativeNumber(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}
