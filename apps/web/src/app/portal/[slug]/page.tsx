'use client';

import * as React from 'react';
import { Search, Sun, Moon, ExternalLink, Globe, Sparkles, X } from 'lucide-react';
import { cn, getDomainFromUrl } from '@/lib/utils';
import { portalService } from '@/lib/services';

interface PortalBookmark {
  id: string;
  title: string;
  url: string;
  description?: string | null;
  faviconUrl?: string | null;
  tags: string[];
  isPinned: boolean;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
}

interface PortalCategory {
  id: string;
  name: string;
  icon?: string | null;
  parentId?: string | null;
  children?: PortalCategory[];
  _count?: { bookmarks: number };
}

interface PortalData {
  tenant: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    themeConfig?: Record<string, any> | null;
  };
  categories: PortalCategory[];
  bookmarks: PortalBookmark[];
  stats: { totalBookmarks: number; totalCategories: number };
}

function collectCategoryIds(cat: PortalCategory, ids = new Set<string>()): Set<string> {
  ids.add(cat.id);
  if (cat.children) {
    for (const child of cat.children) {
      collectCategoryIds(child, ids);
    }
  }
  return ids;
}

function findPortalCategory(cats: PortalCategory[], id: string): PortalCategory | null {
  for (const cat of cats) {
    if (cat.id === id) return cat;
    if (cat.children) {
      const found = findPortalCategory(cat.children, id);
      if (found) return found;
    }
  }
  return null;
}

export default function PortalPage({ params }: { params: { slug: string } }) {
  const [search, setSearch] = React.useState('');
  const [isDark, setIsDark] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [data, setData] = React.useState<PortalData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const fetchPortal = async () => {
      try {
        setLoading(true);
        const res = await portalService.getData(params.slug);
        if (!cancelled) {
          setData(res as PortalData);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Portal not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPortal();
    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-10 w-10 mx-auto animate-spin rounded-full border-2 border-blue-500 border-t-transparent mb-4" />
          <p className="text-gray-500 text-sm">Loading portal...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Globe className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Portal Not Found</h2>
          <p className="text-gray-500 text-sm">The portal &quot;{params.slug}&quot; doesn&apos;t exist or is not available.</p>
        </div>
      </div>
    );
  }

  const { tenant, categories, bookmarks } = data;
  const accentColor = tenant.themeConfig?.accentColor || '#3b82f6';

  const selectedCategoryIds = selectedCategory
    ? (() => {
        const target = findPortalCategory(categories, selectedCategory);
        return target ? collectCategoryIds(target) : new Set([selectedCategory]);
      })()
    : null;

  const filteredBookmarks = bookmarks.filter((b) => {
    const matchesSearch =
      !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.description || '').toLowerCase().includes(search.toLowerCase()) ||
      b.url.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      !selectedCategoryIds || (b.categoryId ? selectedCategoryIds.has(b.categoryId) : false);

    return matchesSearch && matchesCategory;
  });

  const allAssignedIds = new Set<string>();
  const groupedBookmarks = categories.reduce(
    (acc, category) => {
      const catIds = collectCategoryIds(category);
      const categoryBookmarks = filteredBookmarks.filter(
        (b) => b.categoryId && catIds.has(b.categoryId)
      );
      if (categoryBookmarks.length > 0) {
        categoryBookmarks.forEach((b) => allAssignedIds.add(b.id));
        acc.push({ category, bookmarks: categoryBookmarks });
      }
      return acc;
    },
    [] as { category: PortalCategory; bookmarks: PortalBookmark[] }[]
  );

  const uncategorizedBookmarks = filteredBookmarks.filter((b) => !allAssignedIds.has(b.id));
  if (uncategorizedBookmarks.length > 0) {
    groupedBookmarks.push({
      category: { id: '__uncategorized__', name: 'Other Links' },
      bookmarks: uncategorizedBookmarks,
    });
  }

  return (
    <div
      className={cn('min-h-screen transition-colors duration-300')}
      style={{
        backgroundColor: isDark ? '#0f172a' : '#f8f9fb',
        color: isDark ? '#f1f5f9' : '#0f172a',
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b backdrop-blur-md"
        style={{
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          borderColor: isDark ? '#334155' : '#e2e8f0',
        }}
      >
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-sm"
                style={{ backgroundColor: accentColor }}
              >
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold">{tenant.name}</h1>
                <p className="text-xs" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                  {data.stats.totalBookmarks} links · {data.stats.totalCategories} categories
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative hidden sm:block">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: isDark ? '#64748b' : '#94a3b8' }}
                />
                <input
                  type="text"
                  placeholder="Search links..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-64 rounded-lg border pl-9 pr-8 text-sm transition-all focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    color: isDark ? '#f1f5f9' : '#0f172a',
                    ...(search ? { boxShadow: `0 0 0 2px ${accentColor}33` } : {}),
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5"
                    style={{ color: isDark ? '#64748b' : '#94a3b8' }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                className="rounded-lg p-2 transition-colors"
                style={{ color: isDark ? '#94a3b8' : '#475569' }}
              >
                {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          {/* Mobile search */}
          <div className="mt-3 sm:hidden">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: isDark ? '#64748b' : '#94a3b8' }}
              />
              <input
                type="text"
                placeholder="Search links..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border pl-9 pr-4 text-sm transition-all focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#f1f5f9' : '#0f172a',
                }}
              />
            </div>
          </div>

          {/* Category filters */}
          <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none pb-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200"
              style={{
                backgroundColor: !selectedCategory ? accentColor : isDark ? '#1e293b' : '#ffffff',
                color: !selectedCategory ? '#ffffff' : isDark ? '#94a3b8' : '#475569',
                border: `1px solid ${!selectedCategory ? accentColor : isDark ? '#334155' : '#e2e8f0'}`,
              }}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200"
                style={{
                  backgroundColor: selectedCategory === cat.id ? accentColor : isDark ? '#1e293b' : '#ffffff',
                  color: selectedCategory === cat.id ? '#ffffff' : isDark ? '#94a3b8' : '#475569',
                  border: `1px solid ${selectedCategory === cat.id ? accentColor : isDark ? '#334155' : '#e2e8f0'}`,
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {groupedBookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="h-12 w-12 mb-4" style={{ color: isDark ? '#334155' : '#cbd5e1' }} />
            <h3 className="text-lg font-semibold mb-1">No results found</h3>
            <p className="text-sm" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
              Try a different search term or category.
            </p>
          </div>
        ) : selectedCategory ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredBookmarks.map((bookmark, index) => (
              <PortalBookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                accentColor={accentColor}
                isDark={isDark}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {groupedBookmarks.map((group) => (
              <section key={group.category.id}>
                <div className="mb-4 flex items-center gap-3">
                  <h2
                    className="text-xl font-display font-semibold"
                    style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
                  >
                    {group.category.name}
                  </h2>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${accentColor}15`,
                      color: accentColor,
                    }}
                  >
                    {group.bookmarks.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {group.bookmarks.map((bookmark, index) => (
                    <PortalBookmarkCard
                      key={bookmark.id}
                      bookmark={bookmark}
                      accentColor={accentColor}
                      isDark={isDark}
                      index={index}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="border-t py-8 px-6"
        style={{ borderColor: isDark ? '#1e293b' : '#e2e8f0' }}
      >
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: accentColor }} />
            <span className="text-sm font-medium" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
              Powered by Leon Bookmarks
            </span>
          </div>
          <p className="text-xs" style={{ color: isDark ? '#475569' : '#cbd5e1' }}>
            &copy; {new Date().getFullYear()} {tenant.name}
          </p>
        </div>
      </footer>
    </div>
  );
}

function PortalBookmarkCard({
  bookmark,
  accentColor,
  isDark,
  index,
}: {
  bookmark: PortalBookmark;
  accentColor: string;
  isDark: boolean;
  index: number;
}) {
  return (
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg animate-fade-up"
      style={{
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        animationDelay: `${index * 40}ms`,
        animationFillMode: 'backwards',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = accentColor;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = isDark ? '#334155' : '#e2e8f0';
      }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: isDark ? '#334155' : '#f1f3f7' }}
        >
          {bookmark.faviconUrl ? (
            <img
              src={bookmark.faviconUrl}
              alt=""
              className="h-5 w-5 rounded-sm object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <Globe
            className={cn('h-5 w-5', Boolean(bookmark.faviconUrl) && 'hidden')}
            style={{ color: isDark ? '#64748b' : '#94a3b8' }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className="text-sm font-semibold truncate group-hover:text-current transition-colors"
            style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
          >
            {bookmark.title}
          </h3>
          <span
            className="text-xs"
            style={{ color: isDark ? '#64748b' : '#94a3b8' }}
          >
            {getDomainFromUrl(bookmark.url)}
          </span>
        </div>
        <ExternalLink
          className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: accentColor }}
        />
      </div>
      <p
        className="text-sm leading-relaxed line-clamp-2 flex-1"
        style={{ color: isDark ? '#94a3b8' : '#475569' }}
      >
        {bookmark.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {bookmark.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: isDark ? '#334155' : '#f1f3f7',
              color: isDark ? '#94a3b8' : '#64748b',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </a>
  );
}
