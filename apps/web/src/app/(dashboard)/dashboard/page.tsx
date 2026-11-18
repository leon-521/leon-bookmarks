'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Bookmark as BookmarkIcon,
  FolderTree,
  Users,
  TrendingUp,
  ArrowRight,
  Plus,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { useCategories } from '@/hooks/use-categories';
import { tenantService } from '@/lib/services';
import { getDomainFromUrl, cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user, tenant } = useAuth();
  const { data: bookmarksData, isLoading } = useBookmarks({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });
  const { data: categories } = useCategories();
  const [memberCount, setMemberCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    tenantService
      .listMembers()
      .then((res) => {
        if (!cancelled) {
          setMemberCount(res?.quota?.used ?? res?.members?.length ?? null);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const bookmarks = bookmarksData?.data ?? bookmarksData ?? [];
  const bookmarkList = Array.isArray(bookmarks) ? bookmarks : [];
  const totalBookmarks = bookmarksData?.meta?.total ?? bookmarkList.length;
  const totalCategories = Array.isArray(categories) ? categories.length : 0;
  const recentClicks = bookmarkList.reduce((sum: number, b: any) => sum + (b.clickCount || 0), 0);

  const quickStats = [
    {
      label: 'Total Bookmarks',
      value: String(totalBookmarks),
      change: 'All time',
      icon: BookmarkIcon,
      color: 'text-accent',
      bgColor: 'bg-accent-muted',
    },
    {
      label: 'Categories',
      value: String(totalCategories),
      change: 'Organized',
      icon: FolderTree,
      color: 'text-success',
      bgColor: 'bg-success-light',
    },
    {
      label: 'Team Members',
      value: memberCount !== null ? String(memberCount) : '--',
      change: 'Active',
      icon: Users,
      color: 'text-warning',
      bgColor: 'bg-warning-light',
    },
    {
      label: 'Recent Link Clicks',
      value: String(recentClicks),
      change: 'Tracked',
      icon: TrendingUp,
      color: 'text-violet-500',
      bgColor: 'bg-violet-50',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome */}
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'}`}
        description="Here&rsquo;s what&rsquo;s happening in your workspace today."
      >
        <Link href="/bookmarks">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Bookmark
          </Button>
        </Link>
      </PageHeader>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <div
            key={stat.label}
            className="animate-fade-up rounded-xl border border-border bg-bg-primary p-5 shadow-xs transition-all hover:shadow-sm"
            style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'backwards' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', stat.bgColor)}>
                <stat.icon className={cn('h-5 w-5', stat.color)} />
              </div>
            </div>
            <div className="text-2xl font-display font-bold text-text-primary">{stat.value}</div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm text-text-tertiary">{stat.label}</span>
              <span className="text-xs text-success font-medium">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookmarks */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-bg-primary shadow-xs">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-display font-semibold text-text-primary">Recent Bookmarks</h2>
            <Link href="/bookmarks" className="flex items-center gap-1 text-sm text-accent hover:text-accent-hover transition-colors">
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))
            ) : bookmarkList.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-text-secondary">
                No bookmarks yet. Click &ldquo;Add Bookmark&rdquo; to save your first link!
              </div>
            ) : (
              bookmarkList.slice(0, 5).map((bookmark: any) => {
                const fav = bookmark.faviconUrl || bookmark.favicon;
                return (
                  <div key={bookmark.id} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-bg-secondary">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-secondary">
                      {fav ? (
                        <img
                          src={fav}
                          alt=""
                          className="h-5 w-5 rounded-sm object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <Globe className={cn('h-4 w-4 text-text-tertiary', Boolean(fav) && 'hidden')} />
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
                      <span className="text-xs text-text-tertiary">{getDomainFromUrl(bookmark.url)}</span>
                    </div>
                    <Badge variant="secondary" className="hidden sm:inline-flex shrink-0 text-[11px]">
                      {bookmark.category?.name || bookmark.categoryName || 'Uncategorized'}
                    </Badge>
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-md p-1 text-text-tertiary hover:text-accent hover:bg-bg-secondary transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="rounded-xl border border-border bg-bg-primary shadow-xs">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-display font-semibold text-text-primary">Quick Actions</h2>
          </div>
          <div className="p-4 space-y-2">
            <Link
              href="/bookmarks"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-bg-secondary"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-muted">
                <BookmarkIcon className="h-4 w-4 text-accent" />
              </div>
              <span className="text-sm font-medium text-text-primary">Manage Bookmarks</span>
            </Link>
            <Link
              href="/categories"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-bg-secondary"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-success-light">
                <FolderTree className="h-4 w-4 text-success" />
              </div>
              <span className="text-sm font-medium text-text-primary">Manage Categories</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-bg-secondary"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-warning-light">
                <TrendingUp className="h-4 w-4 text-warning" />
              </div>
              <span className="text-sm font-medium text-text-primary">Theme & Settings</span>
            </Link>
            {tenant?.slug && (
              <Link
                href={`/portal/${tenant.slug}`}
                target="_blank"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-bg-secondary"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-50">
                  <Globe className="h-4 w-4 text-violet-500" />
                </div>
                <span className="text-sm font-medium text-text-primary">View Portal</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
