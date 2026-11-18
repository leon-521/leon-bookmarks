import { create } from 'zustand';
import type { User } from '@/lib/mock-data';
import { mockUser } from '@/lib/mock-data';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; tenantName: string; tenantSlug: string }) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: mockUser,
  token: 'mock-token',
  isAuthenticated: true,
  isLoading: false,

  login: async (_email: string, _password: string) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    set({
      user: mockUser,
      token: 'mock-jwt-token',
      isAuthenticated: true,
      isLoading: false,
    });
  },

  register: async (_data) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    set({
      user: mockUser,
      token: 'mock-jwt-token',
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setUser: (user: User) => {
    set({ user });
  },
}));
