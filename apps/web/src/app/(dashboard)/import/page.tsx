'use client';

import * as React from 'react';
import {
  Upload,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileJson,
  FileSpreadsheet,
  Globe,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { importService, type ImportResult } from '@/lib/services';
import { cn } from '@/lib/utils';

export default function ImportPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [fileContent, setFileContent] = React.useState<string>('');
  const [fileType, setFileType] = React.useState<'html' | 'json'>('html');
  const [isDragging, setIsDragging] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [exportingFormat, setExportingFormat] = React.useState<'html' | 'json' | 'csv' | null>(null);
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [createCategories, setCreateCategories] = React.useState(true);
  const [skipDuplicates, setSkipDuplicates] = React.useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setError(null);

    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext === 'json') setFileType('json');
    else setFileType('html');

    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent(e.target?.result as string);
    };
    reader.readAsText(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleImport = async () => {
    if (!fileContent) return;
    setIsImporting(true);
    setError(null);
    setResult(null);

    try {
      const res =
        fileType === 'json'
          ? await importService.importJson(fileContent)
          : await importService.importHtml({
              content: fileContent,
              createCategories,
              skipDuplicates,
            });
      setResult(res);
    } catch (err: any) {
      setError(err?.message || '导入失败，请检查文件格式是否正确。');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async (format: 'html' | 'json' | 'csv') => {
    setExportingFormat(format);
    setError(null);
    try {
      const res = await importService.exportBookmarks(format);
      const mimeMap: Record<'html' | 'json' | 'csv', string> = {
        html: 'text/html;charset=utf-8',
        json: 'application/json;charset=utf-8',
        csv: 'text/csv;charset=utf-8',
      };
      const blob = new Blob([res.content], { type: mimeMap[format] });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename || `bookmarks-export.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || '导出书签失败，请稍后重试。');
    } finally {
      setExportingFormat(null);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileContent('');
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="书签导入与导出"
        description="从 Chrome、Edge、Firefox 或 JSON 迁移书签，或将当前工作区书签一键导出备份。"
      />

      {/* File Upload Zone */}
      <div
        className={cn(
          'relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 cursor-pointer',
          isDragging
            ? 'border-accent bg-accent/5 scale-[1.01]'
            : file
            ? 'border-success/50 bg-success/5'
            : 'border-border hover:border-accent/50 hover:bg-bg-secondary'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".html,.htm,.json"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        />

        {file ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10">
              <FileText className="h-7 w-7 text-success" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">{file.name}</p>
              <p className="text-sm text-text-secondary mt-1">
                {(file.size / 1024).toFixed(1)} KB · {fileType.toUpperCase()} 格式
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              className="flex items-center gap-1 text-xs text-text-tertiary hover:text-danger transition-colors"
            >
              <X className="h-3 w-3" /> 移除文件
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
              <Upload className="h-7 w-7 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">拖拽书签文件到此处上传</p>
              <p className="text-sm text-text-secondary mt-1">
                或点击选择本地文件 · 支持 <Badge variant="secondary" className="text-[10px]">HTML</Badge>{' '}
                <Badge variant="secondary" className="text-[10px]">JSON</Badge>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Options */}
      {file && fileType === 'html' && (
        <div className="mt-6 rounded-xl border border-border bg-bg-primary p-5 space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">导入选项</h3>
          <label className="flex items-center gap-3 text-sm text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={createCategories}
              onChange={(e) => setCreateCategories(e.target.checked)}
              className="rounded border-border"
            />
            自动根据原书签文件夹结构创建分类目录
          </label>
          <label className="flex items-center gap-3 text-sm text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={skipDuplicates}
              onChange={(e) => setSkipDuplicates(e.target.checked)}
              className="rounded border-border"
            />
            自动跳过已存在的重复网址
          </label>
        </div>
      )}

      {/* Import Button */}
      {file && !result && (
        <div className="mt-6 flex justify-end">
          <Button onClick={handleImport} loading={isImporting} size="lg" className="gap-2 min-w-[160px]">
            <Upload className="h-4 w-4" />
            {isImporting ? '正在导入...' : '开始导入'}
          </Button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-xl border border-danger/30 bg-danger-light p-5">
          <div className="flex items-center gap-2 text-danger">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">操作失败</p>
          </div>
          <p className="mt-2 text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6 rounded-xl border border-success/30 bg-success/5 p-6">
          <div className="flex items-center gap-2 text-success mb-4">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-semibold">导入完成！</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-bg-primary p-4 text-center border border-border">
              <div className="text-2xl font-bold text-text-primary">{result.importedBookmarks}</div>
              <div className="text-xs text-text-secondary mt-1">成功导入书签</div>
            </div>
            <div className="rounded-lg bg-bg-primary p-4 text-center border border-border">
              <div className="text-2xl font-bold text-text-primary">{result.importedCategories}</div>
              <div className="text-xs text-text-secondary mt-1">新建分类目录</div>
            </div>
            <div className="rounded-lg bg-bg-primary p-4 text-center border border-border">
              <div className="text-2xl font-bold text-text-primary">{result.skippedDuplicates}</div>
              <div className="text-xs text-text-secondary mt-1">跳过重复网址</div>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-4 text-sm">
              <p className="font-medium text-warning mb-1">提示 ({result.errors.length}):</p>
              <ul className="space-y-1 text-text-secondary">
                {result.errors.slice(0, 5).map((err, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <AlertCircle className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4 flex gap-3">
            <Button variant="outline" onClick={handleReset} size="sm">
              继续导入
            </Button>
            <Button variant="outline" size="sm" onClick={() => (window.location.href = '/bookmarks')}>
              前往查看书签
            </Button>
          </div>
        </div>
      )}

      {/* Export Bookmarks Section */}
      <div className="mt-8 rounded-xl border border-border bg-bg-primary p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <Download className="h-4 w-4 text-accent" />
            导出与备份当前工作区书签
          </h3>
          <Badge variant="secondary">零锁定迁移</Badge>
        </div>
        <p className="text-sm text-text-secondary mb-4">
          支持导出标准浏览器书签文件或结构化数据，方便随时备份或导入其他工具。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-medium text-sm text-text-primary">
                <Globe className="h-4 w-4 text-accent" />
                Netscape HTML
              </div>
              <p className="text-xs text-text-tertiary mt-1">
                兼容 Chrome、Edge、Firefox、Safari 直接导入恢复目录
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('html')}
              loading={exportingFormat === 'html'}
              disabled={exportingFormat !== null}
              className="w-full gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              导出 .html
            </Button>
          </div>

          <div className="rounded-xl border border-border p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-medium text-sm text-text-primary">
                <FileJson className="h-4 w-4 text-emerald-500" />
                JSON 完整数据包
              </div>
              <p className="text-xs text-text-tertiary mt-1">
                包含标签、分类、描述与置顶状态等完整元数据
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('json')}
              loading={exportingFormat === 'json'}
              disabled={exportingFormat !== null}
              className="w-full gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              导出 .json
            </Button>
          </div>

          <div className="rounded-xl border border-border p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-medium text-sm text-text-primary">
                <FileSpreadsheet className="h-4 w-4 text-amber-500" />
                CSV 表格文件
              </div>
              <p className="text-xs text-text-tertiary mt-1">
                适合导入 Notion、飞书多维表格、Excel 进行归档分析
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              loading={exportingFormat === 'csv'}
              disabled={exportingFormat !== null}
              className="w-full gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              导出 .csv
            </Button>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 rounded-xl border border-border bg-bg-primary p-5">
        <h3 className="font-semibold text-text-primary mb-3">如何从浏览器导出书签文件？</h3>
        <div className="space-y-3 text-sm text-text-secondary">
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-text-primary">Chrome / Edge</p>
              <p>打开书签管理器 (Ctrl+Shift+O) → 右上角 ⋮ → 导出书签 → 保存为 HTML 文件</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-text-primary">Firefox</p>
              <p>我的足迹 (Library) → 导入和备份 → 导出书签到 HTML</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FileJson className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-text-primary">JSON 格式</p>
              <p>支持包含 url、title、description、tags 字段的数组结构</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
