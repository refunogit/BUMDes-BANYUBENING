/**
 * printerService — single source of truth for printer state.
 *
 * Transport: an optional native ESC/POS Bluetooth bridge
 * (`NativeModules.ThermalPrinter`, installed by a custom dev client) is used
 * when present. In Expo Go / stock builds the service falls back to a LOCAL
 * VIRTUAL printer so the whole flow (pairing, verification, test print,
 * reprint preview) stays usable and offline. No network API is involved.
 *
 * Rules implemented here:
 *  - status events: 'terhubung' | 'terputus' | 'memverifikasi'
 *  - connectionLost / disconnected / error events
 *  - heartbeat isConnected every 3s, silent re-verify on demand
 *  - PrintGuard: 128..256 byte chunks, 2s timeout, auto-flush + reconnect
 *  - history: last 20 sessions persisted in app_settings.printer_history
 */
import { NativeModules } from 'react-native';

import { getJsonSetting, getNumberSetting, getSetting, setJsonSetting, setSetting } from '@/data/repositories/settingsRepository';
import { SETTINGS_KEYS } from '@/core/constants/settingsKeys';
import { writeLog } from '@/core/services/logService';
import type { PaperSize, ReceiptInput } from './receiptEngine';
import { buildEscPos } from './receiptEngine';

export type PrinterStatus = 'terhubung' | 'terputus' | 'memverifikasi';
export type PrinterEvent = 'connectionLost' | 'disconnected' | 'error' | 'connected';

export type PrinterDevice = { name: string; mac: string; bonded?: boolean };

export type PrinterHistoryEntry = {
  name: string;
  mac: string;
  connectedAt: string;
  disconnectedAt: string | null;
  prints: number;
};

export type PrintJob = {
  id: string;
  createdAt: string;
  text: string;
  attempts: number;
};

type Listener<T> = (payload: T) => void;

type NativeBridge = {
  scanDevices?: () => Promise<PrinterDevice[]>;
  connect?: (mac: string) => Promise<boolean>;
  disconnect?: () => Promise<void>;
  isConnected?: () => Promise<boolean>;
  write?: (bytes: number[]) => Promise<void>;
};

const VIRTUAL_DEVICE: PrinterDevice = { name: 'Printer Virtual (Demo)', mac: '00:11:22:33:44:55', bonded: true };
const CHUNK_MIN = 128;
const CHUNK_MAX = 256;
const WRITE_TIMEOUT = 2000;

function nativeBridge(): NativeBridge | null {
  const candidate = (NativeModules as Record<string, unknown>).ThermalPrinter as NativeBridge | undefined;
  return candidate ?? null;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timeout`)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

class PrinterService {
  private status: PrinterStatus = 'terputus';
  private mac: string | null = null;
  private name: string | null = null;
  private virtual = true;
  private printsInSession = 0;
  private sessionStart: string | null = null;
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private statusListeners = new Set<Listener<PrinterStatus>>();
  private eventListeners = new Map<PrinterEvent, Set<Listener<unknown>>>();

  getStatus(): PrinterStatus {
    return this.status;
  }

  isVirtualPrinter(): boolean {
    return this.virtual;
  }

  getConnectedMac(): string | null {
    return this.mac;
  }

  getConnectedName(): string | null {
    return this.name;
  }

  onStatus(listener: Listener<PrinterStatus>): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  on(event: PrinterEvent, listener: Listener<unknown>): () => void {
    const set = this.eventListeners.get(event) ?? new Set<Listener<unknown>>();
    set.add(listener);
    this.eventListeners.set(event, set);
    return () => set.delete(listener);
  }

  private emit(event: PrinterEvent, payload?: unknown): void {
    this.eventListeners.get(event)?.forEach((listener) => listener(payload));
  }

  private setStatus(status: PrinterStatus): void {
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  async initialize(): Promise<void> {
    const savedMac = await getSetting(SETTINGS_KEYS.printerMac);
    const savedName = await getSetting(SETTINGS_KEYS.printerName);
    if (savedMac) {
      this.mac = savedMac;
      this.name = savedName;
    }
    this.virtual = !nativeBridge();
    this.startHeartbeat();
  }

  private startHeartbeat(): void {
    if (this.heartbeat) return;
    this.heartbeat = setInterval(() => {
      if (this.status === 'terhubung') void this.verifyConnection(1500, true);
    }, 3000);
  }

  stopHeartbeat(): void {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = null;
  }

  /** Discovery. Virtual mode returns the demo printer, real mode scans 8s. */
  async scanDevices(timeoutMs = 8000): Promise<PrinterDevice[]> {
    const bridge = nativeBridge();
    if (!bridge?.scanDevices) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      this.virtual = true;
      return [VIRTUAL_DEVICE];
    }
    this.virtual = false;
    try {
      const devices = await withTimeout(bridge.scanDevices(), timeoutMs, 'Pemindaian printer');
      return devices;
    } catch (error) {
      this.emit('error', error);
      return [];
    }
  }

  async connect(mac: string, name?: string): Promise<boolean> {
    this.setStatus('memverifikasi');
    this.mac = mac;
    this.name = name ?? mac;
    const bridge = nativeBridge();
    if (!bridge?.connect) {
      this.virtual = true;
      await new Promise((resolve) => setTimeout(resolve, 500));
      this.virtual = true;
      await this.persistConnection();
      this.setStatus('terhubung');
      this.emit('connected', { mac, name: this.name });
      return true;
    }
    try {
      this.virtual = false;
      const ok = await withTimeout(bridge.connect(mac), WRITE_TIMEOUT, 'Koneksi printer');
      if (!ok) throw new Error('connect rejected');
      const verified = await this.verifyConnection(WRITE_TIMEOUT, false);
      if (!verified) throw new Error('verification failed');
      await this.persistConnection();
      this.setStatus('terhubung');
      this.emit('connected', { mac, name: this.name });
      return true;
    } catch (error) {
      writeLog('printer', 'connect failed', error);
      this.setStatus('terputus');
      this.emit('error', error);
      return false;
    }
  }

  private async persistConnection(): Promise<void> {
    const now = new Date().toISOString();
    if (!this.sessionStart) this.sessionStart = now;
    await setSetting(SETTINGS_KEYS.printerMac, this.mac ?? '');
    await setSetting(SETTINGS_KEYS.printerName, this.name ?? '');
    await setSetting(SETTINGS_KEYS.printerConnectedAt, now);
  }

  async disconnect(): Promise<void> {
    const bridge = nativeBridge();
    try {
      if (bridge?.disconnect && !this.virtual) await bridge.disconnect();
    } catch {
      // ignore
    }
    await this.closeSession();
    this.setStatus('terputus');
    this.emit('disconnected');
  }

  private async closeSession(): Promise<void> {
    if (!this.sessionStart || !this.mac) {
      this.sessionStart = null;
      this.printsInSession = 0;
      return;
    }
    try {
      const history = await getJsonSetting<PrinterHistoryEntry[]>(SETTINGS_KEYS.printerHistory, []);
      history.unshift({
        name: this.name ?? this.mac,
        mac: this.mac,
        connectedAt: this.sessionStart,
        disconnectedAt: new Date().toISOString(),
        prints: this.printsInSession,
      });
      await setJsonSetting(SETTINGS_KEYS.printerHistory, history.slice(0, 20));
    } catch (error) {
      writeLog('printer', 'history failed', error);
    }
    this.sessionStart = null;
    this.printsInSession = 0;
  }

  async verifyConnection(timeoutMs = WRITE_TIMEOUT, silent = false): Promise<boolean> {
    if (!this.mac) {
      if (!silent) this.setStatus('terputus');
      return false;
    }
    const bridge = nativeBridge();
    if (!bridge?.isConnected || this.virtual) {
      if (this.status !== 'terhubung') this.setStatus('terhubung');
      return true;
    }
    if (!silent) this.setStatus('memverifikasi');
    try {
      const ok = await withTimeout(bridge.isConnected(), timeoutMs, 'Verifikasi printer');
      if (ok) {
        this.setStatus('terhubung');
        return true;
      }
      this.setStatus('terputus');
      this.emit('connectionLost');
      return false;
    } catch {
      this.setStatus('terputus');
      this.emit('connectionLost');
      return false;
    }
  }

  /** Silent reconnect used before any "printer not connected" dialog. */
  async tryAutoReconnect(): Promise<boolean> {
    if (this.status === 'terhubung') {
      const ok = await this.verifyConnection(WRITE_TIMEOUT, true);
      if (ok) return true;
    }
    if (!this.mac) {
      const savedMac = await getSetting(SETTINGS_KEYS.printerMac);
      if (!savedMac) return false;
      this.mac = savedMac;
      this.name = await getSetting(SETTINGS_KEYS.printerName);
    }
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const ok = await this.connect(this.mac!, this.name ?? undefined);
      if (ok) return true;
    }
    return false;
  }

  private chunkSize(): number {
    return CHUNK_MIN + Math.floor(Math.random() * (CHUNK_MAX - CHUNK_MIN + 1));
  }

  private async writeChunk(bytes: number[], bridge: NativeBridge | null): Promise<void> {
    if (!bridge?.write) {
      await new Promise((resolve) => setTimeout(resolve, 30));
      return;
    }
    await withTimeout(bridge.write(bytes), WRITE_TIMEOUT, 'Tulis printer');
  }

  private async enqueue(text: string): Promise<void> {
    try {
      const queue = await getJsonSetting<PrintJob[]>(SETTINGS_KEYS.printQueue, []);
      queue.push({ id: `${Date.now()}`, createdAt: new Date().toISOString(), text, attempts: 0 });
      await setJsonSetting(SETTINGS_KEYS.printQueue, queue.slice(-20));
    } catch {
      // ignore
    }
  }

  async processQueue(): Promise<number> {
    const queue = await getJsonSetting<PrintJob[]>(SETTINGS_KEYS.printQueue, []);
    if (!queue.length || this.status !== 'terhubung') return 0;
    let sent = 0;
    const remaining: PrintJob[] = [];
    for (const job of queue) {
      try {
        await this.writeText(job.text);
        sent += 1;
      } catch {
        remaining.push({ ...job, attempts: job.attempts + 1 });
      }
    }
    await setJsonSetting(SETTINGS_KEYS.printQueue, remaining);
    return sent;
  }

  private async writeText(text: string): Promise<void> {
    const bytes: number[] = [];
    for (let i = 0; i < text.length; i += 1) bytes.push(text.charCodeAt(i) & 0xff);
    for (let offset = 0; offset < bytes.length; offset += this.chunkSize()) {
      await this.writeChunk(bytes.slice(offset, offset + this.chunkSize()), nativeBridge());
    }
  }

  /**
   * Sends a receipt to the printer. Returns the rendered text so the caller can
   * show a preview when running with the virtual printer.
   */
  async printReceipt(input: ReceiptInput): Promise<{ ok: boolean; text: string; virtual: boolean }> {
    const payload = buildEscPos(input);
    if (this.status !== 'terhubung') {
      const reconnected = await this.tryAutoReconnect();
      if (!reconnected) {
        await this.enqueue(payload.text);
        this.emit('error', new Error('Printer tidak terhubung'));
        return { ok: false, text: payload.text, virtual: this.virtual };
      }
    }
    try {
      if (this.virtual) {
        this.printsInSession += 1;
        writeLog('printer', `virtual print ${payload.template} ${payload.width} cols`);
        return { ok: true, text: payload.text, virtual: true };
      }
      const bridge = nativeBridge();
      const bytes = Array.from(payload.bytes);
      for (let offset = 0; offset < bytes.length; offset += this.chunkSize()) {
        await this.writeChunk(bytes.slice(offset, offset + this.chunkSize()), bridge);
      }
      this.printsInSession += 1;
      setTimeout(() => void this.verifyConnection(1500, true), 1500);
      return { ok: true, text: payload.text, virtual: false };
    } catch (error) {
      writeLog('printer', 'print failed', error);
      this.setStatus('terputus');
      this.emit('connectionLost');
      await this.enqueue(payload.text);
      return { ok: false, text: payload.text, virtual: this.virtual };
    }
  }

  async testPrint(text: string): Promise<{ ok: boolean; text: string; virtual: boolean }> {
    if (this.status !== 'terhubung') {
      const ok = await this.tryAutoReconnect();
      if (!ok) return { ok: false, text, virtual: this.virtual };
    }
    const payload = `TEST PRINT\n${'-'.repeat(32)}\n${text}\n${'-'.repeat(32)}\n\n\n`;
    try {
      await this.writeText(payload);
      this.printsInSession += 1;
      setTimeout(() => void this.verifyConnection(1500, true), 1500);
      return { ok: true, text: payload, virtual: this.virtual };
    } catch (error) {
      writeLog('printer', 'test print failed', error);
      this.setStatus('terputus');
      this.emit('connectionLost');
      return { ok: false, text: payload, virtual: this.virtual };
    }
  }

  async getPaperSize(): Promise<PaperSize> {
    const value = await getNumberSetting(SETTINGS_KEYS.printerPaperSize, 58);
    return value === 80 ? '80' : '58';
  }

  async getAutoPrint(): Promise<boolean> {
    return (await getSetting(SETTINGS_KEYS.printerAutoPrint)) === '1';
  }

  async getHistory(): Promise<PrinterHistoryEntry[]> {
    return getJsonSetting<PrinterHistoryEntry[]>(SETTINGS_KEYS.printerHistory, []);
  }
}

export const printerService = new PrinterService();
