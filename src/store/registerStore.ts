/** Draft data between register step 1 and step 2 (in-memory only). */
import { create } from 'zustand';

type RegisterDraft = {
  adminName: string;
  storeName: string;
  username: string;
  logoPath: string | null;
  setDraft: (draft: Partial<Omit<RegisterDraft, 'setDraft' | 'reset'>>) => void;
  reset: () => void;
};

export const useRegisterStore = create<RegisterDraft>((set) => ({
  adminName: '',
  storeName: '',
  username: '',
  logoPath: null,
  setDraft: (draft) => set(draft),
  reset: () => set({ adminName: '', storeName: '', username: '', logoPath: null }),
}));
