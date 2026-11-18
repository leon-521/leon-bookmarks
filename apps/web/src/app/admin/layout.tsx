'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Building2, Users, BarChart3, ChevronLeft, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3 },
  { href: '/admin/tenants', label: 'Tenants', icon: Building2 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/ai-providers', label: 'AI Providers', icon: Brain },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-bg-primary/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h1 className="font-display text-sm font-bold text-text-primary">Super Admin</h1>
              <p className="text-[11px] text-text-tertiary">Platform Management</p>
            </div>
          </div>
          <Link href="/dashboard" className="flex items-center gap-1 text-sm text-text-secondary hover:text-accent transition-colors">
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Admin Nav Tabs */}
        <nav className="mb-6 flex items-center gap-1 rounded-lg border border-border bg-bg-primary p-1 w-fit">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
                  isActive ? 'bg-accent text-white shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </div>
  );
}
