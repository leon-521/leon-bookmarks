import { api } from '@/lib/api';
import type { Bookmark } from './bookmark.service';
import type { Category } from './category.service';

export interface PortalData {
  tenant: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    favicon: string | null;
    themeConfig: Record<string, any> | null;
  };
  categories: (Category & { children: Category[] })[];
  bookmarks: Bookmark[];
  stats: {
    totalBookmarks: number;
    totalCategories: number;
  };
}

export const portalService = {
  getData: (slug: string) => api.get<PortalData>(`/portal/${slug}`),
  search: (slug: string, query: string) => api.get<Bookmark[]>(`/portal/${slug}/search`, { params: { q: query } }),
  getByCategory: (slug: string, categoryId: string) => api.get<Bookmark[]>(`/portal/${slug}/category/${categoryId}`),
};
