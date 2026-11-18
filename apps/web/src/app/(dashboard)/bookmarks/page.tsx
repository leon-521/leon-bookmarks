'use client';

import * as React from 'react';
import Link from 'next/link';
import { Plus, LayoutGrid, List, SlidersHorizontal, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/bookmark/search-bar';
import { BookmarkGrid } from '@/components/bookmark/bookmark-grid';
import { BookmarkList } from '@/components/bookmark/bookmark-list';
import { BookmarkForm } from '@/components/bookmark/bookmark-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useBookmarks,
  useCreateBookmark,
  useUpdateBookmark,
  useDeleteBookmark,
} from '@/hooks/use-bookmarks';
import { useCategories } from '@/hooks/use-categories';
import { cn } from '@/lib/utils';

export default function BookmarksPage() {
  const [view, setView] = React.useState<'grid' | 'list'>('grid');
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('default');
  const [page, setPage] = React.useState(1);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingBookmark, setEditingBookmark] = React.useState<any | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  // Sync ?search=... query parameter from global Topbar search
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get('search');
    if (q !== null) {
      setSearch(q);
      setPage(1);
    }
  }, []);

  const { data: categories } = useCategories();
  const createBookmark = useCreateBookmark();
  const updateBookmark = useUpdateBookmark();
  const deleteBookmark = useDeleteBookmark();

  const { data: response, isLoading } = useBookmarks({
    search: search || undefined,
    categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
    sortBy:
      sortBy === 'title'
        ? 'title'
        : sortBy === 'newest'
        ? 'createdAt'
        : sortBy === 'oldest'
        ? 'createdAt'
        : undefined,
    sortOrder: sortBy === 'oldest' || sortBy === 'title' ? 'asc' : 'desc',
    page,
    limit: 20,
  });

  const bookmarks = response?.data ?? (Array.isArray(response) ? response : []);
  const meta = response?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const totalItems = meta?.total ?? bookmarks.length;
  const categoryList = Array.isArray(categories) ? categories : [];

  const handleEdit = (bookmark: any) => {
    setActionError(null);
    setEditingBookmark(bookmark);
    setFormOpen(true);
  };

  const handleDelete = async (bookmark: any) => {
    if (!confirm(`Delete bookmark "${bookmark.title}"?`)) return;
    setActionError(null);
    try {
      await deleteBookmark.mutateAsync(bookmark.id);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to delete bookmark');
    }
  };

  const handlePin = async (bookmark: any) => {
    setActionError(null);
    try {
      await updateBookmark.mutateAsync({
        id: bookmark.id,
        isPinned: !bookmark.isPinned,
      });
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update bookmark');
    }
  };

  const handleFormSubmit = async (formData: {
    url: string;
    title: string;
    description?: string;
    categoryId?: string;
    tags: string[];
  }) => {
    setActionError(null);
    try {
      if (editingBookmark) {
        await updateBookmark.mutateAsync({
          id: editingBookmark.id,
          url: formData.url,
          title: formData.title,
          description: formData.description,
          categoryId: formData.categoryId || null,
          tags: formData.tags,
        });
      } else {
        await createBookmark.mutateAsync({
          url: formData.url,
          title: formData.title,
          description: formData.description,
          categoryId: formData.categoryId,
          tags: formData.tags,
        });
      }
      setFormOpen(false);
      setEditingBookmark(null);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to save bookmark');
    }
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingBookmark(null);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Bookmarks"
        description="Manage and organize your team's bookmark collection."
      >
        <div className="flex items-center gap-2">
          <Link href="/ai">
            <Button variant="outline" className="gap-1.5">
              <Sparkles className="h-4 w-4 text-accent" />
              AI Organize
            </Button>
          </Link>
          <Button onClick={() => { setActionError(null); setFormOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Bookmark
          </Button>
        </div>
      </PageHeader>

      {actionError && (
        <div className="mb-4 rounded-lg border border-danger/20 bg-danger-light px-4 py-3 text-sm text-danger">
          {actionError}
        </div>
      )}

      {/* Filter Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            className="flex-1 max-w-md"
          />
          <div className="hidden sm:flex items-center gap-2">
            <Select
              value={categoryFilter}
              onValueChange={(val) => {
                setCategoryFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoryList.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-bg-primary p-1">
          <button
            onClick={() => setView('grid')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-all',
              view === 'grid'
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Grid</span>
          </button>
          <button
            onClick={() => setView('list')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-all',
              view === 'list'
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
      </div>

      {/* Mobile filters */}
      <div className="mb-4 flex items-center gap-2 sm:hidden overflow-x-auto scrollbar-none">
        <Select
          value={categoryFilter}
          onValueChange={(val) => {
            setCategoryFilter(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-auto min-w-[120px] h-8 text-xs">
            <SlidersHorizontal className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryList.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-auto min-w-[100px] h-8 text-xs">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="title">Title A-Z</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : view === 'grid' ? (
        <BookmarkGrid
          bookmarks={bookmarks}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPin={handlePin}
        />
      ) : (
        <BookmarkList
          bookmarks={bookmarks}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPin={handlePin}
          onSort={setSortBy}
          sortColumn={sortBy}
        />
      )}

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
          <p className="text-sm text-text-tertiary">
            Showing <span className="font-medium text-text-primary">{bookmarks.length}</span> of{' '}
            <span className="font-medium text-text-primary">{totalItems}</span> bookmarks
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant="outline"
                size="sm"
                className={p === page ? 'bg-accent text-white border-accent' : ''}
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Bookmark Form Dialog */}
      <BookmarkForm
        open={formOpen}
        onOpenChange={handleFormClose}
        onSubmit={handleFormSubmit}
        loading={createBookmark.isPending || updateBookmark.isPending}
        defaultValues={
          editingBookmark
            ? {
                url: editingBookmark.url,
                title: editingBookmark.title,
                description: editingBookmark.description || '',
                categoryId: editingBookmark.categoryId || '',
                tags: editingBookmark.tags || [],
              }
            : undefined
        }
      />
    </div>
  );
}
