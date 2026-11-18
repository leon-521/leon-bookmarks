import { api } from '@/lib/api';

export interface Bookmark {
  id: string;
  tenantId: string;
  categoryId: string | null;
  createdById: string;
  title: string;
  url: string;
  description: string | null;
  faviconUrl: string | null;
  ogImageUrl: string | null;
  tags: string[];
  sortOrder: number;
  isPinned: boolean;
  clickCount: number;
  status: 'ACTIVE' | 'BROKEN' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string } | null;
  createdBy?: { id: string; name: string } | null;
}

export interface BookmarkFilters {
  search?: string;
  categoryId?: string;
  tag?: string;
  status?: string;
  isPinned?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateBookmarkData {
  url: string;
  title: string;
  description?: string;
  categoryId?: string;
  tags?: string[];
  isPinned?: boolean;
  sortOrder?: number;
}

export interface UpdateBookmarkData {
  title?: string;
  url?: string;
  description?: string;
  categoryId?: string | null;
  tags?: string[];
  isPinned?: boolean;
  sortOrder?: number;
}

export const bookmarkService = {
  getAll: (filters?: BookmarkFilters) => {
    const params: Record<string, string> = {};
    if (filters?.search) params.search = filters.search;
    if (filters?.categoryId) params.categoryId = filters.categoryId;
    if (filters?.tag) params.tag = filters.tag;
    if (filters?.status) params.status = filters.status;
    if (filters?.isPinned !== undefined) params.isPinned = String(filters.isPinned);
    if (filters?.page) params.page = String(filters.page);
    if (filters?.limit) params.limit = String(filters.limit);
    if (filters?.sortBy) params.sortBy = filters.sortBy;
    if (filters?.sortOrder) params.sortOrder = filters.sortOrder;
    return api.get<PaginatedResponse<Bookmark>>('/bookmarks', { params });
  },

  getOne: (id: string) => api.get<Bookmark>(`/bookmarks/${id}`),
  create: (data: CreateBookmarkData) => api.post<Bookmark>('/bookmarks', data),
  update: (id: string, data: UpdateBookmarkData) => api.patch<Bookmark>(`/bookmarks/${id}`, data),
  delete: (id: string) => api.delete<{ deleted: boolean }>(`/bookmarks/${id}`),

  batchDelete: (ids: string[]) => api.post<{ deletedCount: number }>('/bookmarks/batch/delete', { ids }),
  batchMove: (ids: string[], categoryId: string | null) => api.post<{ updatedCount: number }>('/bookmarks/batch/move', { ids, categoryId }),
  trackClick: (id: string) => api.post(`/bookmarks/${id}/click`),
};
