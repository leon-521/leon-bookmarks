'use client';

import * as React from 'react';
import { Building2, Users, Bookmark, FolderTree, TrendingUp, Shield, Snowflake } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { adminService } from '@/lib/services';
import { cn } from '@/lib/utils';

interface StatCard {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  _count?: {
    bookmarks: number;
    users: number;
  };
}

interface AnalyticsData {
  overview: {
    totalTenants: number;
    activeTenants: number;
    frozenTenants: number;
    totalUsers: number;
    totalBookmarks: number;
    totalCategories: number;
    recentTenants: number;
  };
  planDistribution: { plan: string; count: number }[];
  topTenants: TenantRow[];
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-bg-primary p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-16 mb-1" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-bg-primary shadow-xs overflow-hidden">
      <div className="p-5 border-b border-border">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-4 w-12 ml-auto" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

const planBadgeVariant = (plan: string): 'default' | 'secondary' | 'success' | 'warning' | 'danger' => {
  switch (plan?.toLowerCase()) {
    case 'enterprise': return 'warning';
    case 'pro': return 'default';
    default: return 'secondary';
  }
};

export default function AdminDashboardPage() {
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const result = await adminService.getAnalytics();
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load analytics');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const ov = data?.overview;
  const statCards: StatCard[] = ov ? [
    { label: 'Total Tenants', value: ov.totalTenants ?? 0, icon: Building2, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: 'Active', value: ov.activeTenants ?? 0, icon: Shield, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { label: 'Frozen', value: ov.frozenTenants ?? 0, icon: Snowflake, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
    { label: 'Users', value: ov.totalUsers ?? 0, icon: Users, color: 'text-violet-600', bgColor: 'bg-violet-50' },
    { label: 'Bookmarks', value: ov.totalBookmarks ?? 0, icon: Bookmark, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { label: 'Categories', value: ov.totalCategories ?? 0, icon: FolderTree, color: 'text-rose-600', bgColor: 'bg-rose-50' },
    { label: 'New (30d)', value: ov.recentTenants ?? 0, icon: TrendingUp, color: 'text-teal-600', bgColor: 'bg-teal-50' },
  ] : [];

  if (error) {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger-light p-8 text-center">
        <p className="text-sm font-medium text-danger">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {loading
          ? Array.from({ length: 7 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-border bg-bg-primary p-5 shadow-xs hover:shadow-sm transition-shadow duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">{card.label}</span>
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', card.bgColor)}>
                    <card.icon className={cn('h-4 w-4', card.color)} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-text-primary tracking-tight">
                  {card.value.toLocaleString()}
                </p>
              </div>
            ))
        }
      </div>

      {/* Plan Distribution */}
      {loading ? (
        <div className="rounded-xl border border-border bg-bg-primary p-5 shadow-xs">
          <Skeleton className="h-5 w-36 mb-4" />
          <div className="flex gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        </div>
      ) : data && (
        <div className="rounded-xl border border-border bg-bg-primary p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Plan Distribution</h3>
          <div className="flex flex-wrap gap-3">
            {data.planDistribution.map((item) => (
              <Badge key={item.plan} variant={planBadgeVariant(item.plan)} className="px-3 py-1.5 text-sm">
                {item.plan}: {item.count}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Top Tenants Table */}
      {loading ? (
        <TableSkeleton />
      ) : data && (
        <div className="rounded-xl border border-border bg-bg-primary shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary">Top Tenants</h3>
            <p className="text-xs text-text-tertiary mt-0.5">By bookmark count</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-secondary/50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Slug</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Plan</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Bookmarks</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Members</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.topTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-text-primary">{tenant.name}</td>
                    <td className="px-5 py-3.5 text-sm text-text-secondary font-mono">{tenant.slug}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={planBadgeVariant(tenant.plan)}>{tenant.plan}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-secondary text-right">
                      {(tenant._count?.bookmarks ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-secondary text-right">
                      {tenant._count?.users ?? 0}
                    </td>
                  </tr>
                ))}
                {data.topTenants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-text-tertiary">
                      No tenants found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
