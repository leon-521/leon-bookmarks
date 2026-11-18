'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './sidebar';
import { TopBar } from './topbar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-bg-secondary">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <TopBar
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={() => setMobileOpen(true)}
      />
      <main
        className={cn(
          'pt-[var(--topbar-height)] min-h-screen transition-all duration-300',
          sidebarCollapsed
            ? 'lg:pl-[var(--sidebar-collapsed-width)]'
            : 'lg:pl-[var(--sidebar-width)]'
        )}
      >
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
