'use client';

import * as React from 'react';
import { Save, Upload, Globe, Paintbrush } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { mockTenant } from '@/lib/mock-data';

const tabs = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'theme', label: 'Theme', icon: Paintbrush },
  { id: 'domain', label: 'Domain', icon: Globe },
] as const;

type TabId = (typeof tabs)[number]['id'];

const presetThemes = [
  { name: 'Ocean Blue', color: '#3b82f6', bg: 'bg-blue-500' },
  { name: 'Emerald', color: '#10b981', bg: 'bg-emerald-500' },
  { name: 'Violet', color: '#8b5cf6', bg: 'bg-violet-500' },
  { name: 'Rose', color: '#f43f5e', bg: 'bg-rose-500' },
  { name: 'Amber', color: '#f59e0b', bg: 'bg-amber-500' },
  { name: 'Teal', color: '#14b8a6', bg: 'bg-teal-500' },
];

const layoutOptions = [
  { id: 'grid', label: 'Grid', description: 'Display bookmarks in a card grid' },
  { id: 'list', label: 'List', description: 'Display bookmarks in a compact list' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState<TabId>('general');
  const [settings, setSettings] = React.useState({
    name: mockTenant.name,
    slug: mockTenant.slug,
    accentColor: mockTenant.themeConfig.accentColor,
    layout: mockTenant.themeConfig.layout,
    borderRadius: mockTenant.themeConfig.borderRadius,
    cardSpacing: mockTenant.themeConfig.cardSpacing,
    customDomain: '',
  });

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Settings"
        description="Manage your workspace configuration and appearance."
      >
        <Button className="gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </PageHeader>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-border bg-bg-primary p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200',
              activeTab === tab.id
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="rounded-xl border border-border bg-bg-primary p-6 shadow-xs space-y-6 animate-fade-in">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">Workspace Details</h3>
            <p className="text-sm text-text-secondary">Basic information about your workspace.</p>
          </div>

          <div className="space-y-4">
            <Input
              label="Workspace Name"
              value={settings.name}
              onChange={(e) => setSettings((s) => ({ ...s, name: e.target.value }))}
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Logo</label>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-border bg-bg-secondary text-text-tertiary">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <Button variant="outline" size="sm">Upload Logo</Button>
                  <p className="mt-1.5 text-xs text-text-tertiary">SVG, PNG, or JPG. Max 2MB.</p>
                </div>
              </div>
            </div>

            <Input
              label="Workspace Slug"
              value={settings.slug}
              onChange={(e) => setSettings((s) => ({ ...s, slug: e.target.value }))}
              helperText={`Portal URL: leon.app/portal/${settings.slug}`}
            />
          </div>
        </div>
      )}

      {/* Theme Tab */}
      {activeTab === 'theme' && (
        <div className="rounded-xl border border-border bg-bg-primary p-6 shadow-xs space-y-8 animate-fade-in">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">Theme Configuration</h3>
            <p className="text-sm text-text-secondary">Customize the look and feel of your navigation portal.</p>
          </div>

          {/* Preset Selector */}
          <div>
            <label className="mb-3 block text-sm font-medium text-text-primary">Accent Color</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {presetThemes.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => setSettings((s) => ({ ...s, accentColor: theme.color }))}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all duration-200',
                    settings.accentColor === theme.color
                      ? 'border-accent shadow-md scale-105'
                      : 'border-border hover:border-border-hover'
                  )}
                >
                  <div className={cn('h-8 w-8 rounded-full shadow-sm', theme.bg)} />
                  <span className="text-xs text-text-secondary">{theme.name}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <label className="text-sm text-text-secondary">Custom:</label>
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => setSettings((s) => ({ ...s, accentColor: e.target.value }))}
                className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <span className="text-sm font-mono text-text-tertiary">{settings.accentColor}</span>
            </div>
          </div>

          {/* Layout */}
          <div>
            <label className="mb-3 block text-sm font-medium text-text-primary">Layout</label>
            <div className="grid grid-cols-2 gap-3">
              {layoutOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSettings((s) => ({ ...s, layout: option.id as 'grid' | 'list' }))}
                  className={cn(
                    'flex flex-col items-start rounded-xl border-2 p-4 transition-all duration-200',
                    settings.layout === option.id
                      ? 'border-accent bg-accent-muted shadow-sm'
                      : 'border-border hover:border-border-hover'
                  )}
                >
                  <span className="text-sm font-medium text-text-primary">{option.label}</span>
                  <span className="mt-0.5 text-xs text-text-secondary">{option.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Border Radius */}
          <div>
            <label className="mb-3 block text-sm font-medium text-text-primary">
              Border Radius: {settings.borderRadius}px
            </label>
            <input
              type="range"
              min="0"
              max="24"
              value={settings.borderRadius}
              onChange={(e) => setSettings((s) => ({ ...s, borderRadius: parseInt(e.target.value) }))}
              className="w-full h-2 bg-bg-tertiary rounded-full appearance-none cursor-pointer accent-accent"
            />
            <div className="flex justify-between text-xs text-text-tertiary mt-1">
              <span>Sharp</span>
              <span>Rounded</span>
            </div>
          </div>

          {/* Card Spacing */}
          <div>
            <label className="mb-3 block text-sm font-medium text-text-primary">
              Card Spacing: {settings.cardSpacing}px
            </label>
            <input
              type="range"
              min="8"
              max="32"
              value={settings.cardSpacing}
              onChange={(e) => setSettings((s) => ({ ...s, cardSpacing: parseInt(e.target.value) }))}
              className="w-full h-2 bg-bg-tertiary rounded-full appearance-none cursor-pointer accent-accent"
            />
            <div className="flex justify-between text-xs text-text-tertiary mt-1">
              <span>Compact</span>
              <span>Spacious</span>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="mb-3 block text-sm font-medium text-text-primary">Preview</label>
            <div className="rounded-xl border border-border bg-bg-secondary p-6">
              <div
                className="grid grid-cols-3 gap-3"
                style={{ gap: `${settings.cardSpacing}px` }}
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-24 border border-border bg-bg-primary shadow-xs"
                    style={{
                      borderRadius: `${settings.borderRadius}px`,
                      borderBottomColor: settings.accentColor,
                      borderBottomWidth: '2px',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Domain Tab */}
      {activeTab === 'domain' && (
        <div className="rounded-xl border border-border bg-bg-primary p-6 shadow-xs space-y-6 animate-fade-in">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">Custom Domain</h3>
            <p className="text-sm text-text-secondary">Use your own domain for the navigation portal.</p>
          </div>

          <Input
            label="Custom Domain"
            placeholder="bookmarks.yourdomain.com"
            value={settings.customDomain}
            onChange={(e) => setSettings((s) => ({ ...s, customDomain: e.target.value }))}
            helperText="Point a CNAME record to portal.leon.app"
            iconLeft={<Globe className="h-4 w-4" />}
          />

          <div className="rounded-lg border border-border bg-bg-secondary p-4">
            <h4 className="text-sm font-medium text-text-primary mb-2">DNS Configuration</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-text-tertiary w-14">Type</span>
                <span className="font-mono text-text-primary">CNAME</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-text-tertiary w-14">Name</span>
                <span className="font-mono text-text-primary">bookmarks</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-text-tertiary w-14">Value</span>
                <span className="font-mono text-text-primary">portal.leon.app</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
