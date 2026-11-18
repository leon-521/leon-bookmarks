'use client';

import * as React from 'react';
import { Brain, Plus, Trash2, Star, StarOff, Power, PowerOff, TestTube, Pencil, Check, X, Loader2, ExternalLink } from 'lucide-react';
import { adminService } from '@/lib/services/admin.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AiProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  isDefault: boolean;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TestResult {
  success: boolean;
  status?: number;
  reply?: string;
  model?: string;
  error?: string;
}

export default function AiProvidersPage() {
  const [providers, setProviders] = React.useState<AiProvider[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [testResults, setTestResults] = React.useState<Record<string, TestResult>>({});

  // Form state
  const [formData, setFormData] = React.useState({
    name: '',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
    isDefault: false,
    description: '',
  });

  const fetchProviders = React.useCallback(async () => {
    try {
      const res = await adminService.listAiProviders();
      setProviders(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      console.error('Failed to fetch AI providers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const resetForm = () => {
    setFormData({ name: '', baseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4o-mini', isDefault: false, description: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('form');
    try {
      if (editingId) {
        const { apiKey, ...rest } = formData;
        await adminService.updateAiProvider(editingId, apiKey.trim() ? formData : rest);
      } else {
        await adminService.createAiProvider(formData);
      }
      resetForm();
      await fetchProviders();
    } catch (err) {
      console.error('Failed to save AI provider:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (provider: AiProvider) => {
    setFormData({
      name: provider.name,
      baseUrl: provider.baseUrl,
      apiKey: '', // Don't pre-fill masked key
      model: provider.model,
      isDefault: provider.isDefault,
      description: provider.description || '',
    });
    setEditingId(provider.id);
    setShowForm(true);
  };

  const handleSetDefault = async (id: string) => {
    setActionLoading(id);
    try {
      await adminService.setDefaultAiProvider(id);
      await fetchProviders();
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (provider: AiProvider) => {
    setActionLoading(provider.id);
    try {
      await adminService.updateAiProvider(provider.id, { isActive: !provider.isActive });
      await fetchProviders();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this AI provider?')) return;
    setActionLoading(id);
    try {
      await adminService.deleteAiProvider(id);
      await fetchProviders();
    } finally {
      setActionLoading(null);
    }
  };

  const handleTest = async (id: string) => {
    setActionLoading(`test-${id}`);
    setTestResults((prev) => ({ ...prev, [id]: undefined as any }));
    try {
      const res = await adminService.testAiProvider(id);
      setTestResults((prev) => ({ ...prev, [id]: res.data || res }));
    } catch (err: any) {
      setTestResults((prev) => ({ ...prev, [id]: { success: false, error: err.message || 'Request failed' } }));
    } finally {
      setActionLoading(null);
    }
  };

  const presets = [
    { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
    { name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
    { name: 'Moonshot (月之暗面)', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
    { name: 'Zhipu (智谱)', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
    { name: 'Silicon Flow (硅基流动)', baseUrl: 'https://api.siliconflow.cn/v1', model: 'Qwen/Qwen2.5-7B-Instruct' },
    { name: 'Ollama (Local)', baseUrl: 'http://localhost:11434/v1', model: 'llama3' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-text-primary flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Providers
          </h2>
          <p className="mt-1 text-sm text-text-tertiary">
            管理 AI 供应商配置，支持任何 OpenAI 兼容接口 / Manage AI provider configurations (any OpenAI-compatible API)
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Provider
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-bg-primary p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-text-primary mb-4">
            {editingId ? 'Edit Provider' : 'Add New AI Provider'}
          </h3>

          {/* Quick Presets */}
          {!editingId && (
            <div className="mb-4">
              <p className="text-xs text-text-tertiary mb-2">快速选择 / Quick Presets:</p>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, name: preset.name, baseUrl: preset.baseUrl, model: preset.model }))}
                    className={cn(
                      'rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-all hover:border-accent hover:text-accent',
                      formData.baseUrl === preset.baseUrl && 'border-accent bg-accent/10 text-accent'
                    )}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">供应商名称 / Provider Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. OpenAI, DeepSeek, Ollama..."
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">模型 / Model *</label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                  placeholder="e.g. gpt-4o-mini, deepseek-chat"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">API 地址 / Base URL *</label>
              <Input
                value={formData.baseUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="https://api.openai.com/v1"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">API 密钥 / API Key *{editingId ? ' (leave blank to keep current)' : ''}</label>
              <Input
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData((prev) => ({ ...prev, apiKey: e.target.value }))}
                placeholder={editingId ? '••••••••••••' : 'sk-...'}
                required={!editingId}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">描述 / Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData((prev) => ({ ...prev, isDefault: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="isDefault" className="text-sm text-text-secondary">设为默认 / Set as default provider</label>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={actionLoading === 'form'} className="gap-2">
                {actionLoading === 'form' && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? 'Update' : 'Create'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Provider List */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-xl border border-border bg-bg-primary p-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-text-tertiary" />
            <p className="mt-2 text-sm text-text-tertiary">Loading providers...</p>
          </div>
        ) : providers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-bg-primary p-12 text-center">
            <Brain className="h-10 w-10 mx-auto text-text-tertiary opacity-40" />
            <p className="mt-3 text-sm font-medium text-text-secondary">No AI providers configured</p>
            <p className="mt-1 text-xs text-text-tertiary">尚未配置 AI 供应商。点击上方按钮添加。</p>
            <p className="mt-0.5 text-xs text-text-tertiary">Add a provider to enable AI-powered features like auto-categorization, smart tagging, and Q&A.</p>
          </div>
        ) : (
          providers.map((provider) => (
            <div
              key={provider.id}
              className={cn(
                'rounded-xl border bg-bg-primary p-5 transition-all',
                provider.isDefault ? 'border-accent/50 shadow-sm ring-1 ring-accent/20' : 'border-border',
                !provider.isActive && 'opacity-60'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg text-white',
                    provider.isActive ? 'bg-purple-500' : 'bg-gray-400'
                  )}>
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-text-primary">{provider.name}</h3>
                      {provider.isDefault && <Badge variant="default" className="text-[10px]">Default</Badge>}
                      {!provider.isActive && <Badge variant="secondary" className="text-[10px]">Disabled</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-text-tertiary font-mono">{provider.baseUrl}</p>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-text-secondary">
                      <span>Model: <code className="rounded bg-bg-secondary px-1.5 py-0.5 font-mono text-[11px]">{provider.model}</code></span>
                      <span>Key: <code className="rounded bg-bg-secondary px-1.5 py-0.5 font-mono text-[11px]">{provider.apiKey}</code></span>
                    </div>
                    {provider.description && <p className="mt-1.5 text-xs text-text-tertiary">{provider.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8"
                    title="Test connection"
                    disabled={actionLoading === `test-${provider.id}`}
                    onClick={() => handleTest(provider.id)}
                  >
                    {actionLoading === `test-${provider.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8"
                    title={provider.isDefault ? 'Already default' : 'Set as default'}
                    disabled={provider.isDefault || actionLoading === provider.id}
                    onClick={() => handleSetDefault(provider.id)}
                  >
                    {provider.isDefault ? <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> : <StarOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8"
                    title={provider.isActive ? 'Disable' : 'Enable'}
                    onClick={() => handleToggleActive(provider)}
                  >
                    {provider.isActive ? <Power className="h-4 w-4 text-green-500" /> : <PowerOff className="h-4 w-4 text-gray-400" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => handleEdit(provider)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600"
                    title="Delete"
                    onClick={() => handleDelete(provider.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Test Result */}
              {testResults[provider.id] && (
                <div className={cn(
                  'mt-3 rounded-lg px-4 py-2.5 text-xs',
                  testResults[provider.id].success
                    ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                )}>
                  {testResults[provider.id].success ? (
                    <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Connection successful — Model: {testResults[provider.id].model}, Reply: &quot;{testResults[provider.id].reply}&quot;</span>
                  ) : (
                    <span className="flex items-center gap-1.5"><X className="h-3.5 w-3.5" /> Connection failed — {testResults[provider.id].error || `HTTP ${testResults[provider.id].status}`}</span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
