'use client';

import * as React from 'react';
import { Search, Users, MoreHorizontal, UserCog, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { adminService } from '@/lib/services';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantName: string;
  lastLoginAt: string | null;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const roleBadgeVariant = (role: string): 'default' | 'secondary' | 'success' | 'warning' | 'danger' => {
  switch (role?.toLowerCase()) {
    case 'super_admin': return 'danger';
    case 'admin': return 'warning';
    case 'editor': return 'default';
    default: return 'secondary';
  }
};

const roleDisplayLabel = (role: string) => {
  switch (role?.toLowerCase()) {
    case 'super_admin': return 'Super Admin';
    case 'admin': return 'Admin';
    case 'editor': return 'Editor';
    case 'viewer': return 'Viewer';
    default: return role;
  }
};

const availableRoles = ['admin', 'editor', 'viewer'];

function TableSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full ml-4" />
          <Skeleton className="h-4 w-24 ml-auto" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export default function UsersPage() {
  const [data, setData] = React.useState<UsersResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), pageSize: '10' };
      if (search) params.search = search;
      if (roleFilter !== 'all') params.role = roleFilter;
      const result = await adminService.listUsers(params);
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = React.useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleChangeRole = async (user: User, newRole: string) => {
    if (user.role === newRole) return;
    setActionLoading(user.id);
    try {
      await adminService.updateUserRole(user.id, newRole);
      await fetchUsers();
    } catch {
      // Silently handle
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) return;
    setActionLoading(user.id);
    try {
      await adminService.deleteUser(user.id);
      await fetchUsers();
    } catch {
      // Silently handle
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            iconLeft={<Search className="h-4 w-4" />}
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-bg-primary shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-secondary/50">
                <th className="px-5 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">User</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Tenant</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Last Login</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5}><TableSkeleton /></td>
                </tr>
              ) : data?.users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <Users className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
                    <p className="text-sm font-medium text-text-secondary">No users found</p>
                    <p className="text-xs text-text-tertiary mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                data?.users.map((user) => (
                  <tr
                    key={user.id}
                    className={cn(
                      'hover:bg-bg-secondary/50 transition-colors',
                      actionLoading === user.id && 'opacity-50 pointer-events-none'
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-muted text-accent text-xs font-bold uppercase">
                          {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{user.name}</p>
                          <p className="text-xs text-text-tertiary">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Badge variant={roleBadgeVariant(user.role)}>{roleDisplayLabel(user.role)}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-secondary whitespace-nowrap">{user.tenantName || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-text-tertiary whitespace-nowrap">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Never'}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <UserCog className="h-4 w-4 mr-2 text-text-tertiary" />
                              Change Role
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                {availableRoles.map((role) => (
                                  <DropdownMenuItem
                                    key={role}
                                    onClick={() => handleChangeRole(user, role)}
                                    className={cn(user.role === role && 'font-semibold text-accent')}
                                  >
                                    {roleDisplayLabel(role)}
                                    {user.role === role && <span className="ml-auto text-xs text-accent">Current</span>}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            icon={<Trash2 className="h-4 w-4" />}
                            onClick={() => handleDelete(user)}
                            className="text-danger focus:text-danger"
                          >
                            Delete User
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
        {!loading && data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <p className="text-xs text-text-tertiary">
              Showing {((page - 1) * (data.pageSize || 10)) + 1}–{Math.min(page * (data.pageSize || 10), data.total)} of {data.total}
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
