/** UUID + id helpers (uuid v4, aman untuk React Native). */
import { v4 as uuidv4, validate as uuidValidate, version as uuidVersion } from 'uuid';

export function newId(): string {
  return uuidv4();
}

export function shortId(id: string, length = 8): string {
  return id.replace(/-/g, '').slice(0, length).toUpperCase();
}

export function isUuid(value: string): boolean {
  return uuidValidate(value) && uuidVersion(value) === 4;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function invoiceRef(counter: number): string {
  const normalized = counter > 999999 ? 1 : counter < 1 ? 1 : counter;
  return `INV/${String(normalized).padStart(6, '0')}`;
}
