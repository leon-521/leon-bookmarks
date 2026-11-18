'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bookmark,
  FolderTree,
  Users,
  Import,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
  { label: 'Categories', href: '/categories', icon: FolderTree },
  { label: 'Members', href: '/members', icon: Users },
  { label: 'Import', href: '/import', icon: Import },
  { href: '/ai', label: 'AI Assistant', icon: Sparkles },
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const visibleNavItems = React.useMemo(
    () =>
      user?.role === 'SUPER_ADMIN'
        ? [...navItems, { label: 'Super Admin', href: '/admin', icon: Shield }]
        : navItems,
    [user?.role]
  );

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 border-b border-border px-4',
        'h-[var(--topbar-height)]',
        collapsed && 'justify-center px-2'
      )}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white shadow-sm shrink-0">
          <Sparkles className="h-4.5 w-4.5" />
        </div>
        {!collapsed && (
          <span className="font-display text-md font-semibold text-text-primary truncate">
            Leon Bookmarks
          </span>
        )}
        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="ml-auto rounded-md p-1 text-text-tertiary hover:bg-bg-secondary hover:text-text-primary lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-none px-3 py-4">
        <ul className="space-y-1">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    collapsed && 'justify-center px-2',
                    isActive
                      ? 'bg-accent-muted text-accent shadow-xs'
                      : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-[18px] w-[18px] shrink-0 transition-colors',
                      isActive ? 'text-accent' : 'text-text-tertiary group-hover:text-text-secondary'
                    )}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden lg:block border-t border-border p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn('w-full', collapsed && 'px-2')}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex lg:flex-col fixed left-0 top-0 h-screen border-r border-border bg-bg-primary z-30',
          'transition-all duration-300 ease-in-out',
          collapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-[var(--sidebar-width)] border-r border-border bg-bg-primary z-50',
          'transition-transform duration-300 ease-in-out lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
