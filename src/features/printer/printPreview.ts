/** Fallback preview / share for thermal receipts without a Bluetooth printer. */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

import { toAsciiSafe } from '@/core/utils/string';

function receiptHtml(text: string): string {
  const escaped = toAsciiSafe(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
  return `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"/>
  <style>
    @page { size: 58mm auto; margin: 4mm; }
    body { font-family: "Courier New", monospace; font-size: 10px; color: #111; }
    .paper { width: 48mm; white-space: pre-wrap; word-break: break-word; }
  </style></head><body><div class="paper">${escaped}</div></body></html>`;
}

export async function previewReceipt(text: string): Promise<void> {
  await Print.printAsync({ html: receiptHtml(text) });
}

export async function shareReceiptPdf(text: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: receiptHtml(text), width: 226, height: 700 });
  const target = new File(Paths.cache, `struk_${Date.now()}.pdf`);
  new File(uri).copy(target);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(target.uri, { mimeType: 'application/pdf', dialogTitle: 'Bagikan struk' });
  }
}
