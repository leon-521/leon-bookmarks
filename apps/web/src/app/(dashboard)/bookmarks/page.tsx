'use client';

import * as React from 'react';
import { Plus, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
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
import { useBookmarks } from '@/hooks/use-bookmarks';
import { mockCategories, type Bookmark } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export default function BookmarksPage() {
  const [view, setView] = React.useState<'grid' | 'list'>('grid');
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('default');
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingBookmark, setEditingBookmark] = React.useState<Bookmark | null>(null);

  const { data: bookmarks, isLoading } = useBookmarks({
    search: search || undefined,
    categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
    sort: sortBy !== 'default' ? sortBy : undefined,
  });

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setFormOpen(true);
  };

  const handleFormSubmit = () => {
    setFormOpen(false);
    setEditingBookmark(null);
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
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Bookmark
        </Button>
      </PageHeader>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            className="flex-1 max-w-md"
          />
          <div className="hidden sm:flex items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {mockCategories.map((cat) => (
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
                : 'text-text-secondary hover:text-text-primary'
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
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
      </div>

      {/* Mobile filters */}
      <div className="mb-4 flex items-center gap-2 sm:hidden overflow-x-auto scrollbar-none">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-auto min-w-[120px] h-8 text-xs">
            <SlidersHorizontal className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {mockCategories.map((cat) => (
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
          bookmarks={bookmarks || []}
          onEdit={handleEdit}
        />
      ) : (
        <BookmarkList
          bookmarks={bookmarks || []}
          onEdit={handleEdit}
          onSort={setSortBy}
          sortColumn={sortBy}
        />
      )}

      {/* Pagination */}
      {(bookmarks?.length || 0) > 0 && (
        <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
          <p className="text-sm text-text-tertiary">
            Showing <span className="font-medium text-text-primary">{bookmarks?.length}</span> bookmarks
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" className="bg-accent text-white border-accent">
              1
            </Button>
            <Button variant="outline" size="sm">
              2
            </Button>
            <Button variant="outline" size="sm">
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
        defaultValues={
          editingBookmark
            ? {
                url: editingBookmark.url,
                title: editingBookmark.title,
                description: editingBookmark.description,
                categoryId: editingBookmark.categoryId,
                tags: editingBookmark.tags,
              }
            : undefined
        }
      />
    </div>
  );
}
