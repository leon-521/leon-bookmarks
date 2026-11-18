'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle2,
  Bookmark as BookmarkIcon,
  Crown,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { tenantService, type WorkspaceMember } from '@/lib/services';
import { useAuth } from '@/hooks/use-auth';

const ROLE_META: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'danger' }
> = {
  SUPER_ADMIN: { label: '超级管理员', variant: 'danger' },
  ADMIN: { label: '管理员 (Admin)', variant: 'default' },
  EDITOR: { label: '编辑者 (Editor)', variant: 'success' },
  VIEWER: { label: '访客 (Viewer)', variant: 'secondary' },
};

export default function MembersPage() {
  const { user: currentUser } = useAuth();
  const [members, setMembers] = React.useState<WorkspaceMember[]>([]);
  const [quota, setQuota] = React.useState<{ used: number; limit: number; plan: string }>({
    used: 0,
    limit: 5,
    plan: 'FREE',
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<string>('ALL');
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Invite dialog state
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteName, setInviteName] = React.useState('');
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<'ADMIN' | 'EDITOR' | 'VIEWER'>('EDITOR');
  const [invitePassword, setInvitePassword] = React.useState('');
  const [isInviting, setIsInviting] = React.useState(false);

  // Per-row state
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  const loadMembers = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await tenantService.listMembers();
      setMembers(res.members || []);
      if (res.quota) setQuota(res.quota);
    } catch (err: any) {
      setError(err?.message || '加载工作区成员列表失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    setIsInviting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const created = await tenantService.inviteMember({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        password: invitePassword.trim() || undefined,
      });
      setMembers((prev) => [...prev, created]);
      setQuota((prev) => ({ ...prev, used: prev.used + 1 }));
      setInviteOpen(false);
      setInviteName('');
      setInviteEmail('');
      setInviteRole('EDITOR');
      setInvitePassword('');
      setSuccessMsg(`已成功添加成员 ${created.name}（${created.email}）`);
    } catch (err: any) {
      setError(err?.message || '邀请成员失败，请检查配额或邮箱是否已被占用');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setUpdatingId(memberId);
    setError(null);
    setSuccessMsg(null);
    try {
      const updated = await tenantService.updateMemberRole(memberId, newRole);
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: updated.role } : m)));
      setSuccessMsg('成员角色权限已更新');
    } catch (err: any) {
      setError(err?.message || '更新角色失败');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (member: WorkspaceMember) => {
    if (!window.confirm(`确定要将成员「${member.name}」移出当前工作区吗？`)) return;
    setRemovingId(member.id);
    setError(null);
    setSuccessMsg(null);
    try {
      await tenantService.removeMember(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setQuota((prev) => ({ ...prev, used: Math.max(0, prev.used - 1) }));
      setSuccessMsg(`已将 ${member.name} 移出工作区`);
    } catch (err: any) {
      setError(err?.message || '移除成员失败');
    } finally {
      setRemovingId(null);
    }
  };

  const filteredMembers = React.useMemo(() => {
    return members.filter((m) => {
      const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [members, roleFilter, searchQuery]);

  const isUnlimited = quota.limit < 0 || quota.limit >= 999999;
  const usagePercent = isUnlimited
    ? 15
    : Math.min(100, Math.round((quota.used / Math.max(1, quota.limit)) * 100));
  const quotaReached = !isUnlimited && quota.used >= quota.limit;

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="团队成员管理"
        description="管理当前租户工作区的协作成员、角色权限（RBAC）与席位配额。"
      >
        <Button
          onClick={() => setInviteOpen(true)}
          disabled={quotaReached}
          className="gap-1.5"
        >
          <UserPlus className="h-4 w-4" />
          邀请成员
        </Button>
      </PageHeader>

      {/* Quota Banner */}
      <div className="mb-6 rounded-xl border border-border bg-bg-primary p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2.5">
            <Users className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-text-primary">
              团队席位使用量：{quota.used} / {isUnlimited ? '不限' : quota.limit}
            </span>
            <Badge variant="default" className="gap-1">
              <Crown className="h-3 w-3" />
              {quota.plan} 方案
            </Badge>
          </div>
          <div className="h-2 w-full max-w-md rounded-full bg-bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                quotaReached ? 'bg-danger' : 'bg-accent'
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
        {quotaReached && (
          <Link href="/pricing">
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              升级方案解锁更多成员
            </Button>
          </Link>
        )}
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="mb-5 rounded-xl border border-danger/30 bg-danger-light p-4 flex items-center gap-2 text-danger text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-5 rounded-xl border border-success/30 bg-success-light p-4 flex items-center gap-2 text-success text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search & Role Filter */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="w-full sm:max-w-xs">
          <Input
            placeholder="搜索成员姓名或邮箱..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            iconLeft={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['ALL', 'ADMIN', 'EDITOR', 'VIEWER'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                roleFilter === r
                  ? 'bg-accent text-white'
                  : 'bg-bg-primary text-text-secondary border border-border hover:bg-bg-secondary'
              }`}
            >
              {r === 'ALL' ? '全部角色' : ROLE_META[r]?.label || r}
            </button>
          ))}
        </div>
      </div>

      {/* Members List */}
      <div className="rounded-xl border border-border bg-bg-primary overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-14 text-center text-sm text-text-secondary">
            <Users className="h-8 w-8 mx-auto mb-2 text-text-tertiary" />
            未找到符合条件的团队成员
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredMembers.map((member) => {
              const isSelf = currentUser?.id === member.id;
              const meta = ROLE_META[member.role] || {
                label: member.role,
                variant: 'secondary' as const,
              };

              return (
                <div
                  key={member.id}
                  className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-bg-secondary/40 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent font-semibold text-sm">
                      {member.name?.slice(0, 1).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {member.name}
                        </p>
                        {isSelf && (
                          <Badge variant="secondary" className="text-[10px]">
                            当前账号
                          </Badge>
                        )}
                        <Badge variant={meta.variant} className="text-[10px]">
                          {meta.label}
                        </Badge>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-text-tertiary">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <BookmarkIcon className="h-3 w-3" />
                          贡献 {member._count?.bookmarks ?? 0} 条书签
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Role Selector & Remove */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {member.role !== 'SUPER_ADMIN' && (
                      <select
                        value={member.role}
                        disabled={isSelf || updatingId === member.id}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="h-9 rounded-lg border border-border bg-bg-primary px-2.5 text-xs font-medium text-text-primary focus:border-accent focus:outline-none disabled:opacity-50"
                      >
                        <option value="ADMIN">管理员 (Admin)</option>
                        <option value="EDITOR">编辑者 (Editor)</option>
                        <option value="VIEWER">访客 (Viewer)</option>
                      </select>
                    )}
                    {!isSelf && member.role !== 'SUPER_ADMIN' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(member)}
                        loading={removingId === member.id}
                        className="text-danger hover:bg-danger-light gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        移除
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Role Permissions Guide */}
      <div className="mt-6 rounded-xl border border-border bg-bg-primary p-5">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-accent" />
          角色权限说明 (RBAC)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-text-secondary">
          <div className="rounded-lg bg-bg-secondary p-3">
            <p className="font-semibold text-text-primary mb-1">管理员 (Admin)</p>
            <p>拥有工作区全部权限，包括站点品牌与主题配置、成员管理、账单订阅及书签导入导出。</p>
          </div>
          <div className="rounded-lg bg-bg-secondary p-3">
            <p className="font-semibold text-text-primary mb-1">编辑者 (Editor)</p>
            <p>可新增、编辑、拖拽排序书签与分类目录，并可使用全部 AI 智能归档与巡检能力。</p>
          </div>
          <div className="rounded-lg bg-bg-secondary p-3">
            <p className="font-semibold text-text-primary mb-1">访客 (Viewer)</p>
            <p>只读访问团队内部书签库与 AI 知识库问答，不可修改或删除现有书签与目录。</p>
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>邀请新成员加入工作区</DialogTitle>
            <DialogDescription>
              为团队成员开通当前工作区账号并分配对应的访问角色。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <Input
              label="成员姓名"
              placeholder="例如：张晓明"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              required
            />
            <Input
              label="登录邮箱"
              type="email"
              placeholder="teammate@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                分配角色
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'EDITOR' | 'VIEWER')}
                className="flex h-10 w-full rounded-lg border border-border bg-bg-primary px-3.5 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
              >
                <option value="ADMIN">管理员 (Admin) — 管理设置、成员与书签</option>
                <option value="EDITOR">编辑者 (Editor) — 协作维护书签与分类</option>
                <option value="VIEWER">访客 (Viewer) — 仅浏览与检索书签</option>
              </select>
            </div>
            <Input
              label="初始登录密码（可选）"
              type="password"
              placeholder="留空则默认设为 Welcome123!"
              helperText="成员首次登录后可在个人设置中修改密码"
              value={invitePassword}
              onChange={(e) => setInvitePassword(e.target.value)}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                取消
              </Button>
              <Button type="submit" loading={isInviting} className="gap-1.5">
                <UserPlus className="h-4 w-4" />
                确认添加
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
