import { Injectable, Logger } from '@nestjs/common';
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

interface AiProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {
    this.logger.log('AI service initialized — provider config loaded from database');
  }

  /**
   * Load AI provider config from database (the default active provider).
   * Returns null if no active provider is configured.
   */
  private async getProviderConfig(): Promise<AiProviderConfig | null> {
    // Try to find the default active provider first
    let provider = await this.prisma.aiProvider.findFirst({
      where: { isDefault: true, isActive: true },
      select: { apiKey: true, baseUrl: true, model: true },
    });
    // Fallback to any active provider
    if (!provider) {
      provider = await this.prisma.aiProvider.findFirst({
        where: { isActive: true },
        select: { apiKey: true, baseUrl: true, model: true },
        orderBy: { createdAt: 'asc' },
      });
    }
    return provider || null;
  }

  private get isAiEnabled(): Promise<boolean> {
    return this.getProviderConfig().then(c => !!c);
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

    const config = await this.getProviderConfig();
    if (config) {
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
    const config = await this.getProviderConfig();
    if (config) {
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
    const config = await this.getProviderConfig();
    if (config) {
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

    const config = await this.getProviderConfig();
    if (config && allBookmarks.length > 0) {
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
  // 7. AI Semantic Copilot / Natural Language Q&A
  // ═══════════════════════════════════════════
  async askWorkspace(tenantId: string, question: string) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { tenantId, status: { not: 'ARCHIVED' } },
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ isPinned: 'desc' }, { clickCount: 'desc' }],
      take: 120,
    });

    const queryTokens = question
      .toLowerCase()
      .split(/[\s,，.。?？!！/\\|]+/)
      .filter((t) => t.length >= 2);

    const scored = bookmarks.map((b) => {
      const hay = `${b.title} ${b.description || ''} ${b.url} ${b.tags.join(' ')} ${b.category?.name || ''}`.toLowerCase();
      let score = 0;
      for (const token of queryTokens) {
        if (b.title.toLowerCase().includes(token)) score += 4;
        if (b.tags.some((tag) => tag.toLowerCase().includes(token))) score += 3;
        if ((b.category?.name || '').toLowerCase().includes(token)) score += 2;
        if (hay.includes(token)) score += 1;
      }
      return { bookmark: b, score };
    });

    const matched = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((s) => s.bookmark);

    const contextItems = matched.length > 0 ? matched : bookmarks.slice(0, 6);

    const config = await this.getProviderConfig();
    if (config && contextItems.length > 0) {
      const contextText = contextItems
        .map(
          (b, i) =>
            `[${i + 1}] Title: ${b.title} | URL: ${b.url} | Category: ${b.category?.name || 'Uncategorized'} | Tags: ${b.tags.join(', ')} | Desc: ${b.description || ''}`,
        )
        .join('\n');

      const prompt = `Answer the user's question based on their team's saved bookmarks. Respond in the same language as the user's question.

Question: ${question}

Workspace Bookmarks:
${contextText}

Respond in JSON format only:
{
  "answer": "helpful markdown answer referencing the matched bookmarks",
  "sourceIndices": [1, 2],
  "followUps": ["suggested follow-up question 1", "suggested follow-up question 2"]
}`;

      try {
        const raw = await this.callLLM(prompt);
        const parsed = JSON.parse(raw);
        const sources = (parsed.sourceIndices || [])
          .map((idx: number) => contextItems[idx - 1])
          .filter(Boolean)
          .map((b: any) => ({
            id: b.id,
            title: b.title,
            url: b.url,
            categoryName: b.category?.name || null,
            tags: b.tags,
          }));

        return {
          answer: parsed.answer,
          sources: sources.length > 0 ? sources : matched.map((b) => ({
            id: b.id,
            title: b.title,
            url: b.url,
            categoryName: b.category?.name || null,
            tags: b.tags,
          })),
          followUps: parsed.followUps || [],
          mode: 'llm',
        };
      } catch (err) {
        this.logger.warn(`AI ask fallback triggered: ${err}`);
      }
    }

    if (matched.length === 0) {
      return {
        answer: `暂未在当前工作区书签库中找到与「${question}」直接匹配的书签。你可以尝试使用更具体的技术栈、工具名或标签关键词检索。`,
        sources: [],
        followUps: ['有哪些常用开发工具？', '查看 AI 与机器学习相关书签', '有哪些设计协作资源？'],
        mode: 'heuristic',
      };
    }

    const summaryLines = matched.map(
      (b) => `• **${b.title}** (${b.category?.name || '未分类'}) — ${b.description || b.url}`,
    );

    return {
      answer: `在团队书签库中为你找到 **${matched.length}** 个与「${question}」高度相关的资源：\n\n${summaryLines.join('\n')}`,
      sources: matched.map((b) => ({
        id: b.id,
        title: b.title,
        url: b.url,
        categoryName: b.category?.name || null,
        tags: b.tags,
      })),
      followUps: ['按分类整理未归档书签', '检查这些链接是否可访问', '查找类似的开发与效率工具'],
      mode: 'heuristic',
    };
  }

  // ═══════════════════════════════════════════
  // 8. AI Taxonomy Architect (Suggest & Apply Category Tree)
  // ═══════════════════════════════════════════
  async suggestTaxonomy(tenantId: string) {
    const [bookmarks, existingCategories] = await Promise.all([
      this.prisma.bookmark.findMany({
        where: { tenantId, status: 'ACTIVE' },
        select: { id: true, title: true, url: true, description: true, tags: true, categoryId: true },
        take: 100,
      }),
      this.prisma.category.findMany({
        where: { tenantId },
        select: { id: true, name: true },
      }),
    ]);

    const existingNames = new Set(existingCategories.map((c) => c.name.toLowerCase()));

    const config = await this.getProviderConfig();
    if (config && bookmarks.length > 0) {
      const sample = bookmarks
        .slice(0, 60)
        .map((b) => `- (${b.id}) ${b.title} [${b.url}] tags:${b.tags.join(',')}`)
        .join('\n');

      const prompt = `Analyze these workspace bookmarks and design 3-6 clean top-level categories (avoid duplicating existing categories if already sufficient, or group uncategorized bookmarks).

Existing categories: ${existingCategories.map((c) => c.name).join(', ') || 'None'}

Bookmarks:
${sample}

Respond in JSON format only:
{
  "proposals": [
    {
      "name": "Category Name",
      "icon": "code|palette|brain|cloud|zap|book-open|shield|database",
      "description": "What belongs here",
      "bookmarkIds": ["uuid1", "uuid2"]
    }
  ]
}`;

      try {
        const raw = await this.callLLM(prompt);
        const parsed = JSON.parse(raw);
        return {
          proposals: (parsed.proposals || []).map((p: any) => ({
            ...p,
            alreadyExists: existingNames.has(String(p.name || '').toLowerCase()),
            matchCount: Array.isArray(p.bookmarkIds) ? p.bookmarkIds.length : 0,
          })),
        };
      } catch (err) {
        this.logger.warn(`AI taxonomy fallback: ${err}`);
      }
    }

    const buckets: { name: string; icon: string; description: string; keywords: string[] }[] = [
      { name: 'AI & LLM Tools', icon: 'brain', description: '大模型、AI 编程助手与推理平台', keywords: ['ai', 'gpt', 'llm', 'openai', 'huggingface', 'claude', 'model', 'ml'] },
      { name: 'Frontend & UI', icon: 'layout', description: '前端框架、组件库与样式工程', keywords: ['react', 'next', 'vue', 'tailwind', 'css', 'ui', 'npm', 'frontend'] },
      { name: 'Cloud & DevOps', icon: 'cloud', description: '容器部署、CI/CD 与云基础设施', keywords: ['docker', 'vercel', 'cloud', 'deploy', 'k8s', 'aws', 'devops', 'server'] },
      { name: 'Design & Creative', icon: 'palette', description: '界面设计、原型协作与灵感素材', keywords: ['figma', 'design', 'dribbble', 'unsplash', 'font', 'color', 'adobe'] },
      { name: 'Team Productivity', icon: 'zap', description: '知识库、项目管理与团队协作', keywords: ['notion', 'linear', 'docs', 'wiki', 'project', 'agile', 'slack'] },
      { name: 'Developer Docs', icon: 'book-open', description: '技术规范、API 手册与学习教程', keywords: ['mdn', 'documentation', 'guide', 'reference', 'prisma', 'stripe', 'api'] },
    ];

    const proposals = buckets
      .map((bucket) => {
        const matchedIds = bookmarks
          .filter((b) => {
            const text = `${b.title} ${b.url} ${b.description || ''} ${b.tags.join(' ')}`.toLowerCase();
            return bucket.keywords.some((kw) => text.includes(kw));
          })
          .map((b) => b.id);

        return {
          name: bucket.name,
          icon: bucket.icon,
          description: bucket.description,
          bookmarkIds: matchedIds,
          matchCount: matchedIds.length,
          alreadyExists: existingNames.has(bucket.name.toLowerCase()),
        };
      })
      .filter((p) => p.matchCount > 0 || !p.alreadyExists);

    return { proposals };
  }

  async applyTaxonomy(
    tenantId: string,
    proposals: { name: string; icon?: string; bookmarkIds?: string[] }[],
  ) {
    let createdCategories = 0;
    let assignedBookmarks = 0;

    for (const item of proposals) {
      if (!item.name?.trim()) continue;
      let category = await this.prisma.category.findFirst({
        where: { tenantId, name: item.name.trim() },
      });

      if (!category) {
        category = await this.prisma.category.create({
          data: {
            tenantId,
            name: item.name.trim(),
            icon: item.icon || 'folder',
            sortOrder: createdCategories,
          },
        });
        createdCategories++;
      }

      if (item.bookmarkIds && item.bookmarkIds.length > 0) {
        const res = await this.prisma.bookmark.updateMany({
          where: {
            tenantId,
            id: { in: item.bookmarkIds },
            categoryId: null,
          },
          data: { categoryId: category.id },
        });
        assignedBookmarks += res.count;
      }
    }

    return { createdCategories, assignedBookmarks };
  }

  // ═══════════════════════════════════════════
  // 9. AI Link Health Check & Alternative Finder
  // ═══════════════════════════════════════════
  async checkLinksHealth(tenantId: string, limit: number = 25) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { tenantId, status: { not: 'ARCHIVED' } },
      orderBy: [{ lastChecked: 'asc' }, { createdAt: 'desc' }],
      take: Math.min(limit, 50),
      select: { id: true, title: true, url: true, description: true, status: true },
    });

    const results: {
      id: string;
      title: string;
      url: string;
      healthy: boolean;
      httpStatus: number | null;
      latencyMs: number;
      waybackUrl?: string;
      aiAlternative?: string;
    }[] = [];

    for (const bm of bookmarks) {
      const start = Date.now();
      let healthy = false;
      let httpStatus: number | null = null;

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(bm.url, {
          method: 'HEAD',
          redirect: 'follow',
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeonBookmarksHealthBot/1.0)' },
        });
        clearTimeout(timer);
        httpStatus = res.status;
        healthy = res.status >= 200 && res.status < 400;
      } catch {
        healthy = false;
      }

      const latencyMs = Date.now() - start;
      const newStatus = healthy ? 'ACTIVE' : 'BROKEN';

      await this.prisma.bookmark.update({
        where: { id: bm.id },
        data: { status: newStatus, lastChecked: new Date() },
      });

      results.push({
        id: bm.id,
        title: bm.title,
        url: bm.url,
        healthy,
        httpStatus,
        latencyMs,
        ...(healthy
          ? {}
          : {
              waybackUrl: `https://web.archive.org/web/*/${bm.url}`,
              aiAlternative: this.suggestBrokenAlternative(bm.title, bm.url),
            }),
      });
    }

    const brokenCount = results.filter((r) => !r.healthy).length;
    return {
      checked: results.length,
      healthyCount: results.length - brokenCount,
      brokenCount,
      results,
    };
  }

  private suggestBrokenAlternative(title: string, url: string): string {
    const text = `${title} ${url}`.toLowerCase();
    if (text.includes('font') || text.includes('icon')) return '可考虑迁移至 Google Fonts 或 Lucide Icons';
    if (text.includes('doc') || text.includes('api')) return '建议通过 Wayback Machine 查看快照，或在官方文档站检索新版路径';
    if (text.includes('ai') || text.includes('gpt')) return '建议检查该 AI 服务是否更新了新域名或 API 控制台入口';
    return '链接无法访问，建议查看 Internet Archive 快照或替换为最新官方域名';
  }

  // ═══════════════════════════════════════════
  // LLM call helper
  // ═══════════════════════════════════════════
  private async callLLM(prompt: string): Promise<string> {
    const config = await this.getProviderConfig();
    if (!config) {
      throw new Error('No active AI provider configured. Add one in Super Admin → AI Providers.');
    }

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: 'You are a helpful bookmark organization assistant. Always respond with valid JSON only, no markdown.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 800,
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
