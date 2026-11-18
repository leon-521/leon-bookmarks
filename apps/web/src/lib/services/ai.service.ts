import { api } from '@/lib/api';

export interface AiCategorySuggestion {
  categoryId: string | null;
  categoryName: string;
  confidence: number;
  reason: string;
}

export interface AiTagSuggestion {
  tags: string[];
  reason: string;
}

export interface AiSummary {
  description: string;
  keywords: string[];
}

export interface AiOrganizeResult {
  processed: number;
  categorized: number;
  tagged: number;
  suggestions: {
    bookmarkId: string;
    title: string;
    suggestedCategory: string;
    suggestedCategoryId: string | null;
    confidence: number;
    suggestedTags: string[];
  }[];
}

export interface SimilarBookmark {
  id: string;
  title: string;
  url: string;
  similarity: number;
  reason: string;
}

export interface DuplicateGroup {
  bookmarks: { id: string; title: string; url: string }[];
  reason: string;
}

export const aiService = {
  categorize: (data: { url: string; title: string; description?: string }) =>
    api.post<AiCategorySuggestion>('/ai/categorize', data),
  generateTags: (data: { url: string; title: string; description?: string }) =>
    api.post<AiTagSuggestion>('/ai/tags', data),
  summarize: (data: { url: string; title: string; description?: string }) =>
    api.post<AiSummary>('/ai/summarize', data),
  findSimilar: (bookmarkId: string, limit?: number) =>
    api.get<SimilarBookmark[]>(`/ai/similar/${bookmarkId}`, { params: limit ? { limit: String(limit) } : undefined }),
  organize: (autoApply?: boolean) =>
    api.post<AiOrganizeResult>('/ai/organize', { autoApply }),
  detectDuplicates: () =>
    api.get<{ groups: DuplicateGroup[] }>('/ai/duplicates'),
};
