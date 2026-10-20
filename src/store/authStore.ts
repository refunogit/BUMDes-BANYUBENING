/**
 * Auth store — PIN numerik 6 digit saja (tanpa biometrik).
 * initialize() never auto-logs-in: a cold start always asks for the PIN.
 */
import { create } from 'zustand';

import { initDatabase } from '@/data/database';
import {
  comparePin,
  deleteAllData,
  getPrimaryUser,
  getUserById,
  hashPin,
  setupUser,
  updatePin as updatePinRepo,
  updateUsername as updateUsernameRepo,
  updateDisplayName as updateDisplayNameRepo,
  verifyPin as verifyPinRepo,
  usernameExists,
  type User,
} from '@/data/repositories/authRepository';
import { initStorage } from '@/core/services/storageService';
import { runStartupMaintenance } from '@/core/services/maintenanceService';
import { writeLog } from '@/core/services/logService';
import { showBanner } from './bannerStore';

export type SessionUser = {
  id: string;
  username: string;
  displayName: string;
  role: string;
};

type AuthState = {
  initialized: boolean;
  booting: boolean;
  needsSetup: boolean;
  isAuthenticated: boolean;
  isLocked: boolean;
  user: SessionUser | null;
  pinHash: string | null;
  error: string | null;
  autoCloseNotice: string | null;

  initialize: () => Promise<void>;
  loginWithPin: (pin: string) => Promise<boolean>;
  register: (input: { username: string; pin: string; displayName: string }) => Promise<boolean>;
  verifyAppPin: (pin: string) => Promise<boolean>;
  lock: () => void;
  unlock: () => void;
  logout: () => Promise<void>;
  changePin: (currentPin: string, newPin: string) => Promise<boolean>;
  changeUsername: (currentPin: string, username: string) => Promise<{ ok: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
};

function toSession(user: User | null): SessionUser | null {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name ?? user.username,
    role: user.role,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  initialized: false,
  booting: true,
  needsSetup: true,
  isAuthenticated: false,
  isLocked: false,
  user: null,
  pinHash: null,
  error: null,
  autoCloseNotice: null,

  initialize: async () => {
    if (get().initialized) return;
    set({ booting: true });
    try {
      await initDatabase();
      await initStorage();
      const user = await getPrimaryUser();
      const maintenance = await runStartupMaintenance();
      set({
        initialized: true,
        booting: false,
        needsSetup: !user,
        user: toSession(user),
        pinHash: user?.pin_hash ?? null,
        isAuthenticated: false,
        autoCloseNotice: maintenance.autoClose.closed
          ? 'Tutup Buku Otomatis: sistem telah melakukan tutup buku bulanan, perhitungan dimulai kembali dari awal'
          : null,
      });
      if (maintenance.autoClose.closed) {
        showBanner('Tutup Buku Otomatis: sistem telah melakukan tutup buku bulanan.', { type: 'info', duration: 6000 });
      }
    } catch (error) {
      writeLog('auth', 'initialize failed', error);
      set({ booting: false, initialized: true, error: 'Gagal menyiapkan basis data.' });
    }
  },

  loginWithPin: async (pin) => {
    const state = get();
    if (!state.pinHash) {
      const user = await getPrimaryUser();
      if (!user) return false;
      set({ pinHash: user.pin_hash, user: toSession(user) });
      const ok = await comparePin(pin, user.pin_hash);
      if (ok) set({ isAuthenticated: true, isLocked: false, error: null });
      return ok;
    }
    const ok = await comparePin(pin, state.pinHash);
    if (ok) set({ isAuthenticated: true, isLocked: false, error: null });
    else set({ error: 'PIN salah' });
    return ok;
  },

  register: async (input) => {
    try {
      if (await usernameExists(input.username)) {
        set({ error: 'Username sudah digunakan.' });
        return false;
      }
      const user = await setupUser({
        username: input.username,
        pin: input.pin,
        displayName: input.displayName,
        role: 'admin',
      });
      set({
        needsSetup: false,
        user: toSession(user),
        pinHash: user.pin_hash,
        isAuthenticated: false,
        error: null,
      });
      return true;
    } catch (error) {
      writeLog('auth', 'register failed', error);
      set({ error: 'Gagal membuat akun.' });
      return false;
    }
  },

  verifyAppPin: async (pin) => {
    const { user } = get();
    const fresh = user ? await getUserById(user.id) : await getPrimaryUser();
    const result = await verifyPinRepo(pin, fresh?.id);
    if (result) {
      set({ pinHash: result.pin_hash, isLocked: false, isAuthenticated: true });
      return true;
    }
    return false;
  },

  lock: () => {
    if (get().isAuthenticated) set({ isLocked: true });
  },

  unlock: () => set({ isLocked: false }),

  logout: async () => {
    await deleteAllData();
    set({
      needsSetup: true,
      isAuthenticated: false,
      isLocked: false,
      user: null,
      pinHash: null,
      error: null,
    });
  },

  changePin: async (currentPin, newPin) => {
    const { user, pinHash } = get();
    if (!user) return false;
    const hash = pinHash ?? (await getUserById(user.id))?.pin_hash ?? '';
    if (!(await comparePin(currentPin, hash))) {
      set({ error: 'PIN lama salah.' });
      return false;
    }
    await updatePinRepo(user.id, newPin);
    set({ pinHash: await hashPin(newPin), error: null });
    return true;
  },

  changeUsername: async (currentPin, username) => {
    const { user, pinHash } = get();
    if (!user) return { ok: false, error: 'Sesi tidak ditemukan.' };
    const clean = username.trim().toLowerCase();
    if (clean.length < 3) return { ok: false, error: 'Username minimal 3 karakter.' };
    const hash = pinHash ?? (await getUserById(user.id))?.pin_hash ?? '';
    if (await comparePin(currentPin, hash)) {
      if (clean !== user.username && (await usernameExists(clean))) {
        return { ok: false, error: 'Username sudah digunakan.' };
      }
      await updateUsernameRepo(user.id, clean);
      set({ user: { ...user, username: clean }, error: null });
      return { ok: true };
    }
    return { ok: false, error: 'PIN salah.' };
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    const fresh = await getUserById(user.id);
    if (fresh) set({ user: toSession(fresh), pinHash: fresh.pin_hash });
  },
}));

export async function updateProfileName(name: string): Promise<void> {
  const { user } = useAuthStore.getState();
  if (!user) return;
  await updateDisplayNameRepo(user.id, name);
  await useAuthStore.getState().refreshProfile();
}

export function useIsAdmin(): boolean {
  return useAuthStore((s) => s.user?.role === 'admin');
}
