import { api } from '@/lib/api';

export interface Category {
  id: string;
  tenantId: string;
  parentId: string | null;
  name: string;
  icon: string | null;
  sortOrder: number;
  createdAt: string;
  children?: Category[];
  _count?: { bookmarks: number };
}

export interface CreateCategoryData {
  name: string;
  parentId?: string;
  icon?: string;
}

export interface UpdateCategoryData {
  name?: string;
  parentId?: string | null;
  icon?: string;
  sortOrder?: number;
}

export const categoryService = {
  getAll: () => api.get<Category[]>('/categories'),
  getTree: () => api.get<Category[]>('/categories/tree'),
  getOne: (id: string) => api.get<Category>(`/categories/${id}`),
  create: (data: CreateCategoryData) => api.post<Category>('/categories', data),
  update: (id: string, data: UpdateCategoryData) => api.patch<Category>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
  reorder: (orderedIds: string[]) => api.post('/categories/reorder', { orderedIds }),
};
