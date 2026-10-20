/**
 * usePrintFlow v2 — tries a silent reconnect (tryAutoReconnect) before any
 * "Printer Tidak Terhubung" dialog. Auto-print is fire-and-forget.
 */
import { useCallback } from 'react';

import { getTransactionWithDetails } from '@/data/repositories/transactionRepository';
import { printerService } from './printerService';
import { receiptInputFromTransaction } from './receiptBuilder';
import { usePrintDialogStore } from '@/store/printDialogStore';
import { usePrinterStore } from '@/store/printerStore';
import { writeLog } from '@/core/services/logService';

export function usePrintFlow(): {
  printTransactionById: (transactionId: string, options?: { auto?: boolean }) => Promise<boolean>;
} {
  const printTransactionById = useCallback(async (transactionId: string, options?: { auto?: boolean }) => {
    try {
      const trx = await getTransactionWithDetails(transactionId);
      if (!trx) return false;
      const input = await receiptInputFromTransaction(trx);
      if (printerService.getStatus() !== 'terhubung') {
        await printerService.tryAutoReconnect();
      }
      const result = await printerService.printReceipt(input);
      const printerState = usePrinterStore.getState();
      if (!result.ok) {
        if (!options?.auto) {
          usePrintDialogStore.getState().open('not-connected', {
            message: 'Printer Tidak Terhubung',
            receiptText: result.text,
          });
        }
        return false;
      }
      if (result.virtual && !options?.auto && !printerState.isVirtual) {
        usePrintDialogStore.getState().open('preview', { receiptText: result.text });
      }
      return true;
    } catch (error) {
      writeLog('print-flow', 'print failed', error);
      return false;
    }
  }, []);

  return { printTransactionById };
}
