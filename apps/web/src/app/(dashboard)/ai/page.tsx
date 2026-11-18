'use client';

import * as React from 'react';
import {
  Sparkles,
  Wand2,
  Tags,
  FolderTree,
  Copy,
  Check,
  AlertCircle,
  Brain,
  Zap,
  Search,
  Trash2,
  MessageSquareText,
  Activity,
  ExternalLink,
  History,
  Send,
  Layers,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  aiService,
  bookmarkService,
  type AiAskResponse,
  type AiOrganizeResult,
  type DuplicateGroup,
  type HealthCheckResult,
  type TaxonomyProposal,
} from '@/lib/services';
import { cn } from '@/lib/utils';

type AiTab = 'ask' | 'organize' | 'taxonomy' | 'health';

const PRESET_QUESTIONS = [
  '有哪些常用的前端开发与 UI 设计工具？',
  '帮我找一下 AI 大模型和开发平台相关的书签',
  '推荐团队协作、文档与效率工具',
  '汇总目前收藏的技术文档与学习资源',
];

export default function AiPage() {
  const [activeTab, setActiveTab] = React.useState<AiTab>('ask');
  const [error, setError] = React.useState<string | null>(null);

  // 1. Copilot Ask state
  const [question, setQuestion] = React.useState('');
  const [isAsking, setIsAsking] = React.useState(false);
  const [askResult, setAskResult] = React.useState<AiAskResponse | null>(null);

  // 2. Auto-Organize & Single URL Lab state
  const [organizeAction, setOrganizeAction] = React.useState<'preview' | 'apply' | null>(null);
  const [organizeResult, setOrganizeResult] = React.useState<AiOrganizeResult | null>(null);
  const [labUrl, setLabUrl] = React.useState('');
  const [labTitle, setLabTitle] = React.useState('');
  const [isLabRunning, setIsLabRunning] = React.useState(false);
  const [labResult, setLabResult] = React.useState<{
    categoryName: string;
    confidence: number;
    reason: string;
    tags: string[];
    summary: string;
  } | null>(null);

  // 3. Taxonomy Architect state
  const [isSuggestingTaxonomy, setIsSuggestingTaxonomy] = React.useState(false);
  const [isApplyingTaxonomy, setIsApplyingTaxonomy] = React.useState(false);
  const [proposals, setProposals] = React.useState<TaxonomyProposal[] | null>(null);
  const [selectedProposalNames, setSelectedProposalNames] = React.useState<Set<string>>(new Set());
  const [taxonomyAppliedMsg, setTaxonomyAppliedMsg] = React.useState<string | null>(null);

  // 4. Health Check & Deduplication state
  const [isCheckingHealth, setIsCheckingHealth] = React.useState(false);
  const [healthResult, setHealthResult] = React.useState<HealthCheckResult | null>(null);
  const [isScanningDuplicates, setIsScanningDuplicates] = React.useState(false);
  const [duplicateGroups, setDuplicateGroups] = React.useState<DuplicateGroup[] | null>(null);
  const [deletingBookmarkId, setDeletingBookmarkId] = React.useState<string | null>(null);

  // Handlers
  const handleAsk = async (q?: string) => {
    const query = (q ?? question).trim();
    if (!query) return;
    if (q) setQuestion(q);
    setIsAsking(true);
    setError(null);
    try {
      const res = await aiService.ask(query);
      setAskResult(res);
    } catch (err: any) {
      setError(err?.message || 'AI 知识库问答请求失败');
    } finally {
      setIsAsking(false);
    }
  };

  const handleOrganize = async (autoApply: boolean) => {
    setOrganizeAction(autoApply ? 'apply' : 'preview');
    setError(null);
    try {
      const res = await aiService.organize(autoApply);
      setOrganizeResult(res);
    } catch (err: any) {
      setError(err?.message || 'AI 批量归档失败');
    } finally {
      setOrganizeAction(null);
    }
  };

  const handleRunLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labUrl.trim() || !labTitle.trim()) return;
    setIsLabRunning(true);
    setError(null);
    try {
      const [catRes, tagRes, sumRes] = await Promise.all([
        aiService.categorize({ url: labUrl.trim(), title: labTitle.trim() }),
        aiService.generateTags({ url: labUrl.trim(), title: labTitle.trim() }),
        aiService.summarize({ url: labUrl.trim(), title: labTitle.trim() }),
      ]);
      setLabResult({
        categoryName: catRes.categoryName,
        confidence: catRes.confidence,
        reason: catRes.reason,
        tags: tagRes.tags || [],
        summary: sumRes.description,
      });
    } catch (err: any) {
      setError(err?.message || '单链接 AI 解析失败');
    } finally {
      setIsLabRunning(false);
    }
  };

  const handleSuggestTaxonomy = async () => {
    setIsSuggestingTaxonomy(true);
    setTaxonomyAppliedMsg(null);
    setError(null);
    try {
      const res = await aiService.suggestTaxonomy();
      const list = res.proposals || [];
      setProposals(list);
      setSelectedProposalNames(new Set(list.map((p) => p.name)));
    } catch (err: any) {
      setError(err?.message || '生成分类架构建议失败');
    } finally {
      setIsSuggestingTaxonomy(false);
    }
  };

  const toggleProposal = (name: string) => {
    setSelectedProposalNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleApplyTaxonomy = async () => {
    if (!proposals) return;
    const chosen = proposals.filter((p) => selectedProposalNames.has(p.name));
    if (chosen.length === 0) return;
    setIsApplyingTaxonomy(true);
    setError(null);
    try {
      const res = await aiService.applyTaxonomy(
        chosen.map((p) => ({
          name: p.name,
          icon: p.icon,
          bookmarkIds: p.bookmarkIds,
        }))
      );
      setTaxonomyAppliedMsg(
        `已成功新建 ${res.createdCategories} 个分类，并将 ${res.assignedBookmarks} 条书签自动归入对应目录！`
      );
    } catch (err: any) {
      setError(err?.message || '应用分类方案失败');
    } finally {
      setIsApplyingTaxonomy(false);
    }
  };

  const handleHealthCheck = async () => {
    setIsCheckingHealth(true);
    setError(null);
    try {
      const res = await aiService.healthCheck(25);
      setHealthResult(res);
    } catch (err: any) {
      setError(err?.message || '书签健康巡检失败');
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleDetectDuplicates = async () => {
    setIsScanningDuplicates(true);
    setError(null);
    try {
      const res = await aiService.detectDuplicates();
      setDuplicateGroups(res.groups || []);
    } catch (err: any) {
      setError(err?.message || '重复书签扫描失败');
    } finally {
      setIsScanningDuplicates(false);
    }
  };

  const handleDeleteDuplicateBookmark = async (bookmarkId: string) => {
    setDeletingBookmarkId(bookmarkId);
    setError(null);
    try {
      await bookmarkService.delete(bookmarkId);
      setDuplicateGroups((prev) =>
        prev
          ? prev
              .map((g) => ({
                ...g,
                bookmarks: g.bookmarks.filter((b) => b.id !== bookmarkId),
              }))
              .filter((g) => g.bookmarks.length > 1)
          : null
      );
    } catch (err: any) {
      setError(err?.message || '删除重复书签失败');
    } finally {
      setDeletingBookmarkId(null);
    }
  };

  const tabs: { id: AiTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'ask', label: 'AI 知识库问答', icon: MessageSquareText, badge: 'RAG' },
    { id: 'organize', label: '智能归档与标签', icon: Wand2 },
    { id: 'taxonomy', label: '分类架构师', icon: Layers, badge: 'New' },
    { id: 'health', label: '失效巡检与去重', icon: Activity },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="AI 智能助手中心"
        description="基于大模型与本地启发式双引擎，提供书签语义问答、自动分类打标、目录重构与死链巡检。"
      >
        <Badge variant="default" className="gap-1.5 px-3 py-1">
          <Sparkles className="h-3.5 w-3.5" />
          Dual-Engine AI Ready
        </Badge>
      </PageHeader>

      {/* Capabilities Banner */}
      <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: MessageSquareText, label: '对话式检索', desc: '自然语言查找团队书签与知识源' },
          { icon: FolderTree, label: '智能自动分类', desc: '识别域名与语义自动归入最佳目录' },
          { icon: Layers, label: '目录架构生成', desc: '一键分析全量书签并构建分类树' },
          { icon: Activity, label: '死链诊断与替代', desc: 'HTTP 连通性巡检 + 时光机快照恢复' },
        ].map((cap) => (
          <div
            key={cap.label}
            className="rounded-xl border border-border bg-bg-primary p-4 flex items-start gap-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <cap.icon className="h-4 w-4 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">{cap.label}</p>
              <p className="text-xs text-text-tertiary mt-0.5 line-clamp-2">{cap.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setError(null);
              }}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                isActive
                  ? 'bg-accent text-white shadow-xs'
                  : 'bg-bg-primary text-text-secondary border border-border hover:bg-bg-secondary hover:text-text-primary'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.2 text-[10px] font-semibold',
                    isActive ? 'bg-white/20 text-white' : 'bg-accent/10 text-accent'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Global Error Alert */}
      {error && (
        <div className="mb-6 rounded-xl border border-danger/30 bg-danger-light p-4 flex items-center gap-2.5 text-danger">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* TAB 1: Copilot Q&A */}
      {activeTab === 'ask' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-bg-primary p-6">
            <h3 className="text-base font-semibold text-text-primary flex items-center gap-2 mb-1">
              <MessageSquareText className="h-5 w-5 text-accent" />
              向你的书签知识库提问
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              用自然语言描述你想找的工具、文档或业务场景，AI 将检索当前工作区书签并给出带引用来源的解答。
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="flex-1">
                <Input
                  placeholder="例如：帮我推荐几个适合做产品原型的设计工具..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  iconLeft={<Search className="h-4 w-4" />}
                />
              </div>
              <Button type="submit" loading={isAsking} disabled={!question.trim()} className="gap-1.5 shrink-0">
                <Send className="h-4 w-4" />
                AI 检索解答
              </Button>
            </form>

            {/* Preset Prompt Chips */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-text-tertiary">试试这样问：</span>
              {PRESET_QUESTIONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAsk(preset)}
                  disabled={isAsking}
                  className="rounded-full border border-border bg-bg-secondary px-3 py-1 text-xs text-text-secondary hover:border-accent hover:text-accent transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {askResult && (
            <div className="rounded-xl border border-border bg-bg-primary p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span className="font-semibold text-sm text-text-primary">AI 回答</span>
                </div>
                <Badge variant={askResult.mode === 'llm' ? 'default' : 'secondary'}>
                  {askResult.mode === 'llm' ? 'LLM 深度推理' : '启发式语义引擎'}
                </Badge>
              </div>

              <div className="text-sm leading-relaxed text-text-primary whitespace-pre-line">
                {askResult.answer}
              </div>

              {askResult.sources?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2.5">
                    引用的工作区书签 ({askResult.sources.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {askResult.sources.map((src) => (
                      <a
                        key={src.id}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group rounded-lg border border-border p-3 hover:border-accent/50 hover:bg-bg-secondary transition-all flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary group-hover:text-accent truncate">
                            {src.title}
                          </p>
                          <p className="text-xs text-text-tertiary truncate mt-0.5">{src.url}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {src.categoryName && (
                              <Badge variant="secondary" className="text-[10px]">
                                {src.categoryName}
                              </Badge>
                            )}
                            {src.tags?.slice(0, 3).map((t) => (
                              <Badge key={t} variant="default" className="text-[10px]">
                                #{t}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-text-tertiary group-hover:text-accent shrink-0 mt-0.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {askResult.followUps?.length > 0 && (
                <div className="pt-2 border-t border-border flex flex-wrap items-center gap-2">
                  <span className="text-xs text-text-tertiary">追问建议：</span>
                  {askResult.followUps.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => handleAsk(f)}
                      className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Auto-Organize & Single Link Lab */}
      {activeTab === 'organize' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-bg-primary p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                  <FolderTree className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">未分类书签批量智能归档</h3>
                  <p className="text-sm text-text-secondary mt-1 max-w-xl">
                    自动扫描工作区内尚未分类或缺少标签的书签，结合现有分类目录给出高置信度归档建议与标签。支持先预览后一键写入。
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOrganize(false)}
                  loading={organizeAction === 'preview'}
                  disabled={organizeAction !== null}
                  className="gap-1.5"
                >
                  <Brain className="h-4 w-4" />
                  预览建议
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleOrganize(true)}
                  loading={organizeAction === 'apply'}
                  disabled={organizeAction !== null}
                  className="gap-1.5"
                >
                  <Zap className="h-4 w-4" />
                  一键自动归档
                </Button>
              </div>
            </div>

            {organizeResult && (
              <div className="mt-6 rounded-xl border border-border overflow-hidden">
                <div className="bg-bg-secondary px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-sm border-b border-border">
                  <span className="font-medium text-text-primary">归档分析结果</span>
                  <div className="flex gap-4 text-xs sm:text-sm">
                    <span className="text-text-secondary">
                      扫描未分类: <strong>{organizeResult.processed}</strong>
                    </span>
                    <span className="text-success">
                      已自动归类: <strong>{organizeResult.categorized}</strong>
                    </span>
                    <span className="text-accent">
                      已补充标签: <strong>{organizeResult.tagged}</strong>
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-border max-h-[380px] overflow-y-auto">
                  {organizeResult.suggestions?.map((s) => (
                    <div key={s.bookmarkId} className="px-4 py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-primary truncate">{s.title}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <Badge variant="secondary" className="text-[10px]">
                            <FolderTree className="h-2.5 w-2.5 mr-1" />
                            {s.suggestedCategory}
                          </Badge>
                          {s.suggestedTags?.slice(0, 4).map((t) => (
                            <Badge key={t} variant="default" className="text-[10px]">
                              #{t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-16 h-1.5 rounded-full bg-bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-accent transition-all"
                            style={{ width: `${Math.round((s.confidence || 0) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-text-tertiary w-9 text-right">
                          {Math.round((s.confidence || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                  {organizeResult.suggestions?.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-text-secondary">
                      <Check className="h-8 w-8 mx-auto mb-2 text-success" />
                      太棒了！当前所有书签均已完成分类整理。
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Single Link AI Playground */}
          <div className="rounded-xl border border-border bg-bg-primary p-6">
            <h3 className="text-base font-semibold text-text-primary flex items-center gap-2 mb-1">
              <Tags className="h-4 w-4 text-accent" />
              单链接 AI 识别实验室
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              输入任意网址与标题，即时测试 AI 自动分类、标签提取与一句话摘要效果（添加书签弹窗内亦已内置同款能力）。
            </p>
            <form onSubmit={handleRunLab} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <Input
                  placeholder="https://github.com/vercel/next.js"
                  value={labUrl}
                  onChange={(e) => setLabUrl(e.target.value)}
                />
              </div>
              <div className="sm:col-span-5">
                <Input
                  placeholder="网页标题，如 Next.js by Vercel - The React Framework"
                  value={labTitle}
                  onChange={(e) => setLabTitle(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  loading={isLabRunning}
                  disabled={!labUrl.trim() || !labTitle.trim()}
                  className="w-full gap-1"
                >
                  <Sparkles className="h-4 w-4" />
                  解析
                </Button>
              </div>
            </form>

            {labResult && (
              <div className="mt-4 rounded-lg border border-border bg-bg-secondary p-4 space-y-2.5 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-text-secondary">推荐分类：</span>
                  <Badge variant="default">{labResult.categoryName}</Badge>
                  <span className="text-xs text-text-tertiary">
                    置信度 {Math.round((labResult.confidence || 0) * 100)}% · {labResult.reason}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-text-secondary">推荐标签：</span>
                  {labResult.tags.map((t) => (
                    <Badge key={t} variant="secondary">
                      #{t}
                    </Badge>
                  ))}
                </div>
                <div>
                  <span className="text-text-secondary">智能摘要：</span>
                  <span className="text-text-primary">{labResult.summary}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Taxonomy Architect */}
      {activeTab === 'taxonomy' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-bg-primary p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                  <Layers className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">AI 分类目录架构师</h3>
                  <p className="text-sm text-text-secondary mt-1 max-w-xl">
                    不知道如何规划导航站栏目？AI 会聚类分析你收藏的全部书签主题，自动设计一套结构清晰的分类目录方案，并支持一键创建分类及批量归入书签。
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSuggestTaxonomy}
                loading={isSuggestingTaxonomy}
                className="gap-1.5 shrink-0"
              >
                <Sparkles className="h-4 w-4" />
                生成目录架构方案
              </Button>
            </div>

            {taxonomyAppliedMsg && (
              <div className="mt-5 rounded-lg border border-success/30 bg-success-light p-4 flex items-center gap-2 text-success text-sm font-medium">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                {taxonomyAppliedMsg}
              </div>
            )}

            {proposals && (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {proposals.map((prop) => {
                    const checked = selectedProposalNames.has(prop.name);
                    return (
                      <label
                        key={prop.name}
                        className={cn(
                          'cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3',
                          checked
                            ? 'border-accent bg-accent/5'
                            : 'border-border bg-bg-primary hover:border-border-hover'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProposal(prop.name)}
                          className="mt-1 rounded border-border"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm text-text-primary flex items-center gap-1.5">
                              <span>{prop.icon || '📁'}</span>
                              <span>{prop.name}</span>
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="secondary" className="text-[10px]">
                                匹配 {prop.matchCount} 条
                              </Badge>
                              {prop.alreadyExists && (
                                <Badge variant="success" className="text-[10px]">
                                  已存在
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-text-secondary mt-1">{prop.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {proposals.length > 0 ? (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-text-tertiary">
                      已勾选 {selectedProposalNames.size} / {proposals.length} 个分类方案（未分类书签将自动归入对应目录）
                    </span>
                    <Button
                      onClick={handleApplyTaxonomy}
                      loading={isApplyingTaxonomy}
                      disabled={selectedProposalNames.size === 0}
                      className="gap-1.5"
                    >
                      <Check className="h-4 w-4" />
                      一键应用所选分类方案
                    </Button>
                  </div>
                ) : (
                  <p className="text-center text-sm text-text-secondary py-6">
                    当前书签数量较少，先导入或添加一些书签再来生成目录架构吧。
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Health Check & Deduplication */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          {/* Panel 1: Link Health Scanner */}
          <div className="rounded-xl border border-border bg-bg-primary p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Activity className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">死链巡检与时光机恢复</h3>
                  <p className="text-sm text-text-secondary mt-1 max-w-xl">
                    批量检测书签目标站点的 HTTP 可达性与响应耗时，自动标记失效链接（BROKEN），并提供 Internet Archive 历史快照入口与 AI 同类替代方案。
                  </p>
                </div>
              </div>
              <Button
                onClick={handleHealthCheck}
                loading={isCheckingHealth}
                className="gap-1.5 shrink-0"
              >
                <Activity className="h-4 w-4" />
                开始巡检 (Top 25)
              </Button>
            </div>

            {healthResult && (
              <div className="mt-6 rounded-xl border border-border overflow-hidden">
                <div className="bg-bg-secondary px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-sm border-b border-border">
                  <span className="font-medium text-text-primary">连通性巡检报告</span>
                  <div className="flex gap-4 text-xs sm:text-sm">
                    <span className="text-text-secondary">
                      共检测: <strong>{healthResult.checked}</strong>
                    </span>
                    <span className="text-success">
                      正常在线: <strong>{healthResult.healthyCount}</strong>
                    </span>
                    <span className="text-danger">
                      异常/死链: <strong>{healthResult.brokenCount}</strong>
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-border max-h-[380px] overflow-y-auto">
                  {healthResult.results.map((item) => (
                    <div key={item.id} className="px-4 py-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {item.healthy ? (
                            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-danger shrink-0" />
                          )}
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-text-primary hover:text-accent truncate"
                          >
                            {item.title}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-xs">
                          <Badge variant={item.healthy ? 'success' : 'danger'}>
                            {item.httpStatus ? `HTTP ${item.httpStatus}` : 'TIMEOUT'}
                          </Badge>
                          <span className="text-text-tertiary w-14 text-right">{item.latencyMs} ms</span>
                        </div>
                      </div>

                      {!item.healthy && (
                        <div className="pl-6 flex flex-wrap items-center justify-between gap-2 text-xs">
                          {item.aiAlternative && (
                            <span className="text-text-secondary">{item.aiAlternative}</span>
                          )}
                          {item.waybackUrl && (
                            <a
                              href={item.waybackUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-accent hover:underline font-medium"
                            >
                              <History className="h-3.5 w-3.5" />
                              查看时光机网页快照
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Panel 2: Duplicate Detector */}
          <div className="rounded-xl border border-border bg-bg-primary p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                  <Copy className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">重复与高度相似书签清理</h3>
                  <p className="text-sm text-text-secondary mt-1 max-w-xl">
                    智能归一化比对 URL（忽略末尾斜杠、协议差异等）及近似标题，精准揪出重复收藏并支持一键清理。
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleDetectDuplicates}
                loading={isScanningDuplicates}
                className="gap-1.5 shrink-0"
              >
                <Search className="h-4 w-4" />
                扫描重复项
              </Button>
            </div>

            {duplicateGroups && (
              <div className="mt-6 rounded-xl border border-border overflow-hidden">
                <div className="bg-bg-secondary px-4 py-3 flex items-center justify-between border-b border-border">
                  <span className="text-sm font-medium text-text-primary">重复检测结果</span>
                  <Badge variant="secondary">{duplicateGroups.length} 组重复</Badge>
                </div>
                <div className="divide-y divide-border max-h-[360px] overflow-y-auto">
                  {duplicateGroups.map((group, idx) => (
                    <div key={idx} className="px-4 py-3 space-y-2">
                      <p className="text-xs font-medium text-amber-600">{group.reason}</p>
                      <div className="space-y-1.5">
                        {group.bookmarks.map((b) => (
                          <div
                            key={b.id}
                            className="flex items-center justify-between gap-3 rounded-lg bg-bg-secondary px-3 py-2 text-sm"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-text-primary truncate">{b.title}</p>
                              <p className="text-xs text-text-tertiary truncate">{b.url}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDuplicateBookmark(b.id)}
                              loading={deletingBookmarkId === b.id}
                              className="text-danger hover:bg-danger-light shrink-0 gap-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              移除
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {duplicateGroups.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-text-secondary">
                      <Check className="h-8 w-8 mx-auto mb-2 text-success" />
                      未发现任何重复书签，你的收藏库非常整洁！
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-8 rounded-xl border border-border bg-bg-primary p-5 text-sm text-text-secondary">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-text-primary mb-1">双模式 AI 架构说明</p>
            <p>
              配置 <code className="rounded bg-bg-secondary px-1.5 py-0.5 text-xs">OPENAI_API_KEY</code> 与{' '}
              <code className="rounded bg-bg-secondary px-1.5 py-0.5 text-xs">OPENAI_BASE_URL</code>（兼容 OpenAI、DeepSeek、通义千问及本地 Ollama）后，系统自动启用大模型深度推理；未配置密钥时无缝降级至内置域名词典与 TF 关键词相似度启发式引擎，开箱即用零外部依赖。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
