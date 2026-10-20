/** Currency & quantity formatting — Indonesian convention: "Rp 10.000". */
import { clamp } from './scaleCore';

const groupDigits = (intPart: string): string =>
  intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export function formatPlain(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  const safe = Number.isFinite(n) ? n : 0;
  const negative = safe < 0;
  const abs = Math.abs(safe);
  const rounded = Math.round(abs);
  const out = groupDigits(String(rounded));
  return negative ? `-${out}` : out;
}

export function formatRupiah(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  const safe = Number.isFinite(n) ? n : 0;
  return `${safe < 0 ? '-Rp ' : 'Rp '}${formatPlain(Math.abs(safe))}`;
}

/** Parse "Rp 10.000", "10.000", "10,5" -> number. Invalid -> NaN. */
export function parseNumber(input: string | number | null | undefined): number {
  if (typeof input === 'number') return Number.isFinite(input) ? input : NaN;
  if (input === null || input === undefined) return NaN;
  const cleaned = String(input).replace(/rp/gi, '').replace(/\s/g, '').trim();
  if (cleaned === '') return NaN;
  const normalized = cleaned.replace(/\./g, '').replace(',', '.');
  if (!/^[-+]?\d+(\.\d+)?$/.test(normalized)) return NaN;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : NaN;
}

export const parse = parseNumber;

export function parseMoney(input: string | number | null | undefined): number {
  const value = parseNumber(input);
  return Number.isFinite(value) ? Math.round(value) : 0;
}

export function formatQuantity(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return '0';
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2))).replace('.', ',');
}

/** Stok/keranjang diformat dengan 2 desimal untuk perhitungan uang. */
export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function formatCompactRupiah(value: number): string {
  const safe = Math.abs(value);
  if (safe >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
  if (safe >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1).replace('.', ',')} jt`;
  if (safe >= 10_000) return `Rp ${(value / 1_000).toFixed(0)} rb`;
  return formatRupiah(value);
}

export function safePercent(value: number): number {
  return clamp(value, -999, 999);
}
