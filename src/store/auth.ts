// src/store/auth.ts
import { create } from 'zustand';
import { AuthUser, loginTelegram, clearTokens } from '../api/client';

interface AuthState {
  user:      AuthUser | null;
  isLoading: boolean;
  error:     string | null;
  login:     (initData: string) => Promise<void>;
  logout:    () => void;
  setUser:   (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:      null,
  isLoading: false,
  error:     null,

  login: async (initData) => {
    set({ isLoading: true, error: null });
    try {
      const user = await loginTelegram(initData);
      if (user.role === 'client') {
        throw new Error('Доступ запрещён. Эта панель только для менеджеров.');
      }
      set({ user, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  logout: () => {
    clearTokens();
    set({ user: null });
  },

  setUser: (user) => set({ user }),
}));

// ── Хелперы для проверки роли ─────────────────────────────────────────────
export const isManager = (user: AuthUser | null) =>
  user?.role === 'manager' || user?.role === 'admin';

export const isAdmin = (user: AuthUser | null) =>
  user?.role === 'admin';
