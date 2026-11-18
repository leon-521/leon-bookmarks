import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

interface AiCategorySuggestion {
  categoryId: string | null;
  categoryName: string;
  confidence: number;
  reason: string;
}

interface AiTagSuggestion {
  tags: string[];
  reason: string;
}

interface AiSummary {
  description: string;
  keywords: string[];
}

interface AiOrganizeResult {
  processed: number;
  categorized: number;
  tagged: number;
  suggestions: { bookmarkId: string; title: string; suggestedCategory: string; suggestedTags: string[] }[];
}

interface SimilarBookmark {
  id: string;
  title: string;
  url: string;
  similarity: number;
  reason: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openaiApiKey: string | undefined;
  private openaiBaseUrl: string;
  private model: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openaiBaseUrl = this.configService.get<string>('OPENAI_BASE_URL', 'https://api.openai.com/v1');
    this.model = this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    
    if (this.openaiApiKey) {
      this.logger.log(`AI initialized with model: ${this.model}`);
    } else {
      this.logger.warn('OPENAI_API_KEY not set. AI runs in heuristic mode.');
    }
  }

  // ═══════════════════════════════════════════
  // 1. Auto-Categorize a bookmark
  // ═══════════════════════════════════════════
  async categorize(tenantId: string, url: string, title: string, description?: string): Promise<AiCategorySuggestion> {
    // Get existing categories for this tenant
    const categories = await this.prisma.category.findMany({
      where: { tenantId },
      select: { id: true, name: true, parentId: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (categories.length === 0) {
      return { categoryId: null, categoryName: 'Uncategorized', confidence: 0, reason: 'No categories exist yet.' };
    }

    if (this.openaiApiKey) {
      return this.aiCategorize(categories, url, title, description);
    }
    return this.heuristicCategorize(categories, url, title, description);
  }

  private async aiCategorize(
    categories: { id: string; name: string; parentId: string | null }[],
    url: string, title: string, description?: string,
  ): Promise<AiCategorySuggestion> {
    const categoryList = categories.map(c => `- ${c.name} (id: ${c.id})`).join('\n');
    const prompt = `You are a bookmark categorization assistant. Given a bookmark, suggest the best matching category.

Available categories:
${categoryList}

Bookmark:
- Title: ${title}
- URL: ${url}
${description ? `- Description: ${description}` : ''}

Respond in JSON format only:
{"categoryId": "the-id", "categoryName": "the-name", "confidence": 0.0-1.0, "reason": "brief explanation"}

If no category fits well, use categoryId: null and suggest a new category name.`;

    try {
      const result = await this.callLLM(prompt);
      return JSON.parse(result);
    } catch (error) {
      this.logger.error(`AI categorize failed: ${error}`);
      return this.heuristicCategorize(categories, url, title, description);
    }
  }

  private heuristicCategorize(
    categories: { id: string; name: string; parentId: string | null }[],
    url: string, title: string, description?: string,
  ): AiCategorySuggestion {
    const text = `${title} ${url} ${description || ''}`.toLowerCase();
    
    // Keyword mapping for common categories
    const keywordMap: Record<string, string[]> = {
      'development': ['github', 'stackoverflow', 'dev', 'code', 'programming', 'api', 'sdk', 'npm', 'git', 'docker', 'kubernetes', 'react', 'vue', 'angular', 'node', 'python', 'java', 'rust', 'go', 'typescript'],
      'frontend': ['css', 'html', 'javascript', 'react', 'vue', 'angular', 'svelte', 'next', 'tailwind', 'ui', 'ux', 'responsive', 'browser'],
      'backend': ['server', 'database', 'sql', 'nosql', 'redis', 'postgres', 'mongo', 'api', 'rest', 'graphql', 'microservice', 'node', 'express', 'nestjs', 'django', 'flask', 'spring'],
      'devops': ['deploy', 'ci', 'cd', 'pipeline', 'docker', 'kubernetes', 'k8s', 'aws', 'azure', 'gcp', 'cloud', 'terraform', 'ansible', 'monitoring', 'jenkins', 'vercel', 'netlify'],
      'design': ['figma', 'sketch', 'design', 'ui', 'ux', 'prototype', 'wireframe', 'color', 'typography', 'font', 'icon', 'illustration', 'dribbble', 'behance', 'adobe', 'canva'],
      'ai': ['ai', 'machine learning', 'ml', 'deep learning', 'neural', 'nlp', 'gpt', 'openai', 'huggingface', 'tensorflow', 'pytorch', 'llm', 'chatgpt', 'claude', 'gemini', 'model'],
      'productivity': ['notion', 'trello', 'asana', 'jira', 'linear', 'slack', 'teams', 'calendar', 'todo', 'task', 'project', 'management', 'collaboration', 'docs', 'wiki'],
      'resources': ['docs', 'documentation', 'tutorial', 'guide', 'reference', 'learn', 'course', 'book', 'article', 'blog', 'medium', 'mdn', 'w3schools'],
    };

    let bestMatch: { id: string; name: string } | null = null;
    let bestScore = 0;

    for (const category of categories) {
      const catNameLower = category.name.toLowerCase();
      let score = 0;

      // Direct name match
      if (text.includes(catNameLower)) score += 5;

      // Keyword matching
      for (const [keyword, terms] of Object.entries(keywordMap)) {
        if (catNameLower.includes(keyword)) {
          for (const term of terms) {
            if (text.includes(term)) score += 1;
          }
        }
      }

      // Domain-based matching
      try {
        const domain = new URL(url).hostname.replace('www.', '');
        if (catNameLower.includes(domain.split('.')[0])) score += 3;
      } catch {}

      if (score > bestScore) {
        bestScore = score;
        bestMatch = category;
      }
    }

    if (bestMatch && bestScore >= 2) {
      return {
        categoryId: bestMatch.id,
        categoryName: bestMatch.name,
        confidence: Math.min(bestScore / 10, 0.95),
        reason: `Matched by keyword analysis (score: ${bestScore})`,
      };
    }

    return { categoryId: null, categoryName: 'Uncategorized', confidence: 0.1, reason: 'No strong category match found.' };
  }

  // ═══════════════════════════════════════════
  // 2. Auto-generate tags
  // ═══════════════════════════════════════════
  async generateTags(url: string, title: string, description?: string): Promise<AiTagSuggestion> {
    if (this.openaiApiKey) {
      return this.aiGenerateTags(url, title, description);
    }
    return this.heuristicGenerateTags(url, title, description);
  }

  private async aiGenerateTags(url: string, title: string, description?: string): Promise<AiTagSuggestion> {
    const prompt = `Generate 3-6 relevant tags for this bookmark. Tags should be lowercase, single words or short hyphenated phrases.

Bookmark:
- Title: ${title}
- URL: ${url}
${description ? `- Description: ${description}` : ''}

Respond in JSON format only:
{"tags": ["tag1", "tag2", ...], "reason": "brief explanation"}`;

    try {
      const result = await this.callLLM(prompt);
      return JSON.parse(result);
    } catch {
      return this.heuristicGenerateTags(url, title, description);
    }
  }

  private heuristicGenerateTags(url: string, title: string, description?: string): AiTagSuggestion {
    const text = `${title} ${description || ''}`.toLowerCase();
    const tags: string[] = [];

    // Extract domain as a tag
    try {
      const domain = new URL(url).hostname.replace('www.', '').split('.')[0];
      if (domain.length > 2 && domain.length < 20) tags.push(domain);
    } catch {}

    // Common tech keywords
    const techTerms = ['react', 'vue', 'angular', 'node', 'python', 'java', 'rust', 'go', 'typescript', 'javascript', 'css', 'html', 'docker', 'kubernetes', 'aws', 'api', 'database', 'ai', 'ml', 'design', 'figma', 'git', 'open-source', 'devops', 'cloud', 'serverless', 'nextjs', 'tailwind'];
    for (const term of techTerms) {
      if (text.includes(term) && !tags.includes(term)) tags.push(term);
    }

    // Category keywords
    const categoryTerms = ['tool', 'framework', 'library', 'platform', 'service', 'docs', 'tutorial', 'blog', 'news', 'free', 'paid', 'productivity', 'collaboration'];
    for (const term of categoryTerms) {
      if (text.includes(term) && !tags.includes(term)) tags.push(term);
    }

    return { tags: tags.slice(0, 6), reason: 'Generated from keyword extraction.' };
  }

  // ═══════════════════════════════════════════
  // 3. Summarize a webpage
  // ═══════════════════════════════════════════
  async summarize(url: string, title: string, description?: string): Promise<AiSummary> {
    if (this.openaiApiKey) {
      return this.aiSummarize(url, title, description);
    }
    return { description: description || `${title} - ${url}`, keywords: [] };
  }

  private async aiSummarize(url: string, title: string, description?: string): Promise<AiSummary> {
    const prompt = `Write a concise 1-2 sentence description for this bookmark. Also extract 3-5 keywords.

Bookmark:
- Title: ${title}
- URL: ${url}
${description ? `- Current description: ${description}` : ''}

Respond in JSON format only:
{"description": "concise description", "keywords": ["kw1", "kw2", ...]}`;

    try {
      const result = await this.callLLM(prompt);
      return JSON.parse(result);
    } catch {
      return { description: description || title, keywords: [] };
    }
  }

  // ═══════════════════════════════════════════
  // 4. Find similar bookmarks
  // ═══════════════════════════════════════════
  async findSimilar(tenantId: string, bookmarkId: string, limit: number = 5): Promise<SimilarBookmark[]> {
    const bookmark = await this.prisma.bookmark.findFirst({ where: { id: bookmarkId, tenantId } });
    if (!bookmark) return [];

    const allBookmarks = await this.prisma.bookmark.findMany({
      where: { tenantId, id: { not: bookmarkId }, status: 'ACTIVE' },
      select: { id: true, title: true, url: true, description: true, tags: true },
    });

    if (this.openaiApiKey && allBookmarks.length > 0) {
      return this.aiFindSimilar(bookmark, allBookmarks, limit);
    }
    return this.heuristicFindSimilar(bookmark, allBookmarks, limit);
  }

  private async aiFindSimilar(bookmark: any, candidates: any[], limit: number): Promise<SimilarBookmark[]> {
    const candidateList = candidates.slice(0, 50).map((c, i) => `${i}. "${c.title}" (${c.url})`).join('\n');
    
    const prompt = `Given this bookmark, find the ${limit} most similar ones from the list.

Target bookmark: "${bookmark.title}" (${bookmark.url})
${bookmark.description ? `Description: ${bookmark.description}` : ''}

Candidate bookmarks:
${candidateList}

Respond in JSON format only - array of objects:
[{"index": 0, "similarity": 0.0-1.0, "reason": "why similar"}]`;

    try {
      const result = await this.callLLM(prompt);
      const parsed = JSON.parse(result);
      return parsed.slice(0, limit).map((item: any) => {
        const candidate = candidates[item.index];
        if (!candidate) return null;
        return {
          id: candidate.id,
          title: candidate.title,
          url: candidate.url,
          similarity: item.similarity,
          reason: item.reason,
        };
      }).filter(Boolean);
    } catch {
      return this.heuristicFindSimilar(bookmark, candidates, limit);
    }
  }

  private heuristicFindSimilar(bookmark: any, candidates: any[], limit: number): SimilarBookmark[] {
    const targetWords = new Set(
      `${bookmark.title} ${bookmark.description || ''} ${bookmark.tags?.join(' ') || ''}`.toLowerCase().split(/\W+/).filter((w: string) => w.length > 2)
    );
    let targetDomain = '';
    try { targetDomain = new URL(bookmark.url).hostname.replace('www.', ''); } catch {}

    const scored = candidates.map(c => {
      const words = `${c.title} ${c.description || ''} ${c.tags?.join(' ') || ''}`.toLowerCase().split(/\W+/).filter((w: string) => w.length > 2);
      let score = 0;
      for (const word of words) {
        if (targetWords.has(word)) score++;
      }
      // Domain bonus
      try {
        const domain = new URL(c.url).hostname.replace('www.', '');
        if (domain === targetDomain) score += 3;
      } catch {}
      // Tag overlap
      const commonTags = (c.tags || []).filter((t: string) => (bookmark.tags || []).includes(t));
      score += commonTags.length * 2;

      return { ...c, score, similarity: Math.min(score / 10, 1), reason: `${score} matching signals` };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .filter(s => s.score > 0)
      .map(s => ({ id: s.id, title: s.title, url: s.url, similarity: s.similarity, reason: s.reason }));
  }

  // ═══════════════════════════════════════════
  // 5. Batch auto-organize uncategorized bookmarks
  // ═══════════════════════════════════════════
  async batchOrganize(tenantId: string, autoApply: boolean = false): Promise<AiOrganizeResult> {
    const uncategorized = await this.prisma.bookmark.findMany({
      where: { tenantId, categoryId: null, status: 'ACTIVE' },
      select: { id: true, title: true, url: true, description: true, tags: true },
      take: 50,
    });

    const result: AiOrganizeResult = { processed: uncategorized.length, categorized: 0, tagged: 0, suggestions: [] };

    for (const bookmark of uncategorized) {
      const [catSuggestion, tagSuggestion] = await Promise.all([
        this.categorize(tenantId, bookmark.url, bookmark.title, bookmark.description || undefined),
        bookmark.tags.length === 0 ? this.generateTags(bookmark.url, bookmark.title, bookmark.description || undefined) : Promise.resolve(null),
      ]);

      const suggestion: any = {
        bookmarkId: bookmark.id,
        title: bookmark.title,
        suggestedCategory: catSuggestion.categoryName,
        suggestedCategoryId: catSuggestion.categoryId,
        confidence: catSuggestion.confidence,
        suggestedTags: tagSuggestion?.tags || bookmark.tags,
      };
      result.suggestions.push(suggestion);

      if (autoApply && catSuggestion.categoryId && catSuggestion.confidence >= 0.5) {
        await this.prisma.bookmark.update({
          where: { id: bookmark.id },
          data: {
            categoryId: catSuggestion.categoryId,
            ...(tagSuggestion && tagSuggestion.tags.length > 0 ? { tags: tagSuggestion.tags } : {}),
          },
        });
        result.categorized++;
        if (tagSuggestion) result.tagged++;
      }
    }

    return result;
  }

  // ═══════════════════════════════════════════
  // 6. Detect duplicate/similar bookmarks
  // ═══════════════════════════════════════════
  async detectDuplicates(tenantId: string): Promise<{ groups: { bookmarks: any[]; reason: string }[] }> {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { tenantId, status: 'ACTIVE' },
      select: { id: true, title: true, url: true, description: true },
    });

    const groups: { bookmarks: any[]; reason: string }[] = [];
    const processed = new Set<string>();

    for (const bookmark of bookmarks) {
      if (processed.has(bookmark.id)) continue;

      const duplicates: any[] = [];
      let reason = '';

      for (const other of bookmarks) {
        if (other.id === bookmark.id || processed.has(other.id)) continue;

        // Exact URL match (different from existing skip-duplicates which is import-time)
        try {
          const url1 = new URL(bookmark.url);
          const url2 = new URL(other.url);
          if (url1.hostname === url2.hostname && url1.pathname === url2.pathname) {
            duplicates.push(other);
            reason = 'Same domain and path';
            continue;
          }
        } catch {}

        // Very similar titles
        const similarity = this.titleSimilarity(bookmark.title, other.title);
        if (similarity > 0.8) {
          duplicates.push(other);
          reason = `Similar titles (${Math.round(similarity * 100)}% match)`;
        }
      }

      if (duplicates.length > 0) {
        const group = [bookmark, ...duplicates];
        group.forEach(b => processed.add(b.id));
        groups.push({ bookmarks: group, reason });
      }
    }

    return { groups };
  }

  private titleSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    const wordsB = new Set(b.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    if (wordsA.size === 0 || wordsB.size === 0) return 0;
    let intersection = 0;
    for (const word of wordsA) { if (wordsB.has(word)) intersection++; }
    return (2 * intersection) / (wordsA.size + wordsB.size);
  }

  // ═══════════════════════════════════════════
  // LLM call helper
  // ═══════════════════════════════════════════
  private async callLLM(prompt: string): Promise<string> {
    const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a helpful bookmark organization assistant. Always respond with valid JSON only, no markdown.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content || '';
    // Strip markdown code fences if present
    return content.replace(/^```json\n?/i, '').replace(/\n?```$/i, '').trim();
  }
}
