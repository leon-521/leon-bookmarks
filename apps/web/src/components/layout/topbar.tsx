'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useTheme } from '@/providers/theme-provider';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TopBarProps {
  sidebarCollapsed: boolean;
  onMenuClick: () => void;
}

export function TopBar({ sidebarCollapsed, onMenuClick }: TopBarProps) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    router.push(trimmed ? `/bookmarks?search=${encodeURIComponent(trimmed)}` : '/bookmarks');
  };

  const handleSignOut = () => {
    logout();
    router.replace('/login');
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-20 flex items-center border-b border-border bg-bg-primary/80 backdrop-blur-md',
        'h-[var(--topbar-height)] px-4 lg:px-6',
        'transition-all duration-300',
        sidebarCollapsed
          ? 'left-0 lg:left-[var(--sidebar-collapsed-width)]'
          : 'left-0 lg:left-[var(--sidebar-width)]'
      )}
    >
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="lg:hidden mr-2"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl mx-auto lg:mx-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookmarks (press Enter)..."
            className={cn(
              'w-full h-9 rounded-lg border border-border bg-bg-secondary pl-9 pr-4 text-sm text-text-primary',
              'placeholder:text-text-tertiary',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-bg-primary'
            )}
          />
        </div>
      </form>

      {/* Right actions */}
      <div className="flex items-center gap-1 ml-4">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="text-text-secondary"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-[18px] w-[18px]" />
          ) : (
            <Moon className="h-[18px] w-[18px]" />
          )}
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-2 rounded-full ring-2 ring-transparent transition-all hover:ring-accent/20 focus:outline-none focus:ring-accent/30">
              <Avatar
                size="sm"
                fallback={user?.name || 'User'}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.name}</span>
                <span className="text-xs text-text-tertiary">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              Workspace Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings/billing')}>
              Billing &amp; Plan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-danger focus:text-danger"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
