/** Indonesian date helpers — "25 Okt 2023", "Senin, 25 Oktober 2023". */
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;
export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
] as const;
export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'] as const;

export function asDate(value: Date | string | number | null | undefined): Date {
  if (value instanceof Date) return value;
  if (value === null || value === undefined) return new Date(NaN);
  if (typeof value === 'number') return new Date(value);
  const iso = value.includes('T') || value.includes('-') ? value.replace(' ', 'T') : value;
  const parsed = new Date(iso);
  return parsed;
}

/** 25 Okt 2023 */
export function formatDate(value: Date | string | number | null | undefined): string {
  const d = asDate(value);
  if (Number.isNaN(d.getTime())) return '-';
  return format(d, 'd MMM yyyy', { locale: localeId });
}

/** 25 Oktober 2023 */
export function formatDateLong(value: Date | string | number | null | undefined): string {
  const d = asDate(value);
  if (Number.isNaN(d.getTime())) return '-';
  return format(d, 'd MMMM yyyy', { locale: localeId });
}

/** 25 Okt 2023, 14.05 */
export function formatDateTime(value: Date | string | number | null | undefined): string {
  const d = asDate(value);
  if (Number.isNaN(d.getTime())) return '-';
  return `${formatDate(d)}, ${formatTime(d)}`;
}

/** 14.05 */
export function formatTime(value: Date | string | number | null | undefined = new Date()): string {
  const d = asDate(value);
  if (Number.isNaN(d.getTime())) return '-';
  return format(d, 'HH.mm');
}

/** 14.05.09 */
export function formatClock(value: Date | string | number | null | undefined = new Date()): string {
  const d = asDate(value);
  if (Number.isNaN(d.getTime())) return '-';
  return format(d, 'HH.mm.ss');
}

/** yyyy-MM-dd (local, for SQL) */
export function toDateKey(value: Date = new Date()): string {
  return format(value, 'yyyy-MM-dd');
}

export function dayName(value: Date = new Date()): string {
  return DAY_NAMES[value.getDay()] ?? '';
}

export function monthName(value: Date = new Date()): string {
  return MONTH_NAMES[value.getMonth()] ?? '';
}

export function monthShort(value: Date = new Date()): string {
  return MONTH_SHORT[value.getMonth()] ?? '';
}

/** dd-MM-yyyy (struk) */
export function formatReceiptDate(value: Date = new Date()): string {
  return format(value, 'dd-MM-yyyy');
}

export function startOfDay(value: Date = new Date()): Date {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(value: Date = new Date()): Date {
  const d = new Date(value);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(value: Date, days: number): Date {
  const d = new Date(value);
  d.setDate(d.getDate() + days);
  return d;
}
