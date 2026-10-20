/** Angka -> kata ( Bahasa Indonesia ) untuk invoice F4. */
const SATUAN = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

function terbilangRatus(n: number): string {
  if (n < 12) return SATUAN[n] ?? '';
  if (n < 20) return `${terbilangRatus(n - 10)} belas`;
  if (n < 100) return `${terbilangRatus(Math.floor(n / 10))} puluh ${terbilangRatus(n % 10)}`.trim();
  if (n < 200) return `seratus ${terbilangRatus(n - 100)}`.trim();
  if (n < 1000) return `${terbilangRatus(Math.floor(n / 100))} ratus ${terbilangRatus(n % 100)}`.trim();
  if (n < 2000) return `seribu ${terbilangRatus(n - 1000)}`.trim();
  if (n < 1_000_000) return `${terbilangRatus(Math.floor(n / 1000))} ribu ${terbilangRatus(n % 1000)}`.trim();
  if (n < 1_000_000_000) return `${terbilangRatus(Math.floor(n / 1_000_000))} juta ${terbilangRatus(n % 1_000_000)}`.trim();
  if (n < 1_000_000_000_000) return `${terbilangRatus(Math.floor(n / 1_000_000_000))} miliar ${terbilangRatus(n % 1_000_000_000)}`.trim();
  return `${terbilangRatus(Math.floor(n / 1_000_000_000_000))} triliun ${terbilangRatus(n % 1_000_000_000_000)}`.trim();
}

export function terbilang(value: number): string {
  const n = Math.floor(Math.abs(Number(value) || 0));
  if (n === 0) return 'nol rupiah';
  const words = terbilangRatus(n).replace(/\s+/g, ' ').trim();
  return `${value < 0 ? 'minus ' : ''}${words} rupiah`;
}

export function capitalizeWords(text: string): string {
  return text.replace(/\b\w/g, (c) => c.toUpperCase());
}
