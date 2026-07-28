'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  pinVerified: boolean;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setPinVerified: (verified: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      pinVerified: false,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
        }
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },
      setPinVerified: (verified) => set({ pinVerified: verified }),
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('pin_code');
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, pinVerified: false });
      },
    }),
    {
      name: 'bumdes-auth',
      partialize: (state) => ({ user: state.user, pinVerified: state.pinVerified }),
    }
  )
);
