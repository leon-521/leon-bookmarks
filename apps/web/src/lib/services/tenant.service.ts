import { api } from '@/lib/api';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  customDomain: string | null;
  plan: string;
  logo: string | null;
  favicon: string | null;
  themeConfig: Record<string, any> | null;
  maxBookmarks: number;
  maxMembers: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTenantData {
  name?: string;
  logo?: string;
  favicon?: string;
  customDomain?: string;
}

export interface UpdateThemeData {
  colorScheme?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: number;
  cardSpacing?: number;
  layout?: string;
  fontFamily?: string;
  preset?: string;
}

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'VIEWER';
  avatarUrl: string | null;
  lastLogin: string | null;
  createdAt: string;
  _count?: { bookmarks: number };
}

export interface WorkspaceMembersResponse {
  members: WorkspaceMember[];
  quota: { used: number; limit: number; plan: string };
}

export const tenantService = {
  getOne: (id: string) => api.get<Tenant>(`/tenants/${id}`),
  getBySlug: (slug: string) => api.get<Tenant>(`/tenants/slug/${slug}`),
  update: (id: string, data: UpdateTenantData) => api.patch<Tenant>(`/tenants/${id}`, data),
  updateTheme: (id: string, data: UpdateThemeData) =>
    api.patch<Tenant>(`/tenants/${id}/theme`, { themeConfig: data }),
  listMembers: () => api.get<WorkspaceMembersResponse>('/tenants/members'),
  inviteMember: (data: { email: string; name: string; role?: string; password?: string }) =>
    api.post<WorkspaceMember>('/tenants/members/invite', data),
  updateMemberRole: (memberId: string, role: string) =>
    api.patch<WorkspaceMember>(`/tenants/members/${memberId}/role`, { role }),
  removeMember: (memberId: string) =>
    api.delete<{ deleted: boolean }>(`/tenants/members/${memberId}`),
};
