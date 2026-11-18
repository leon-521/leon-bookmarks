export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: Role;
  provider?: string | null;
  lastLogin?: string | null;
  createdAt: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  tenantName: string;
  tenantSlug: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
