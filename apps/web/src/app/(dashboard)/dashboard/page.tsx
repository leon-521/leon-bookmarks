'use client';

import Link from 'next/link';
import {
  Bookmark,
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
import { useAuth } from '@/hooks/use-auth';
import { mockBookmarks, mockCategories } from '@/lib/mock-data';
import { getDomainFromUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';

const quickStats = [
  {
    label: 'Total Bookmarks',
    value: '127',
    change: '+12 this week',
    icon: Bookmark,
    color: 'text-accent',
    bgColor: 'bg-accent-muted',
  },
  {
    label: 'Categories',
    value: '14',
    change: '+2 this month',
    icon: FolderTree,
    color: 'text-success',
    bgColor: 'bg-success-light',
  },
  {
    label: 'Team Members',
    value: '8',
    change: '3 active now',
    icon: Users,
    color: 'text-warning',
    bgColor: 'bg-warning-light',
  },
  {
    label: 'Portal Views',
    value: '2,847',
    change: '+18% vs last week',
    icon: TrendingUp,
    color: 'text-violet-500',
    bgColor: 'bg-violet-50',
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const recentBookmarks = mockBookmarks.slice(0, 5);

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
            {recentBookmarks.map((bookmark) => (
              <div key={bookmark.id} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-bg-secondary">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-secondary">
                  {bookmark.favicon ? (
                    <img src={bookmark.favicon} alt="" className="h-5 w-5 rounded-sm object-contain" />
                  ) : (
                    <Globe className="h-4 w-4 text-text-tertiary" />
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
                  <span className="text-xs text-text-tertiary">{getDomainFromUrl(bookmark.url)}</span>
                </div>
                <Badge variant="secondary" className="hidden sm:inline-flex shrink-0 text-[11px]">
                  {bookmark.categoryName}
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
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div className="rounded-xl border border-border bg-bg-primary shadow-xs">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-display font-semibold text-text-primary">Top Categories</h2>
            <Link href="/categories" className="flex items-center gap-1 text-sm text-accent hover:text-accent-hover transition-colors">
              Manage
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="p-4 space-y-2">
            {mockCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-bg-secondary"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-muted">
                    <FolderTree className="h-4 w-4 text-accent" />
                  </div>
                  <span className="text-sm font-medium text-text-primary">{category.name}</span>
                </div>
                <Badge variant="secondary" className="text-[11px]">{category.bookmarkCount}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
