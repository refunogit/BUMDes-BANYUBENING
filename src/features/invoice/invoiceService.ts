/**
 * Invoice F4 (215.9 x 330.2 mm) — referensi INV/6 digit (reset >999999),
 * tabel 7 kolom, ringkasan, terbilang, dan 2 kolom tanda tangan.
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File } from 'expo-file-system';

import { getJsonSetting, getNumberSetting, setJsonSetting, setSetting } from '@/data/repositories/settingsRepository';
import { SETTINGS_KEYS } from '@/core/constants/settingsKeys';
import { invoiceRef, newId } from '@/core/utils/id';
import { formatDateLong } from '@/core/utils/date';
import { formatPlain, roundMoney } from '@/core/utils/currency';
import { terbilang, capitalizeWords } from '@/core/utils/terbilang';
import { exportsDir } from '@/core/services/storageService';
import { getReportStore, type ReportStore } from '@/features/reports/reportService';

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  price: number;
  discount: number;
  taxPercent: number;
};

export type InvoiceStatus = 'unpaid' | 'paid';

export type InvoiceRecord = {
  id: string;
  reference: string;
  date: string;
  npwp: string;
  status: InvoiceStatus;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  items: InvoiceItem[];
  additionalDiscount: number;
  paidAmount: number;
  notes: string;
  terms: string;
  createdAt: string;
};

export type InvoiceTemplateSettings = {
  npwp: string;
  notes: string;
  terms: string;
};

export const DEFAULT_INVOICE_TERMS = 'Pembayaran dilakukan sesuai kesepakatan. Barang yang sudah dibeli tidak dapat dikembalikan.';

export function emptyInvoiceItem(): InvoiceItem {
  return { id: newId(), description: '', quantity: 1, price: 0, discount: 0, taxPercent: 0 };
}

export function computeInvoiceTotals(invoice: InvoiceRecord): {
  subtotal: number;
  itemDiscount: number;
  tax: number;
  total: number;
  remaining: number;
} {
  let subtotal = 0;
  let itemDiscount = 0;
  let tax = 0;
  for (const item of invoice.items) {
    const line = roundMoney(item.price * item.quantity);
    subtotal += line;
    itemDiscount += item.discount;
    tax += roundMoney(((line - item.discount) * item.taxPercent) / 100);
  }
  const totalDiscount = roundMoney(itemDiscount + invoice.additionalDiscount);
  const total = roundMoney(subtotal - totalDiscount + tax);
  return {
    subtotal: roundMoney(subtotal),
    itemDiscount: roundMoney(totalDiscount),
    tax: roundMoney(tax),
    total,
    remaining: roundMoney(total - invoice.paidAmount),
  };
}

export async function getInvoices(): Promise<InvoiceRecord[]> {
  return getJsonSetting<InvoiceRecord[]>(SETTINGS_KEYS.invoices, []);
}

export async function getInvoiceById(id: string): Promise<InvoiceRecord | null> {
  const invoices = await getInvoices();
  return invoices.find((invoice) => invoice.id === id) ?? null;
}

export async function getInvoiceTemplateSettings(): Promise<InvoiceTemplateSettings> {
  const raw = await getJsonSetting<Partial<InvoiceTemplateSettings>>(SETTINGS_KEYS.invoiceTemplate, {});
  return {
    npwp: raw.npwp ?? '',
    notes: raw.notes ?? '',
    terms: raw.terms ?? DEFAULT_INVOICE_TERMS,
  };
}

export async function saveInvoiceTemplateSettings(settings: InvoiceTemplateSettings): Promise<void> {
  await setJsonSetting(SETTINGS_KEYS.invoiceTemplate, settings);
}

/** Counter: 1..999999; after 999999 restart at 000001. */
export async function nextInvoiceReference(): Promise<string> {
  const current = await getNumberSetting(SETTINGS_KEYS.invoiceCounter, 0);
  const next = current >= 999999 ? 1 : current + 1;
  await setSetting(SETTINGS_KEYS.invoiceCounter, String(next));
  return invoiceRef(next);
}

export async function saveInvoice(invoice: InvoiceRecord): Promise<InvoiceRecord[]> {
  const invoices = await getInvoices();
  const index = invoices.findIndex((item) => item.id === invoice.id);
  if (index >= 0) invoices[index] = invoice;
  else invoices.unshift(invoice);
  await setJsonSetting(SETTINGS_KEYS.invoices, invoices);
  return invoices;
}

export async function deleteInvoice(id: string): Promise<void> {
  const invoices = await getInvoices();
  await setJsonSetting(
    SETTINGS_KEYS.invoices,
    invoices.filter((invoice) => invoice.id !== id),
  );
}

export async function createDraftInvoice(): Promise<InvoiceRecord> {
  const settings = await getInvoiceTemplateSettings();
  const reference = await nextInvoiceReference();
  return {
    id: newId(),
    reference,
    date: new Date().toISOString(),
    npwp: settings.npwp,
    status: 'unpaid',
    customerName: '',
    customerAddress: '',
    customerPhone: '',
    items: [emptyInvoiceItem()],
    additionalDiscount: 0,
    paidAmount: 0,
    notes: settings.notes,
    terms: settings.terms,
    createdAt: new Date().toISOString(),
  };
}

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function money(value: number): string {
  return `Rp ${formatPlain(Math.round(value))},00`;
}

export function buildInvoiceHtml(invoice: InvoiceRecord, store: ReportStore): string {
  const totals = computeInvoiceTotals(invoice);
  const logo = store.logoDataUri ? `<img src="${store.logoDataUri}" class="logo" />` : '';
  const rows = invoice.items
    .map((item, index) => {
      const amount = roundMoney(item.price * item.quantity - item.discount + ((item.price * item.quantity - item.discount) * item.taxPercent) / 100);
      return `<tr class="${index % 2 === 0 ? 'zebra' : ''}">
        <td>${esc(item.description || '-')}</td>
        <td class="num">${formatPlain(item.quantity)}</td>
        <td class="num">${money(item.price)}</td>
        <td class="num">${item.discount ? money(item.discount) : '-'}</td>
        <td class="num">${item.taxPercent ? `${item.taxPercent}%` : '-'}</td>
        <td class="num">${money(amount - (item.taxPercent ? 0 : 0))}</td>
        <td class="num strong">${money(amount)}</td>
      </tr>`;
    })
    .join('');

  return `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"/><style>
    @page { size: 215.9mm 330.2mm; margin: 10mm; }
    * { box-sizing: border-box; }
    body { font-family: Helvetica, Arial, sans-serif; font-size: 10.5px; color: #1B2B3A; }
    .top { display:flex; justify-content:space-between; align-items:flex-start; }
    .logo { max-height: 24mm; max-width: 58mm; object-fit: contain; }
    .title { text-align:right; }
    .title h1 { color:#2F86D1; font-size: 30px; letter-spacing: 4px; margin:0; }
    .title div { color:#6b7c8f; font-size: 10px; }
    .meta { margin-top: 6mm; display:flex; justify-content:flex-end; }
    .meta table { border-collapse: collapse; width: 78mm; }
    .meta td { padding: 2px 0; }
    .meta td:first-child { color:#5c6b7a; }
    .meta td:last-child { text-align:right; font-weight:700; }
    .status { display:inline-block; padding:2px 10px; border-radius:10px; font-size:9px; font-weight:800; }
    .paid { background:#E8F5E9; color:#2E7D32; }
    .unpaid { background:#FDECEE; color:#D64545; }
    .parties { display:flex; gap: 8mm; margin-top: 8mm; }
    .party { flex:1; border-top:2px solid #0C3B6E; padding-top:3mm; }
    .party h3 { font-size: 9px; color:#2F86D1; letter-spacing: 1px; margin:0 0 2mm; }
    .party .name { font-weight:800; font-size:12px; }
    .party .up { color:#2F86D1; font-weight:700; }
    table.items { width:100%; border-collapse: collapse; margin-top: 8mm; }
    table.items th { background:#2F86D1; color:#fff; padding:6px 5px; text-align:left; font-size:9px; }
    table.items td { padding:5px; border-bottom:1px solid #DDE3EA; font-size:9.5px; }
    table.items tr.zebra td { background:#F5F9FD; }
    .num { text-align:right; }
    .strong { font-weight:800; }
    .summary { display:flex; justify-content:flex-end; margin-top: 5mm; }
    .summary table { border-collapse: collapse; width: 88mm; }
    .summary td { padding: 3px 0; }
    .summary td:last-child { text-align:right; font-weight:700; }
    .summary .total td { border-top:1.5px solid #2F86D1; color:#2F86D1; font-size:13px; font-weight:900; padding-top:5px; }
    .summary .remain td { color:#D64545; font-weight:900; }
    .notes { margin-top: 7mm; font-size:9px; color:#41505f; }
    .notes h4 { margin:0 0 2px; color:#0C3B6E; font-size:9px; letter-spacing:1px; }
    .words { margin-top: 4mm; font-size:9px; font-style: italic; color:#41505f; }
    .sign { display:flex; justify-content:space-between; margin-top: 12mm; }
    .sign div { width: 60mm; text-align:center; }
    .sign .space { height: 22mm; }
    .sign .line { border-top:1px solid #1B2B3A; padding-top:2mm; font-weight:700; }
    </style></head><body>
    <div class="top">
      <div>${logo}</div>
      <div class="title"><h1>INVOICE</h1><div>${esc(store.name)}</div></div>
    </div>
    <div class="meta"><table>
      <tr><td>Referensi</td><td>${esc(invoice.reference)}</td></tr>
      <tr><td>Tanggal</td><td>${formatDateLong(invoice.date)}</td></tr>
      <tr><td>No. NPWP</td><td>${esc(invoice.npwp || '-')}</td></tr>
      <tr><td>Status</td><td><span class="status ${invoice.status === 'paid' ? 'paid' : 'unpaid'}">${invoice.status === 'paid' ? 'Lunas' : 'Unpaid'}</span></td></tr>
    </table></div>
    <div class="parties">
      <div class="party">
        <h3>INFO PERUSAHAAN</h3>
        <div class="name">${esc(store.name)}</div>
        <div>${esc(store.address)}</div>
        <div>${esc(store.phone)}</div>
        ${invoice.npwp ? `<div>NPWP: ${esc(invoice.npwp)}</div>` : ''}
      </div>
      <div class="party">
        <h3>TAGIHAN UNTUK</h3>
        <div class="name">${esc(invoice.customerName || '-')}</div>
        <div>${esc(invoice.customerAddress)}</div>
        <div>${esc(invoice.customerPhone)}</div>
      </div>
    </div>
    <table class="items">
      <thead><tr><th>PRODUCT/DESCRIPTION</th><th class="num">QUANTITY</th><th class="num">PRICE</th><th class="num">DISCOUNT</th><th class="num">TAX</th><th class="num">AMOUNT</th><th class="num">TOTAL</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="7">Belum ada item.</td></tr>'}</tbody>
    </table>
    <div class="summary"><table>
      <tr><td>Subtotal</td><td>${money(totals.subtotal)}</td></tr>
      <tr><td>Total Discount</td><td>${money(totals.itemDiscount)}</td></tr>
      <tr><td>Additional Discount</td><td>${money(invoice.additionalDiscount)}</td></tr>
      <tr><td>Tax</td><td>${money(totals.tax)}</td></tr>
      <tr class="total"><td>Total</td><td>${money(totals.total)}</td></tr>
      <tr><td>Total Terbayar</td><td>${money(invoice.paidAmount)}</td></tr>
      <tr class="remain"><td>Sisa Tagihan</td><td>${money(totals.remaining)}</td></tr>
    </table></div>
    <div class="words">Terbilang: ${capitalizeWords(terbilang(totals.total))}</div>
    <div class="notes">
      <h4>KETERANGAN</h4>
      <div>${esc(invoice.notes || '-')}</div>
      <h4 style="margin-top:4mm">SYARAT & KETENTUAN</h4>
      <div>${esc(invoice.terms || '-')}</div>
    </div>
    <div class="sign">
      <div><div>Penerima Invoice</div><div class="space"></div><div class="line">(...............)</div></div>
      <div><div>Pemberi Invoice</div><div class="space"></div><div class="line">${esc(store.name)}</div></div>
    </div>
    </body></html>`;
}

export async function shareInvoicePdf(invoice: InvoiceRecord): Promise<string> {
  const store = await getReportStore();
  const html = buildInvoiceHtml(invoice, store);
  const { uri } = await Print.printToFileAsync({ html, width: 612, height: 936 });
  const target = new File(exportsDir(), `invoice_${invoice.reference.replace(/\//g, '-')}_${Date.now()}.pdf`);
  if (target.exists) target.delete();
  new File(uri).copy(target);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(target.uri, { mimeType: 'application/pdf', dialogTitle: 'Bagikan invoice' });
  }
  return target.uri;
}

export async function previewInvoicePdf(invoice: InvoiceRecord): Promise<void> {
  const store = await getReportStore();
  await Print.printAsync({ html: buildInvoiceHtml(invoice, store) });
}
