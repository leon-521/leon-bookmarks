import { api } from '@/lib/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  tenantName: string;
  tenantSlug: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface MeResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  createdAt: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
}

export const authService = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<AuthResponse>('/auth/register', data),
  refresh: (refreshToken: string) => api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }),
  me: () => api.get<MeResponse>('/auth/me'),
};
