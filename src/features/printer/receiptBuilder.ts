/** Converts a stored transaction into a ReceiptInput (single source of truth). */
import { getSetting } from '@/data/repositories/settingsRepository';
import { SETTINGS_KEYS } from '@/core/constants/settingsKeys';
import type { TransactionWithDetails } from '@/data/repositories/transactionRepository';
import { useAuthStore } from '@/store/authStore';
import type { ListrikServiceData } from '@/store/cartStore';
import type { PaperSize, ReceiptInput, ReceiptItem } from './receiptEngine';

export async function getReceiptStore(): Promise<{
  name: string;
  address: string | null;
  phone: string | null;
  footer: string | null;
}> {
  const name =
    (await getSetting(SETTINGS_KEYS.strukNama)) ??
    (await getSetting(SETTINGS_KEYS.bumdesNama)) ??
    'KASIRKU';
  const address = (await getSetting(SETTINGS_KEYS.strukAlamat)) ?? null;
  const phone = (await getSetting(SETTINGS_KEYS.strukTelp)) ?? null;
  const footer = (await getSetting(SETTINGS_KEYS.strukFooter)) ?? null;
  return { name, address, phone, footer };
}

export async function getPaperSize(): Promise<PaperSize> {
  const raw = await getSetting(SETTINGS_KEYS.printerPaperSize);
  return raw === '80' ? '80' : '58';
}

function parseListrikService(details: TransactionWithDetails['details']): ListrikServiceData | null {
  for (const detail of details) {
    if (detail.service_data_json) {
      try {
        const parsed = JSON.parse(detail.service_data_json) as { type?: string };
        if (parsed.type === 'listrik') return parsed as ListrikServiceData;
      } catch {
        // ignore malformed payload
      }
    }
  }
  return null;
}

export async function receiptInputFromTransaction(trx: TransactionWithDetails): Promise<ReceiptInput> {
  const store = await getReceiptStore();
  const paperSize = await getPaperSize();
  const cashier = useAuthStore.getState().user?.displayName ?? 'Kasir';
  const items: ReceiptItem[] = trx.details.map((detail) => ({
    name: detail.name ?? 'Item',
    price: detail.price,
    qty: detail.quantity,
    unit: detail.unit ?? '',
    subtotal: detail.subtotal,
  }));
  const serviceData = parseListrikService(trx.details);
  return {
    invoice: trx.invoice_number,
    date: new Date(trx.created_at),
    cashier,
    customer: trx.customer_name ?? null,
    paymentMethod: trx.payment_method,
    items,
    total: trx.total,
    cashAmount: trx.cash_amount,
    changeAmount: trx.change_amount,
    adminFee: trx.admin_fee ?? 0,
    reference: trx.payment_reference,
    serviceData,
    store,
    paperSize,
  };
}
