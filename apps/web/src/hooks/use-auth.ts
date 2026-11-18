import { create } from 'zustand';
import { authService, type AuthResponse } from '@/lib/services';

interface AuthState {
  user: AuthResponse['user'] | null;
  tenant: AuthResponse['tenant'] | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; tenantName: string; tenantSlug: string }) => Promise<void>;
  logout: () => void;
  setFromResponse: (res: AuthResponse) => void;
  updateTenantInfo: (patch: Partial<AuthResponse['tenant']>) => void;
  hydrate: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  tenant: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isHydrated: false,
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
      isHydrated: true,
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
      isHydrated: true,
      isLoading: false,
    });
  },

  updateTenantInfo: (patch) => {
    const current = get().tenant;
    if (!current) return;
    const updated = { ...current, ...patch };
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_tenant', JSON.stringify(updated));
    }
    set({ tenant: updated });
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
          isHydrated: true,
        });
        return;
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_tenant');
      }
    }
    set({ isHydrated: true });
  },
}));
