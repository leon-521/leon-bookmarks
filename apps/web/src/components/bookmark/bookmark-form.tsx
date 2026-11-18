'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Globe, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
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
import { api } from '@/lib/api';

const bookmarkSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(500).optional(),
  categoryId: z.string().min(1, 'Please select a category'),
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

  const fetchMeta = async (targetUrl: string) => {
    if (!targetUrl || title) return;
    try {
      new URL(targetUrl);
    } catch {
      return;
    }
    setIsFetchingMeta(true);
    try {
      const meta = await api.post<{ title?: string; description?: string; favicon?: string }>('/meta/scrape', { url: targetUrl });
      if (meta.title && !watch('title')) {
        setValue('title', meta.title);
      }
      if (meta.description && !watch('description')) {
        setValue('description', meta.description);
      }
      if (meta.favicon) {
        setFaviconUrl(meta.favicon);
      }
    } catch {
      // Silently ignore meta fetch errors
    } finally {
      setIsFetchingMeta(false);
    }
  };

  React.useEffect(() => {
    if (!open) {
      reset();
      setTags(defaultValues?.tags || []);
      setTagInput('');
    }
  }, [open, reset, defaultValues?.tags]);

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
    onSubmit({ ...data, tags });
  };

  const [apiCategories, setApiCategories] = React.useState<any[]>([]);
  React.useEffect(() => {
    api.get<any>('/categories/tree').then((res) => {
      setApiCategories(res.data || res || []);
    }).catch(() => {});
  }, []);

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
              : 'Save a new bookmark to your collection.'}
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
                    fetchMeta(e.target.value);
                  },
                })}
              />
              {isFetchingMeta && (
                <div className="absolute right-3 top-[34px]">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                </div>
              )}
            </div>
            {url && !errors.url && (
              <div className="flex items-center gap-2 px-1">
                <img
                  src={faviconUrl || `https://www.google.com/s2/favicons?domain=${url}&sz=16`}
                  alt=""
                  className="h-4 w-4 rounded-sm"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="text-xs text-text-tertiary">Favicon preview</span>
              </div>
            )}
          </div>

          {/* Title */}
          <Input
            label="Title"
            placeholder="My Awesome Bookmark"
            error={errors.title?.message}
            {...register('title')}
          />

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Description
            </label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-border bg-bg-primary px-3.5 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
              placeholder="A brief description of this bookmark..."
              {...register('description')}
            />
            {errors.description && (
              <p className="mt-1.5 text-xs text-danger">{errors.description.message}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Category
            </label>
            <Select onValueChange={(value) => setValue('categoryId', value)} defaultValue={defaultValues?.categoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {flatCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span style={{ paddingLeft: cat.depth * 16 }}>{cat.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="mt-1.5 text-xs text-danger">{errors.categoryId.message}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Tags
            </label>
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
