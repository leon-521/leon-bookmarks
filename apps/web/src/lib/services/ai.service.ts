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

export interface AiAskResponse {
  answer: string;
  sources: {
    id: string;
    title: string;
    url: string;
    categoryName: string | null;
    tags: string[];
  }[];
  followUps: string[];
  mode: 'llm' | 'heuristic';
}

export interface TaxonomyProposal {
  name: string;
  icon: string;
  description: string;
  bookmarkIds: string[];
  matchCount: number;
  alreadyExists: boolean;
}

export interface HealthCheckResult {
  checked: number;
  healthyCount: number;
  brokenCount: number;
  results: {
    id: string;
    title: string;
    url: string;
    healthy: boolean;
    httpStatus: number | null;
    latencyMs: number;
    waybackUrl?: string;
    aiAlternative?: string;
  }[];
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
  ask: (question: string) =>
    api.post<AiAskResponse>('/ai/ask', { question }),
  suggestTaxonomy: () =>
    api.post<{ proposals: TaxonomyProposal[] }>('/ai/taxonomy/suggest'),
  applyTaxonomy: (proposals: { name: string; icon?: string; bookmarkIds?: string[] }[]) =>
    api.post<{ createdCategories: number; assignedBookmarks: number }>('/ai/taxonomy/apply', { proposals }),
  healthCheck: (limit?: number) =>
    api.post<HealthCheckResult>('/ai/health-check', { limit }),
};
