import { create } from 'zustand';
import { authService, type AuthResponse, type MeResponse } from '@/lib/services';

interface AuthState {
  user: AuthResponse['user'] | null;
  tenant: AuthResponse['tenant'] | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; tenantName: string; tenantSlug: string }) => Promise<void>;
  logout: () => void;
  setFromResponse: (res: AuthResponse) => void;
  hydrate: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  tenant: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await authService.login({ email, password });
      get().setFromResponse(res);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await authService.register(data);
      get().setFromResponse(res);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_tenant');
    }
    set({
      user: null,
      tenant: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setFromResponse: (res: AuthResponse) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', res.accessToken);
      localStorage.setItem('refresh_token', res.refreshToken);
      localStorage.setItem('auth_user', JSON.stringify(res.user));
      localStorage.setItem('auth_tenant', JSON.stringify(res.tenant));
    }
    set({
      user: res.user,
      tenant: res.tenant,
      token: res.accessToken,
      refreshToken: res.refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    const tenantStr = localStorage.getItem('auth_tenant');
    if (token && userStr && tenantStr) {
      try {
        set({
          token,
          refreshToken: localStorage.getItem('refresh_token'),
          user: JSON.parse(userStr),
          tenant: JSON.parse(tenantStr),
          isAuthenticated: true,
        });
      } catch {
        // corrupted data, clear it
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_tenant');
      }
    }
  },
}));
