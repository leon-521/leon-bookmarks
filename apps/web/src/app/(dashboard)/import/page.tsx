'use client';

import * as React from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, FileJson, Globe, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ImportResult {
  importedBookmarks: number;
  importedCategories: number;
  skippedDuplicates: number;
  errors: string[];
}

export default function ImportPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [fileContent, setFileContent] = React.useState<string>('');
  const [fileType, setFileType] = React.useState<'html' | 'json'>('html');
  const [isDragging, setIsDragging] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
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
      const endpoint = fileType === 'json' ? '/import/json' : '/import/html';
      const body = fileType === 'json'
        ? { content: fileContent }
        : { content: fileContent, createCategories, skipDuplicates };
      
      const res = await api.post<ImportResult>(endpoint, body);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Import failed. Please check your file format.');
    } finally {
      setIsImporting(false);
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
        title="Import Bookmarks"
        description="Import your bookmarks from Chrome, Firefox, or a JSON file."
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
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
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
                {(file.size / 1024).toFixed(1)} KB · {fileType.toUpperCase()} format
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleReset(); }}
              className="flex items-center gap-1 text-xs text-text-tertiary hover:text-danger transition-colors"
            >
              <X className="h-3 w-3" /> Remove file
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
              <Upload className="h-7 w-7 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">Drop your bookmark file here</p>
              <p className="text-sm text-text-secondary mt-1">
                or click to browse · Supports <Badge variant="secondary" className="text-[10px]">HTML</Badge>{' '}
                <Badge variant="secondary" className="text-[10px]">JSON</Badge>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Options */}
      {file && fileType === 'html' && (
        <div className="mt-6 rounded-xl border border-border bg-bg-primary p-5 space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">Import Options</h3>
          <label className="flex items-center gap-3 text-sm text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={createCategories}
              onChange={(e) => setCreateCategories(e.target.checked)}
              className="rounded border-border"
            />
            Create categories from bookmark folders
          </label>
          <label className="flex items-center gap-3 text-sm text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={skipDuplicates}
              onChange={(e) => setSkipDuplicates(e.target.checked)}
              className="rounded border-border"
            />
            Skip duplicate URLs
          </label>
        </div>
      )}

      {/* Import Button */}
      {file && !result && (
        <div className="mt-6 flex justify-end">
          <Button onClick={handleImport} loading={isImporting} size="lg" className="gap-2 min-w-[160px]">
            <Upload className="h-4 w-4" />
            {isImporting ? 'Importing...' : 'Start Import'}
          </Button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">Import Failed</p>
          </div>
          <p className="mt-2 text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6 rounded-xl border border-success/30 bg-success/5 p-6">
          <div className="flex items-center gap-2 text-success mb-4">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-semibold">Import Complete!</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-white/60 p-4 text-center">
              <div className="text-2xl font-bold text-text-primary">{result.importedBookmarks}</div>
              <div className="text-xs text-text-secondary mt-1">Bookmarks imported</div>
            </div>
            <div className="rounded-lg bg-white/60 p-4 text-center">
              <div className="text-2xl font-bold text-text-primary">{result.importedCategories}</div>
              <div className="text-xs text-text-secondary mt-1">Categories created</div>
            </div>
            <div className="rounded-lg bg-white/60 p-4 text-center">
              <div className="text-2xl font-bold text-text-primary">{result.skippedDuplicates}</div>
              <div className="text-xs text-text-secondary mt-1">Duplicates skipped</div>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-4 text-sm">
              <p className="font-medium text-warning mb-1">Warnings ({result.errors.length}):</p>
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
            <Button variant="outline" onClick={handleReset} size="sm">Import More</Button>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/bookmarks'}>View Bookmarks</Button>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-8 rounded-xl border border-border bg-bg-primary p-5">
        <h3 className="font-semibold text-text-primary mb-3">How to export bookmarks</h3>
        <div className="space-y-3 text-sm text-text-secondary">
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-text-primary">Chrome / Edge</p>
              <p>Bookmark Manager → ⋮ → Export bookmarks → Save as HTML file</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-text-primary">Firefox</p>
              <p>Library → Import and Backup → Export Bookmarks to HTML</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FileJson className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-text-primary">JSON Format</p>
              <p>Array of objects with url, title, description, and tags fields</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
