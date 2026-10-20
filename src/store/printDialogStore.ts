/** Global print feedback dialog (silent auto-reconnect happens before this). */
import { create } from 'zustand';

type PrintDialogState = {
  visible: boolean;
  kind: 'not-connected' | 'preview' | null;
  receiptText: string | null;
  message: string | null;
  open: (kind: 'not-connected' | 'preview', payload: { receiptText?: string; message?: string }) => void;
  close: () => void;
};

export const usePrintDialogStore = create<PrintDialogState>((set) => ({
  visible: false,
  kind: null,
  receiptText: null,
  message: null,
  open: (kind, payload) => set({ visible: true, kind, receiptText: payload.receiptText ?? null, message: payload.message ?? null }),
  close: () => set({ visible: false, kind: null, receiptText: null, message: null }),
}));
