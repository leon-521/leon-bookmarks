'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Globe, X, Loader2, Sparkles, Wand2, Tags, FolderTree } from 'lucide-react';
import { api } from '@/lib/api';
import { aiService } from '@/lib/services';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const bookmarkSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(500).optional(),
  categoryId: z.string().optional(),
});

type BookmarkFormData = z.infer<typeof bookmarkSchema>;

interface BookmarkFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BookmarkFormData & { tags: string[] }) => void;
  defaultValues?: Partial<BookmarkFormData & { tags: string[] }>;
  loading?: boolean;
}

export function BookmarkForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  loading,
}: BookmarkFormProps) {
  const [tags, setTags] = React.useState<string[]>(defaultValues?.tags || []);
  const [tagInput, setTagInput] = React.useState('');
  const [isFetchingMeta, setIsFetchingMeta] = React.useState(false);
  const [aiLoading, setAiLoading] = React.useState<string | null>(null);
  const [aiHint, setAiHint] = React.useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<BookmarkFormData>({
    resolver: zodResolver(bookmarkSchema),
    defaultValues: {
      url: defaultValues?.url || '',
      title: defaultValues?.title || '',
      description: defaultValues?.description || '',
      categoryId: defaultValues?.categoryId || '',
    },
  });

  const url = watch('url');
  const title = watch('title');
  const description = watch('description');
  const selectedCategoryId = watch('categoryId');

  React.useEffect(() => {
    if (open) {
      reset({
        url: defaultValues?.url || '',
        title: defaultValues?.title || '',
        description: defaultValues?.description || '',
        categoryId: defaultValues?.categoryId || '',
      });
      setTags(defaultValues?.tags || []);
      setTagInput('');
      setAiHint(null);
      setFaviconUrl(null);
    }
  }, [open, reset, defaultValues]);

  const previewFaviconSrc = React.useMemo(() => {
    if (faviconUrl) return faviconUrl;
    if (!url) return '';
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return `${parsed.origin}/favicon.ico`;
      }
      return '';
    } catch {
      return '';
    }
  }, [faviconUrl, url]);

  const fetchMeta = async (targetUrl: string) => {
    if (!targetUrl) return;
    try {
      new URL(targetUrl);
    } catch {
      return;
    }
    setIsFetchingMeta(true);
    try {
      const meta = await api.post<{
        title?: string | null;
        description?: string | null;
        faviconUrl?: string | null;
        favicon?: string | null;
      }>('/meta/scrape', { url: targetUrl });
      if (meta.title && !watch('title')) {
        setValue('title', meta.title);
      }
      if (meta.description && !watch('description')) {
        setValue('description', meta.description);
      }
      if (meta.faviconUrl || meta.favicon) {
        setFaviconUrl(meta.faviconUrl || meta.favicon || null);
      }
    } catch {
      // Silently ignore meta fetch errors
    } finally {
      setIsFetchingMeta(false);
    }
  };

  const handleAiCategorize = async () => {
    if (!url || !title) return;
    setAiLoading('categorize');
    try {
      const res = await aiService.categorize({ url, title, description });
      if (res.categoryId) {
        setValue('categoryId', res.categoryId);
        setAiHint(`AI 推荐分类「${res.categoryName}」(置信度 ${Math.round(res.confidence * 100)}%)`);
      } else {
        setAiHint(res.reason || '未找到高置信度匹配分类');
      }
    } catch {
      setAiHint('AI 分类暂时不可用');
    } finally {
      setAiLoading(null);
    }
  };

  const handleAiTags = async () => {
    if (!url || !title) return;
    setAiLoading('tags');
    try {
      const res = await aiService.generateTags({ url, title, description });
      if (res.tags?.length) {
        setTags((prev) => Array.from(new Set([...prev, ...res.tags])));
        setAiHint(`已生成 ${res.tags.length} 个推荐标签`);
      }
    } catch {
      setAiHint('AI 标签生成失败');
    } finally {
      setAiLoading(null);
    }
  };

  const handleAiSummarize = async () => {
    if (!url || !title) return;
    setAiLoading('summarize');
    try {
      const res = await aiService.summarize({ url, title, description });
      if (res.description) {
        setValue('description', res.description);
        setAiHint('已由 AI 生成精炼摘要');
      }
    } catch {
      setAiHint('AI 摘要生成失败');
    } finally {
      setAiLoading(null);
    }
  };

  const handleAiSmartFillAll = async () => {
    if (!url) return;
    setAiLoading('all');
    try {
      let currentTitle = watch('title');
      let currentDesc = watch('description');

      if (!currentTitle) {
        const meta = await api
          .post<{ title?: string | null; description?: string | null; faviconUrl?: string | null }>(
            '/meta/scrape',
            { url },
          )
          .catch(() => null);
        if (meta?.title) {
          currentTitle = meta.title;
          setValue('title', meta.title);
        }
        if (meta?.description && !currentDesc) {
          currentDesc = meta.description;
          setValue('description', meta.description);
        }
        if (meta?.faviconUrl) setFaviconUrl(meta.faviconUrl);
      }

      const effectiveTitle = currentTitle || url;
      const [catRes, tagRes, sumRes] = await Promise.all([
        aiService.categorize({ url, title: effectiveTitle, description: currentDesc }).catch(() => null),
        aiService.generateTags({ url, title: effectiveTitle, description: currentDesc }).catch(() => null),
        !currentDesc
          ? aiService.summarize({ url, title: effectiveTitle }).catch(() => null)
          : Promise.resolve(null),
      ]);

      if (catRes?.categoryId) setValue('categoryId', catRes.categoryId);
      if (tagRes?.tags?.length) {
        setTags((prev) => Array.from(new Set([...prev, ...tagRes.tags])));
      }
      if (sumRes?.description && !watch('description')) {
        setValue('description', sumRes.description);
      }
      setAiHint('✨ AI 已完成智能分类、标签与元数据补全');
    } finally {
      setAiLoading(null);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !tags.includes(tag)) {
        setTags((prev) => [...prev, tag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleFormSubmit = (data: BookmarkFormData) => {
    onSubmit({
      ...data,
      categoryId: data.categoryId && data.categoryId !== 'none' ? data.categoryId : undefined,
      tags,
    });
  };

  const [apiCategories, setApiCategories] = React.useState<any[]>([]);
  React.useEffect(() => {
    if (!open) return;
    api
      .get<any>('/categories/tree')
      .then((res) => {
        setApiCategories(Array.isArray(res) ? res : res?.data || []);
      })
      .catch(() => {});
  }, [open]);

  const flatCategories = React.useMemo(() => {
    const flat: { id: string; name: string; depth: number }[] = [];
    const addCategory = (cats: any[], depth: number) => {
      for (const cat of cats) {
        flat.push({ id: cat.id, name: cat.name, depth });
        if (cat.children) {
          addCategory(cat.children, depth + 1);
        }
      }
    };
    addCategory(apiCategories, 0);
    return flat;
  }, [apiCategories]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues?.url ? 'Edit Bookmark' : 'Add Bookmark'}</DialogTitle>
          <DialogDescription>
            {defaultValues?.url
              ? 'Update the bookmark details below.'
              : 'Save a new bookmark or let AI auto-fill metadata, category, and tags.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* URL */}
          <div className="space-y-1.5">
            <div className="relative">
              <Input
                label="URL"
                placeholder="https://example.com"
                iconLeft={<Globe className="h-4 w-4" />}
                error={errors.url?.message}
                {...register('url', {
                  onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
                    if (!watch('title')) fetchMeta(e.target.value);
                  },
                })}
              />
              {isFetchingMeta && (
                <div className="absolute right-3 top-[34px]">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                </div>
              )}
            </div>

            {/* AI Smart Assist Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                {previewFaviconSrc && !errors.url && (
                  <img
                    src={previewFaviconSrc}
                    alt=""
                    className="h-4 w-4 rounded-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                {aiHint ? (
                  <span className="text-xs text-accent font-medium">{aiHint}</span>
                ) : (
                  <span className="text-xs text-text-tertiary">粘贴网址后可一键 AI 智能填充</span>
                )}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!url || !!aiLoading}
                loading={aiLoading === 'all'}
                onClick={handleAiSmartFillAll}
                className="h-7 px-2.5 text-xs gap-1"
              >
                <Sparkles className="h-3 w-3 text-accent" />
                AI 一键补全
              </Button>
            </div>
          </div>

          {/* Title */}
          <Input
            label="Title"
            placeholder="My Awesome Bookmark"
            error={errors.title?.message}
            {...register('title')}
          />

          {/* Description + AI Summarize */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-sm font-medium text-text-primary">Description</label>
              <button
                type="button"
                disabled={!url || !title || !!aiLoading}
                onClick={handleAiSummarize}
                className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover disabled:opacity-40 transition-colors"
              >
                {aiLoading === 'summarize' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Wand2 className="h-3 w-3" />
                )}
                AI 生成摘要
              </button>
            </div>
            <textarea
              className="flex min-h-[76px] w-full rounded-lg border border-border bg-bg-primary px-3.5 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
              placeholder="A brief description of this bookmark..."
              {...register('description')}
            />
            {errors.description && (
              <p className="mt-1.5 text-xs text-danger">{errors.description.message}</p>
            )}
          </div>

          {/* Category + AI Auto Categorize */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-sm font-medium text-text-primary">Category</label>
              <button
                type="button"
                disabled={!url || !title || !!aiLoading}
                onClick={handleAiCategorize}
                className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover disabled:opacity-40 transition-colors"
              >
                {aiLoading === 'categorize' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <FolderTree className="h-3 w-3" />
                )}
                AI 自动分类
              </button>
            </div>
            <Select
              value={selectedCategoryId || 'none'}
              onValueChange={(value) => setValue('categoryId', value === 'none' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Uncategorized</SelectItem>
                {flatCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span style={{ paddingLeft: cat.depth * 14 }}>{cat.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags + AI Auto Tags */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-sm font-medium text-text-primary">Tags</label>
              <button
                type="button"
                disabled={!url || !title || !!aiLoading}
                onClick={handleAiTags}
                className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover disabled:opacity-40 transition-colors"
              >
                {aiLoading === 'tags' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Tags className="h-3 w-3" />
                )}
                AI 推荐标签
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="default" className="gap-1 pr-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="rounded-full p-0.5 hover:bg-accent/20 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <Input
              placeholder="Type a tag and press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {defaultValues?.url ? 'Save Changes' : 'Add Bookmark'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
