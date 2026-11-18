export enum BookmarkStatus {
  ACTIVE = 'ACTIVE',
  BROKEN = 'BROKEN',
  ARCHIVED = 'ARCHIVED',
}

export interface Bookmark {
  id: string;
  tenantId: string;
  categoryId?: string | null;
  createdById: string;
  title: string;
  url: string;
  description?: string | null;
  faviconUrl?: string | null;
  ogImageUrl?: string | null;
  tags: string[];
  sortOrder: number;
  isPinned: boolean;
  clickCount: number;
  status: BookmarkStatus;
  lastChecked?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookmarkDto {
  url: string;
  title: string;
  description?: string;
  categoryId?: string;
  tags?: string[];
  faviconUrl?: string;
  ogImageUrl?: string;
}

export interface UpdateBookmarkDto {
  title?: string;
  url?: string;
  description?: string;
  categoryId?: string | null;
  tags?: string[];
  faviconUrl?: string;
  ogImageUrl?: string;
  isPinned?: boolean;
  sortOrder?: number;
}

export interface BookmarkFilters {
  categoryId?: string;
  tags?: string[];
  status?: BookmarkStatus;
  search?: string;
  isPinned?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'title' | 'sortOrder' | 'clickCount';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
