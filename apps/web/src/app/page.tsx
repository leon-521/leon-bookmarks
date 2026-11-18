'use client';

import Link from 'next/link';
import { Sparkles, Bookmark, Users, Palette, ArrowRight, Zap, Shield, Globe, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/providers/theme-provider';

const features = [
  {
    icon: Bookmark,
    title: 'Smart Bookmarks',
    description: 'Organize your team\'s essential links with intelligent categorization, auto-fetching metadata, and powerful search.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Multi-tenant workspaces let every team curate and share their own bookmark collection with role-based access.',
  },
  {
    icon: Palette,
    title: 'Custom Navigation Portals',
    description: 'Create beautiful, branded navigation pages with custom themes, colors, and layouts that reflect your team\'s identity.',
  },
];

const stats = [
  { label: 'Teams Active', value: '2,500+' },
  { label: 'Bookmarks Saved', value: '1.2M+' },
  { label: 'Portal Views', value: '10M+' },
];

export default function LandingPage() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg-primary/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-semibold">Leon Bookmarks</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="rounded-lg p-2 text-text-secondary hover:bg-bg-secondary transition-colors"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-pattern" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-muted px-4 py-1.5 text-sm text-accent">
            <Zap className="h-3.5 w-3.5" />
            <span>Now in public beta — free for all teams</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight text-text-primary leading-tight">
            Your team&apos;s
            <span className="text-gradient"> bookmark hub</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Organize, share, and navigate your team&apos;s essential links.
            Create stunning navigation portals with custom themes
            that your whole team will love.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2 px-8 shadow-lg shadow-accent/20">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/portal/acme-dev">
              <Button variant="outline" size="lg" className="gap-2 px-8">
                <Globe className="h-4 w-4" />
                View Demo Portal
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 flex items-center justify-center gap-12 sm:gap-20">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-display font-bold text-text-primary">{stat.value}</div>
                <div className="mt-1 text-sm text-text-tertiary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-bg-secondary">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-primary">
              Everything your team needs
            </h2>
            <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
              A powerful yet simple platform to manage your team&apos;s most important links.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-border bg-bg-primary p-8 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-accent/20"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-muted text-accent transition-transform duration-300 group-hover:scale-110">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-display font-semibold text-text-primary mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-success-light text-success mb-6">
            <Shield className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-display font-bold text-text-primary mb-4">
            Trusted by teams worldwide
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-10">
            From startups to enterprises, teams rely on Leon Bookmarks to keep their most important resources organized and accessible.
          </p>
          <Link href="/register">
            <Button size="lg" className="gap-2 shadow-lg shadow-accent/20">
              Start Organizing Today
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-white">
              <Sparkles className="h-3 w-3" />
            </div>
            <span className="text-sm font-medium text-text-secondary">Leon Bookmarks</span>
          </div>
          <p className="text-sm text-text-tertiary">
            &copy; {new Date().getFullYear()} Leon Bookmarks. Built with Next.js &amp; Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  );
}
