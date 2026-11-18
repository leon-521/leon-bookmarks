'use client';

import * as React from 'react';
import { Search, Building2, MoreHorizontal, ExternalLink, Snowflake, Power, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { adminService } from '@/lib/services';
import { cn } from '@/lib/utils';

interface AdminTenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    bookmarks: number;
    users: number;
    categories: number;
  };
}

interface TenantsPaginatedResponse {
  data: AdminTenant[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const planBadgeVariant = (plan: string): 'default' | 'secondary' | 'success' | 'warning' | 'danger' => {
  switch (plan?.toLowerCase()) {
    case 'enterprise': return 'warning';
    case 'pro': return 'default';
    default: return 'secondary';
  }
};

function TableSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-4 w-20 ml-auto" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export default function TenantsPage() {
  const [data, setData] = React.useState<TenantsPaginatedResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [planFilter, setPlanFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);

  const fetchTenants = React.useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (search) params.search = search;
      if (planFilter !== 'all') params.plan = planFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const result = await adminService.listTenants(params);
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load tenants');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, search, planFilter, statusFilter]);

  React.useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleSearch = React.useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleFreeze = async (tenant: AdminTenant) => {
    setActionLoading(tenant.id);
    try {
      if (!tenant.isActive) {
        await adminService.activateTenant(tenant.id);
      } else {
        await adminService.freezeTenant(tenant.id);
      }
      await fetchTenants();
    } catch (err: any) {
      setError(err.message || 'Failed to update tenant status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (tenant: AdminTenant) => {
    if (!window.confirm(`Are you sure you want to delete "${tenant.name}"? This action cannot be undone.`)) return;
    setActionLoading(tenant.id);
    try {
      await adminService.deleteTenant(tenant.id);
      await fetchTenants();
    } catch (err: any) {
      setError(err.message || 'Failed to delete tenant');
    } finally {
      setActionLoading(null);
    }
  };

  const tenants = data?.data || [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages || 1;

  return (
    <div className="space-y-4 animate-fade-in">
      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger-light px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search tenants..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            iconLeft={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex gap-3">
          <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="FREE">Free</SelectItem>
              <SelectItem value="PRO">Pro</SelectItem>
              <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="frozen">Frozen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-bg-primary shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-secondary/50">
                <th className="px-5 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Slug</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Plan</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Bookmarks</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Members</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Created</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8}><TableSkeleton /></td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <Building2 className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
                    <p className="text-sm font-medium text-text-secondary">No tenants found</p>
                    <p className="text-xs text-text-tertiary mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className={cn(
                      'hover:bg-bg-secondary/50 transition-colors',
                      actionLoading === tenant.id && 'opacity-50 pointer-events-none'
                    )}
                  >
                    <td className="px-5 py-3.5 text-sm font-medium text-text-primary whitespace-nowrap">{tenant.name}</td>
                    <td className="px-5 py-3.5 text-sm text-text-secondary font-mono whitespace-nowrap">{tenant.slug}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Badge variant={planBadgeVariant(tenant.plan)}>{tenant.plan}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-secondary text-right tabular-nums">
                      {(tenant._count?.bookmarks ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-secondary text-right tabular-nums">
                      {tenant._count?.users ?? 0}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Badge variant={tenant.isActive ? 'success' : 'danger'}>
                        {tenant.isActive ? 'Active' : 'Frozen'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-tertiary whitespace-nowrap">
                      {new Date(tenant.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            icon={<ExternalLink className="h-4 w-4" />}
                            onClick={() => window.open(`/portal/${tenant.slug}`, '_blank', 'noopener,noreferrer')}
                          >
                            Open Portal
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            icon={!tenant.isActive ? <Power className="h-4 w-4" /> : <Snowflake className="h-4 w-4" />}
                            onClick={() => handleFreeze(tenant)}
                          >
                            {!tenant.isActive ? 'Activate' : 'Freeze'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            icon={<Trash2 className="h-4 w-4" />}
                            onClick={() => handleDelete(tenant)}
                            className="text-danger focus:text-danger"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <p className="text-xs text-text-tertiary">
              Showing {((page - 1) * meta.limit) + 1}–{Math.min(page * meta.limit, meta.total)} of {meta.total}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className="min-w-[32px]"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
