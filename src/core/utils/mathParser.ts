/** Kalkulator keranjang berbasis mathjs — hanya aritmetika aman. */
import { evaluate } from 'mathjs';

const ALLOWED = /^[0-9+\-*/().,%\s]+$/;

export type MathResult =
  | { ok: true; value: number }
  | { ok: false; error: 'empty' | 'invalid' | 'syntax' };

export function mathParser(expression: string): MathResult {
  const raw = expression.trim();
  if (raw === '') return { ok: false, error: 'empty' };
  const normalized = raw.replace(/,/g, '.').replace(/%/g, '/100');
  if (!ALLOWED.test(raw)) return { ok: false, error: 'invalid' };
  try {
    const result = evaluate(normalized) as unknown;
    if (typeof result !== 'number' || !Number.isFinite(result)) return { ok: false, error: 'syntax' };
    return { ok: true, value: result };
  } catch {
    return { ok: false, error: 'syntax' };
  }
}

export function safeEvaluate(expression: string, fallback = 0): number {
  const result = mathParser(expression);
  return result.ok ? result.value : fallback;
}
