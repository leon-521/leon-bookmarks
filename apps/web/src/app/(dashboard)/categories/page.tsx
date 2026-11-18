'use client';

import * as React from 'react';
import { Plus, Bookmark as BookmarkIcon, ExternalLink, Globe } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CategoryTree } from '@/components/category/category-tree';
import { mockCategories, mockBookmarks, type Category } from '@/lib/mock-data';
import { getDomainFromUrl, cn } from '@/lib/utils';

export default function CategoriesPage() {
  const [selectedCategory, setSelectedCategory] = React.useState<Category | null>(null);

  const filteredBookmarks = selectedCategory?.id
    ? mockBookmarks.filter(
        (b) =>
          b.categoryId === selectedCategory.id ||
          mockCategories
            .find((c) => c.id === selectedCategory.id)
            ?.children?.some((child) => child.id === b.categoryId)
      )
    : mockBookmarks;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Categories"
        description="Organize your bookmarks with a hierarchical category structure."
      >
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Tree */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="rounded-xl border border-border bg-bg-primary p-4 shadow-xs sticky top-20">
            <h3 className="mb-3 text-sm font-semibold text-text-tertiary uppercase tracking-wider px-2">
              Categories
            </h3>
            <CategoryTree
              categories={mockCategories}
              selectedId={selectedCategory?.id}
              onSelect={setSelectedCategory}
            />
          </div>
        </div>

        {/* Category Detail / Bookmarks */}
        <div className="lg:col-span-8 xl:col-span-9">
          <div className="rounded-xl border border-border bg-bg-primary shadow-xs">
            {/* Category header */}
            <div className="border-b border-border px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-display font-semibold text-text-primary">
                    {selectedCategory?.name || 'All Bookmarks'}
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {filteredBookmarks.length} bookmark{filteredBookmarks.length !== 1 ? 's' : ''} in this category
                  </p>
                </div>
                {selectedCategory && (
                  <Badge variant="default" className="gap-1">
                    <BookmarkIcon className="h-3 w-3" />
                    {filteredBookmarks.length}
                  </Badge>
                )}
              </div>
            </div>

            {/* Bookmarks list */}
            {filteredBookmarks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="mb-4 rounded-full bg-bg-tertiary p-4">
                  <BookmarkIcon className="h-6 w-6 text-text-tertiary" />
                </div>
                <h3 className="text-base font-semibold text-text-primary">No bookmarks yet</h3>
                <p className="mt-1 text-sm text-text-secondary max-w-sm">
                  Add bookmarks to this category to see them here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredBookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-bg-secondary"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-secondary">
                      {bookmark.favicon ? (
                        <img src={bookmark.favicon} alt="" className="h-5 w-5 rounded-sm object-contain" />
                      ) : (
                        <Globe className="h-5 w-5 text-text-tertiary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-sm font-medium text-text-primary hover:text-accent transition-colors"
                      >
                        {bookmark.title}
                      </a>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full shrink-0',
                            bookmark.status === 'active' ? 'bg-success' : 'bg-danger'
                          )}
                        />
                        <span className="truncate text-xs text-text-tertiary">
                          {getDomainFromUrl(bookmark.url)}
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-wrap gap-1">
                      {bookmark.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-md p-1.5 text-text-tertiary hover:text-accent hover:bg-accent-muted transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
