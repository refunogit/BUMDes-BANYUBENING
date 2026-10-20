/** Pembulatan listrik: kelipatan Rp 500 ke atas. */
export const CEIL_UNIT = 500;

export function ceil500(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  // epsilon guard so 25500.0000001 does not jump to 26000
  return Math.round(Math.ceil((n - 1e-6) / CEIL_UNIT) * CEIL_UNIT);
}
