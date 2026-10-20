/** UI mirror of printerService (never stores status independently). */
import { create } from 'zustand';

import { printerService, type PrinterDevice, type PrinterHistoryEntry, type PrinterStatus } from '@/features/printer/printerService';
import { SETTINGS_KEYS } from '@/core/constants/settingsKeys';
import { getSetting, setSetting } from '@/data/repositories/settingsRepository';
import { showBanner } from './bannerStore';

type PrinterState = {
  status: PrinterStatus;
  deviceName: string | null;
  mac: string | null;
  paperSize: '58' | '80';
  autoPrint: boolean;
  isVirtual: boolean;
  scanning: boolean;
  devices: PrinterDevice[];
  history: PrinterHistoryEntry[];
  initialized: boolean;
  initialize: () => Promise<void>;
  scan: () => Promise<void>;
  connect: (device: PrinterDevice) => Promise<boolean>;
  disconnect: () => Promise<void>;
  setPaperSize: (size: '58' | '80') => Promise<void>;
  setAutoPrint: (enabled: boolean) => Promise<void>;
  refreshHistory: () => Promise<void>;
  verify: () => Promise<void>;
};

export const usePrinterStore = create<PrinterState>((set, get) => ({
  status: 'terputus',
  deviceName: null,
  mac: null,
  paperSize: '58',
  autoPrint: false,
  isVirtual: true,
  scanning: false,
  devices: [],
  history: [],
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;
    await printerService.initialize();
    printerService.onStatus((status) => set({ status }));
    printerService.on('connectionLost', () => {
      set({ status: printerService.getStatus() });
      showBanner('Koneksi printer terputus.', { type: 'warning' });
    });
    printerService.on('error', () => set({ status: printerService.getStatus() }));
    const paper = await getSetting(SETTINGS_KEYS.printerPaperSize);
    const auto = await getSetting(SETTINGS_KEYS.printerAutoPrint);
    set({
      initialized: true,
      status: printerService.getStatus(),
      mac: printerService.getConnectedMac(),
      deviceName: printerService.getConnectedName(),
      isVirtual: printerService.isVirtualPrinter(),
      paperSize: paper === '80' ? '80' : '58',
      autoPrint: auto === '1',
      history: await printerService.getHistory(),
    });
  },

  scan: async () => {
    set({ scanning: true });
    try {
      const devices = await printerService.scanDevices(8000);
      set({ devices, isVirtual: printerService.isVirtualPrinter() });
    } finally {
      set({ scanning: false });
    }
  },

  connect: async (device) => {
    const ok = await printerService.connect(device.mac, device.name);
    set({
      status: printerService.getStatus(),
      mac: printerService.getConnectedMac(),
      deviceName: printerService.getConnectedName(),
      isVirtual: printerService.isVirtualPrinter(),
    });
    return ok;
  },

  disconnect: async () => {
    await printerService.disconnect();
    set({ status: printerService.getStatus(), deviceName: null });
    set({ history: await printerService.getHistory() });
  },

  setPaperSize: async (size) => {
    await setSetting(SETTINGS_KEYS.printerPaperSize, size);
    set({ paperSize: size });
  },

  setAutoPrint: async (enabled) => {
    await setSetting(SETTINGS_KEYS.printerAutoPrint, enabled ? '1' : '0');
    set({ autoPrint: enabled });
  },

  refreshHistory: async () => set({ history: await printerService.getHistory() }),

  verify: async () => {
    const ok = await printerService.verifyConnection(2000, false);
    set({ status: printerService.getStatus() });
    if (!ok && printerService.getConnectedMac()) {
      await printerService.tryAutoReconnect();
      set({ status: printerService.getStatus() });
    }
  },
}));
