export interface Category {
  id: string;
  tenantId: string;
  parentId?: string | null;
  name: string;
  icon?: string | null;
  sortOrder: number;
  createdAt: string;
  children?: Category[];
  _count?: {
    bookmarks: number;
  };
}

export interface CreateCategoryDto {
  name: string;
  parentId?: string;
  icon?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  parentId?: string | null;
  icon?: string;
  sortOrder?: number;
}

export interface ReorderCategoryDto {
  items: { id: string; sortOrder: number; parentId?: string | null }[];
}
