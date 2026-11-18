'use client';

import * as React from 'react';
import { Sparkles, Wand2, Tags, FolderTree, Copy, ArrowRight, Check, AlertCircle, Loader2, Brain, Zap, Search, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function AiPage() {
  const [activeAction, setActiveAction] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [organizeResult, setOrganizeResult] = React.useState<any>(null);
  const [duplicateResult, setDuplicateResult] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleOrganize = async (autoApply: boolean) => {
    setIsProcessing(true);
    setError(null);
    setOrganizeResult(null);
    try {
      const res = await api.post<any>('/ai/organize', { autoApply });
      setOrganizeResult(res.data || res);
    } catch (err: any) {
      setError(err?.message || 'AI organize failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDetectDuplicates = async () => {
    setIsProcessing(true);
    setError(null);
    setDuplicateResult(null);
    try {
      const res = await api.get<any>('/ai/duplicates');
      setDuplicateResult(res.data || res);
    } catch (err: any) {
      setError(err?.message || 'Duplicate detection failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const aiActions = [
    {
      id: 'organize',
      icon: FolderTree,
      title: 'Auto-Organize',
      description: 'AI analyzes uncategorized bookmarks and suggests the best category and tags for each one.',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      id: 'duplicates',
      icon: Copy,
      title: 'Find Duplicates',
      description: 'Detect duplicate or very similar bookmarks across your collection to keep things clean.',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="AI Assistant"
        description="Use AI to automatically organize, tag, and clean up your bookmark collection."
      >
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Powered by AI
          </Badge>
        </div>
      </PageHeader>

      {/* AI Capabilities Overview */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: FolderTree, label: 'Auto Categorize', desc: 'Smart folder assignment' },
          { icon: Tags, label: 'Auto Tags', desc: 'Generate relevant tags' },
          { icon: Wand2, label: 'Smart Summary', desc: 'AI-written descriptions' },
          { icon: Search, label: 'Find Similar', desc: 'Discover related links' },
        ].map((cap) => (
          <div key={cap.label} className="rounded-xl border border-border bg-bg-primary p-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <cap.icon className="h-5 w-5 text-accent" />
            </div>
            <p className="text-sm font-semibold text-text-primary">{cap.label}</p>
            <p className="text-xs text-text-tertiary mt-0.5">{cap.desc}</p>
          </div>
        ))}
      </div>

      {/* Action Cards */}
      <div className="space-y-4 mb-8">
        {aiActions.map((action) => (
          <div
            key={action.id}
            className="rounded-xl border border-border bg-bg-primary p-6 transition-all hover:shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', action.bgColor)}>
                  <action.icon className={cn('h-6 w-6', action.color)} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">{action.title}</h3>
                  <p className="text-sm text-text-secondary mt-1 max-w-lg">{action.description}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {action.id === 'organize' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOrganize(false)}
                      loading={isProcessing && activeAction === 'preview'}
                      disabled={isProcessing}
                      className="gap-1"
                      onClickCapture={() => setActiveAction('preview')}
                    >
                      <Brain className="h-3.5 w-3.5" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleOrganize(true)}
                      loading={isProcessing && activeAction === 'apply'}
                      disabled={isProcessing}
                      className="gap-1"
                      onClickCapture={() => setActiveAction('apply')}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      Auto-Apply
                    </Button>
                  </>
                )}
                {action.id === 'duplicates' && (
                  <Button
                    size="sm"
                    onClick={handleDetectDuplicates}
                    loading={isProcessing}
                    disabled={isProcessing}
                    className="gap-1"
                  >
                    <Search className="h-3.5 w-3.5" />
                    Scan Now
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Organize Results */}
      {organizeResult && (
        <div className="mb-8 rounded-xl border border-border bg-bg-primary shadow-xs">
          <div className="border-b border-border px-5 py-4 flex items-center justify-between">
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              Organization Results
            </h3>
            <div className="flex gap-3 text-sm">
              <span className="text-text-secondary">Processed: <strong>{organizeResult.processed}</strong></span>
              <span className="text-success">Categorized: <strong>{organizeResult.categorized}</strong></span>
              <span className="text-accent">Tagged: <strong>{organizeResult.tagged}</strong></span>
            </div>
          </div>
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {organizeResult.suggestions?.map((s: any) => (
              <div key={s.bookmarkId} className="px-5 py-3 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">{s.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px]">
                      <FolderTree className="h-2.5 w-2.5 mr-1" />
                      {s.suggestedCategory}
                    </Badge>
                    {s.suggestedTags?.slice(0, 3).map((t: string) => (
                      <Badge key={t} variant="default" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-16 h-1.5 rounded-full bg-bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${(s.confidence || 0) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-tertiary w-8">{Math.round((s.confidence || 0) * 100)}%</span>
                </div>
              </div>
            ))}
            {organizeResult.suggestions?.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-text-secondary">
                <Check className="h-8 w-8 mx-auto mb-2 text-success" />
                All bookmarks are already organized!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Duplicate Results */}
      {duplicateResult && (
        <div className="mb-8 rounded-xl border border-border bg-bg-primary shadow-xs">
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              <Copy className="h-4 w-4 text-amber-500" />
              Duplicate Detection
              <Badge variant="secondary" className="text-[10px]">{duplicateResult.groups?.length || 0} groups found</Badge>
            </h3>
          </div>
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {duplicateResult.groups?.map((group: any, i: number) => (
              <div key={i} className="px-5 py-3">
                <p className="text-xs text-text-tertiary mb-2">{group.reason}</p>
                <div className="space-y-1.5">
                  {group.bookmarks?.map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-text-primary font-medium truncate">{b.title}</span>
                        <span className="text-text-tertiary text-xs truncate">{b.url}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {(!duplicateResult.groups || duplicateResult.groups.length === 0) && (
              <div className="px-5 py-8 text-center text-sm text-text-secondary">
                <Check className="h-8 w-8 mx-auto mb-2 text-success" />
                No duplicates found! Your collection is clean.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info footer */}
      <div className="rounded-xl border border-border bg-bg-primary p-5 text-sm text-text-secondary">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-text-primary mb-1">How AI features work</p>
            <p>When an OpenAI API key is configured, the system uses GPT models for intelligent categorization and tagging. Without an API key, it falls back to keyword-based heuristic analysis. AI features also trigger automatically when you add bookmarks — the category and tag suggestions in the bookmark form are powered by the same engine.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
