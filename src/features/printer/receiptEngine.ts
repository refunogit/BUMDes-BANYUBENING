/**
 * ReceiptEngine v2 — ESC/POS, 32 chars (58mm) / 48 chars (80mm).
 * Layout rules: padLine aligns ":" and right-aligns values, no emoji,
 * ASCII-safe text, no line longer than the configured width.
 *
 * Templates:
 *  A — ATK / fotokopi / print
 *  B — Listrik (PLN)
 *  C — QRIS (same footer/nota as A)
 */
import type { ListrikServiceData } from '@/store/cartStore';
import { formatPlain, formatQuantity } from '@/core/utils/currency';
import { formatReceiptDate, formatClock } from '@/core/utils/date';
import { toAsciiSafe, wrapText } from '@/core/utils/string';
import { ceil500 } from '@/core/utils/ceil500';

export type PaperSize = '58' | '80';

export const PAPER_WIDTH: Record<PaperSize, number> = { '58': 32, '80': 48 };

export type ReceiptItem = {
  name: string;
  price: number;
  qty: number;
  unit: string;
  subtotal: number;
};

export type ReceiptStore = {
  name: string;
  address?: string | null;
  phone?: string | null;
  footer?: string | null;
  note?: string | null;
};

export type ReceiptInput = {
  invoice: string;
  date: Date;
  cashier: string;
  customer?: string | null;
  paymentMethod: 'cash' | 'qris' | 'credit';
  items: ReceiptItem[];
  total: number;
  cashAmount: number;
  changeAmount: number;
  adminFee: number;
  reference?: string | null;
  serviceData?: ListrikServiceData | null;
  store: ReceiptStore;
  paperSize: PaperSize;
};

export type ReceiptTemplate = 'A' | 'B' | 'C';

export function rp(value: number): string {
  return `Rp.${formatPlain(Math.round(Number(value) || 0))}`;
}

/** label + ":" aligned at `colonAt`, value right-aligned to width. */
export function padLine(label: string, value: string, colonAt = 16, width = PAPER_WIDTH['58']): string {
  const safeLabel = toAsciiSafe(label);
  const safeValue = toAsciiSafe(value);
  if (safeLabel.length >= colonAt) {
    return `${safeLabel.slice(0, colonAt - 1)}:${safeValue.padStart(Math.max(1, width - colonAt)).slice(-(width - colonAt))}`.slice(0, width).padEnd(width, ' ');
  }
  const left = safeLabel.padEnd(colonAt, ' ');
  const valueSpace = Math.max(0, width - colonAt - 1);
  const right = safeValue.length > valueSpace ? safeValue.slice(safeValue.length - valueSpace) : safeValue.padStart(valueSpace, ' ');
  return `${left}:${right}`;
}

export function twoCols(left: string, right: string, width = PAPER_WIDTH['58']): string {
  const safeLeft = toAsciiSafe(left);
  const safeRight = toAsciiSafe(right);
  const space = Math.max(1, width - safeLeft.length - safeRight.length);
  if (safeLeft.length + safeRight.length + 1 > width) {
    return `${safeLeft.slice(0, width - safeRight.length - 1)} ${safeRight}`;
  }
  return `${safeLeft}${' '.repeat(space)}${safeRight}`;
}

export function centerLine(text: string, width = PAPER_WIDTH['58']): string {
  const safe = toAsciiSafe(text);
  if (safe.length >= width) return safe.slice(0, width);
  const pad = Math.floor((width - safe.length) / 2);
  return `${' '.repeat(pad)}${safe}`.padEnd(width, ' ');
}

export function dottedLine(width = PAPER_WIDTH['58']): string {
  return '.'.repeat(width);
}

export function determineTemplate(input: Pick<ReceiptInput, 'serviceData' | 'paymentMethod'>): ReceiptTemplate {
  if (input.serviceData) return 'B';
  if (input.paymentMethod === 'qris') return 'C';
  return 'A';
}

function header(lines: string[], input: ReceiptInput, width: number): void {
  const name = (input.store.name || 'KASIRKU').toUpperCase();
  lines.push(centerLine(`**${name}**`, width));
  if (input.store.address) wrapText(toAsciiSafe(input.store.address), width).forEach((l) => lines.push(centerLine(l, width)));
  if (input.store.phone) lines.push(centerLine(`Telp. ${toAsciiSafe(input.store.phone)}`, width));
  lines.push(dottedLine(width));
}

function metaBlock(lines: string[], input: ReceiptInput, width: number, extra?: string): void {
  lines.push(twoCols(`No. : ${input.invoice.replace(/-/g, '').slice(-8)}`, formatReceiptDate(input.date), width));
  lines.push(twoCols(`Ksr : ${input.cashier}`, formatClock(input.date), width));
  lines.push(twoCols(`Pel : ${input.customer?.trim() || 'Umum'}`, '', width));
  if (extra) lines.push(extra);
}

function itemBlock(lines: string[], input: ReceiptInput, width: number): void {
  for (const item of input.items) {
    const label = toAsciiSafe(item.name).toUpperCase();
    wrapText(label, width).forEach((line) => lines.push(line));
    lines.push(twoCols(`${rp(item.price)} X ${formatQuantity(item.qty)} =`, item.unit, width));
    lines.push(twoCols('', rp(item.subtotal), width));
  }
}

function closingBlock(lines: string[], input: ReceiptInput, width: number): void {
  lines.push(dottedLine(width));
  lines.push(centerLine('BARANG YANG SUDAH DITERIMA/CETAK', width));
  lines.push(centerLine('TIDAK BISA DIKEMBALIKAN ATAUPUN DI TUKAR', width));
  lines.push(centerLine(`TERIMA KASIH TELAH BERBELANJA DI ${(input.store.name || 'KASIRKU').toUpperCase()}`, width));
  if (input.store.footer) wrapText(toAsciiSafe(input.store.footer), width).forEach((l) => lines.push(centerLine(l, width)));
}

/** Template A — retail. */
function templateA(input: ReceiptInput, width: number): string[] {
  const lines: string[] = [];
  header(lines, input, width);
  metaBlock(lines, input, width);
  lines.push(dottedLine(width));
  itemBlock(lines, input, width);
  lines.push(dottedLine(width));
  lines.push(padLine('TOTAL', rp(input.total), 16, width));
  lines.push(padLine('TUNAI', rp(input.cashAmount), 16, width));
  lines.push(padLine('KEMBALI', rp(Math.max(0, input.changeAmount)), 16, width));
  lines.push(dottedLine(width));
  closingBlock(lines, input, width);
  return lines;
}

/** Template C — QRIS. */
function templateC(input: ReceiptInput, width: number): string[] {
  const lines: string[] = [];
  header(lines, input, width);
  metaBlock(lines, input, width, `Bayar : QRIS`);
  lines.push(dottedLine(width));
  itemBlock(lines, input, width);
  lines.push(dottedLine(width));
  lines.push(padLine('TOTAL', rp(input.total), 16, width));
  lines.push(padLine('TUNAI', rp(input.cashAmount), 16, width));
  lines.push(padLine('ADMIN', rp(input.adminFee), 16, width));
  lines.push(padLine('KEMBALI', rp(Math.max(0, input.changeAmount)), 16, width));
  if (input.reference) lines.push(padLine('Ref', toAsciiSafe(input.reference), 16, width));
  lines.push(dottedLine(width));
  closingBlock(lines, input, width);
  return lines;
}

/** Template B — PLN electricity bill. */
function templateB(input: ReceiptInput, width: number): string[] {
  const service = input.serviceData as ListrikServiceData;
  const lines: string[] = [];
  const name = (input.store.name || 'KASIRKU').toUpperCase();
  lines.push(centerLine(`**${name}**`, width));
  if (input.store.address) wrapText(toAsciiSafe(input.store.address), width).forEach((l) => lines.push(centerLine(l, width)));
  if (input.store.phone) lines.push(centerLine(`Telp. ${toAsciiSafe(input.store.phone)}`, width));
  lines.push(dottedLine(width));
  lines.push(centerLine('[LOGO PLN]', width));
  lines.push(centerLine('**STRUK PEMBAYARAN TAGIHAN LISTRIK**', width));
  lines.push(dottedLine(width));
  lines.push(padLine('IDPEL', service.idpel, 16, width));
  lines.push(padLine('NAMA', service.nama, 16, width));
  lines.push(padLine('TRF/DAYA', service.tarifDaya, 16, width));
  lines.push(padLine('TAGIHAN', rp(service.tagihan), 16, width));
  lines.push(padLine('PEMAKAIAN', `${formatPlain(service.kwh)} KWH`, 16, width));
  lines.push(padLine('BL/TH', `${service.bl}/${service.th}`, 16, width));
  lines.push(padLine('ADM BANK', rp(service.admBank), 16, width));
  lines.push(padLine('BIAYA LYN', rp(service.biayaLyn), 16, width));
  lines.push(padLine('DENDA', rp(service.denda), 16, width));
  lines.push(dottedLine(width));
  lines.push(padLine('TOTAL BAYAR', rp(ceil500(service.tagihan + service.admBank + service.biayaLyn + service.denda)), 16, width));
  lines.push(dottedLine(width));
  lines.push(centerLine('PLN MENYATAKAN STRUK INI SEBAGAI', width));
  lines.push(centerLine('BUKTI PEMBAYARAN YANG SAH', width));
  lines.push(dottedLine(width));
  lines.push(centerLine('Info Hubungi Call Center 123 Atau', width));
  lines.push(centerLine('Hubungi PLN Terdekat', width));
  lines.push(dottedLine(width));
  lines.push(centerLine(`TERIMA KASIH TELAH MELAKUKAN TRANSAKSI`, width));
  lines.push(centerLine(`DI ${name}`, width));
  if (input.store.footer) wrapText(toAsciiSafe(input.store.footer), width).forEach((l) => lines.push(centerLine(l, width)));
  return lines;
}

export type ReceiptResult = {
  template: ReceiptTemplate;
  lines: string[];
  text: string;
  width: number;
  total: number;
};

export function buildReceipt(input: ReceiptInput): ReceiptResult {
  const width = PAPER_WIDTH[input.paperSize] ?? PAPER_WIDTH['58'];
  const template = determineTemplate(input);
  const lines =
    template === 'B' ? templateB(input, width) : template === 'C' ? templateC(input, width) : templateA(input, width);
  const normalized = lines.map((line) => toAsciiSafe(line).slice(0, width).trimEnd());
  return {
    template,
    lines: normalized,
    text: normalized.join('\n'),
    width,
    total: input.serviceData
      ? ceil500(input.serviceData.tagihan + input.serviceData.admBank + input.serviceData.biayaLyn + input.serviceData.denda)
      : input.total,
  };
}

/* ------------------------------------------------------------------ */
/* ESC/POS byte builder                                               */
/* ------------------------------------------------------------------ */

export const ESC = '\x1B';
export const GS = '\x1D';

const CMD = {
  init: `${ESC}@`,
  center: `${ESC}a\x01`,
  left: `${ESC}a\x00`,
  boldOn: `${ESC}E\x01`,
  boldOff: `${ESC}E\x00`,
  doubleOn: `${GS}!\x11`,
  doubleOff: `${GS}!\x00`,
  feed2: `${ESC}d\x02`,
  cut: `${GS}V\x00`,
};

function encodeAscii(text: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    bytes.push(code <= 0x7e ? code : 0x3f); // '?'
  }
  return bytes;
}

/**
 * Converts receipt lines to ESC/POS bytes. `**text**` markers toggle
 * double-width+height bold centering used for the store name and TOTAL.
 */
export function buildEscPos(input: ReceiptInput): { bytes: Uint8Array; text: string; template: ReceiptTemplate; width: number } {
  const receipt = buildReceipt(input);
  const chunks: number[] = [];
  const push = (s: string) => chunks.push(...encodeAscii(s));
  const pushCmd = (s: string) => {
    for (let i = 0; i < s.length; i += 1) chunks.push(s.charCodeAt(i));
  };

  pushCmd(CMD.init);
  for (const rawLine of receipt.lines) {
    const line = rawLine.trim();
    const doubled = /^\*\*.*\*\*$/.test(line);
    const bold = doubled || /TOTAL BAYAR|^TOTAL/.test(line);
    if (doubled) {
      const inner = line.replace(/^\*\*/, '').replace(/\*\*$/, '');
      pushCmd(CMD.center);
      pushCmd(CMD.doubleOn);
      pushCmd(CMD.boldOn);
      push(toAsciiSafe(inner));
      pushCmd(CMD.boldOff);
      pushCmd(CMD.doubleOff);
      pushCmd(CMD.left);
    } else {
      pushCmd(CMD.left);
      if (bold) pushCmd(CMD.boldOn);
      push(line);
      if (bold) pushCmd(CMD.boldOff);
    }
    push('\n');
  }
  pushCmd(CMD.feed2);
  pushCmd(CMD.cut);
  return {
    bytes: Uint8Array.from(chunks),
    text: receipt.text,
    template: receipt.template,
    width: receipt.width,
  };
}

/** ASCII-safe centered text (real ESC a alignment, no space padding). */
export function asciiCenter(text: string): string {
  return toAsciiSafe(text);
}
