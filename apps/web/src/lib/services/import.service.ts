import { api } from '@/lib/api';

export interface ImportResult {
  importedBookmarks: number;
  importedCategories: number;
  skippedDuplicates: number;
  errors: string[];
}

export interface ImportHtmlOptions {
  content: string;
  createCategories?: boolean;
  skipDuplicates?: boolean;
  defaultCategoryId?: string;
}

export interface ExportResult {
  format: 'html' | 'json' | 'csv';
  filename: string;
  content: string;
}

export const importService = {
  importHtml: (data: ImportHtmlOptions) => api.post<ImportResult>('/import/html', data),
  importJson: (content: string) => api.post<ImportResult>('/import/json', { content }),
  exportBookmarks: (format: 'html' | 'json' | 'csv' = 'html') =>
    api.get<ExportResult>('/import/export', { params: { format } }),
};
