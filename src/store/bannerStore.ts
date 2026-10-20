/** Central notification banner (F4) + snackbar actions. */
import { create } from 'zustand';

export type BannerType = 'info' | 'success' | 'error' | 'warning';

export type BannerAction = { label: string; onPress: () => void };

export type BannerMessage = {
  id: number;
  message: string;
  type: BannerType;
  duration: number;
  action?: BannerAction;
};

type BannerState = {
  current: BannerMessage | null;
  show: (message: string, options?: { type?: BannerType; duration?: number; action?: BannerAction }) => void;
  hide: () => void;
};

let counter = 0;

export const useBannerStore = create<BannerState>((set) => ({
  current: null,
  show: (message, options) => {
    counter += 1;
    set({
      current: {
        id: counter,
        message,
        type: options?.type ?? 'info',
        duration: options?.duration ?? 4000,
        action: options?.action,
      },
    });
  },
  hide: () => set({ current: null }),
}));

export const showBanner = (
  message: string,
  options?: { type?: BannerType; duration?: number; action?: BannerAction },
): void => useBannerStore.getState().show(message, options);
