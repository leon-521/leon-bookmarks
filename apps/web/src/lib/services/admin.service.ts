import { api } from '@/lib/api';

export const adminService = {
  getAnalytics: () => api.get<any>('/admin/analytics'),
  listTenants: (params?: Record<string, string>) => api.get<any>('/admin/tenants', { params }),
  getTenant: (id: string) => api.get<any>(`/admin/tenants/${id}`),
  updateTenant: (id: string, data: any) => api.patch<any>(`/admin/tenants/${id}`, data),
  freezeTenant: (id: string) => api.patch<any>(`/admin/tenants/${id}/freeze`),
  activateTenant: (id: string) => api.patch<any>(`/admin/tenants/${id}/activate`),
  deleteTenant: (id: string) => api.delete<any>(`/admin/tenants/${id}`),
  listUsers: (params?: Record<string, string>) => api.get<any>('/admin/users', { params }),
  updateUserRole: (id: string, role: string) => api.patch<any>(`/admin/users/${id}/role`, { role }),
  deleteUser: (id: string) => api.delete<any>(`/admin/users/${id}`),

  // AI Providers
  listAiProviders: () => api.get<any>('/admin/ai-providers'),
  createAiProvider: (data: { name: string; baseUrl: string; apiKey: string; model?: string; isDefault?: boolean; description?: string }) =>
    api.post<any>('/admin/ai-providers', data),
  updateAiProvider: (id: string, data: any) => api.patch<any>(`/admin/ai-providers/${id}`, data),
  setDefaultAiProvider: (id: string) => api.patch<any>(`/admin/ai-providers/${id}/default`),
  deleteAiProvider: (id: string) => api.delete<any>(`/admin/ai-providers/${id}`),
  testAiProvider: (id: string) => api.post<any>(`/admin/ai-providers/${id}/test`),
};
