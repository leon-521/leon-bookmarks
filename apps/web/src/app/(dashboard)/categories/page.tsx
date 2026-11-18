'use client';

import * as React from 'react';
import { GripVertical, ChevronRight, ChevronDown, FolderTree, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookmarkGrid } from '@/components/bookmark/bookmark-grid';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
  children?: Category[];
  _count?: { bookmarks: number };
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  const [bookmarks, setBookmarks] = React.useState<any[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  // Create / Edit state
  const [isCreating, setIsCreating] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const [createParentId, setCreateParentId] = React.useState<string | null>(null);

  // Drag state
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);

  // Fetch categories
  const fetchCategories = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<any>('/categories/tree');
      const data = res.data || res;
      setCategories(Array.isArray(data) ? data : []);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  React.useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // Fetch bookmarks for selected category
  const fetchCategoryBookmarks = React.useCallback(async (catId: string) => {
    setBookmarksLoading(true);
    try {
      const res = await api.get<any>('/bookmarks', { params: { categoryId: catId, limit: '50' } });
      const data = res.data || res;
      setBookmarks(Array.isArray(data) ? data : data?.data || []);
    } catch {
      setBookmarks([]);
    } finally {
      setBookmarksLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!selectedId) { setBookmarks([]); return; }
    fetchCategoryBookmarks(selectedId);
  }, [selectedId, fetchCategoryBookmarks]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Create category
  const handleCreate = async () => {
    if (!newName.trim()) return;
    setActionError(null);
    try {
      await api.post('/categories', { name: newName.trim(), parentId: createParentId || undefined });
      setNewName('');
      setIsCreating(false);
      setCreateParentId(null);
      fetchCategories();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to create category');
    }
  };

  // Update category name
  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;
    setActionError(null);
    try {
      await api.patch(`/categories/${id}`, { name: editingName.trim() });
      setEditingId(null);
      fetchCategories();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to rename category');
    }
  };

  // Delete category
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Bookmarks will be uncategorized.')) return;
    setActionError(null);
    try {
      await api.delete(`/categories/${id}`);
      if (selectedId === id) setSelectedId(null);
      fetchCategories();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to delete category');
    }
  };

  const handleBookmarkPin = async (bookmark: any) => {
    try {
      await api.patch(`/bookmarks/${bookmark.id}`, { isPinned: !bookmark.isPinned });
      if (selectedId) fetchCategoryBookmarks(selectedId);
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update bookmark');
    }
  };

  const handleBookmarkDelete = async (bookmark: any) => {
    if (!confirm(`Delete bookmark "${bookmark.title}"?`)) return;
    try {
      await api.delete(`/bookmarks/${bookmark.id}`);
      if (selectedId) fetchCategoryBookmarks(selectedId);
      fetchCategories();
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    } catch (err: any) {
      setActionError(err?.message || 'Failed to delete bookmark');
    }
  };

  // Drag and drop reorder
  const handleDragStart = (id: string) => setDragId(id);
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };
  const handleDrop = async (targetId: string) => {
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return; }
    const flatIds = flattenCategoryIds(categories);
    const fromIdx = flatIds.indexOf(dragId);
    const toIdx = flatIds.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    flatIds.splice(fromIdx, 1);
    flatIds.splice(toIdx, 0, dragId);
    setDragId(null);
    setDragOverId(null);
    try {
      await api.post('/categories/reorder', { orderedIds: flatIds });
      fetchCategories();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to reorder categories');
    }
  };

  const flattenCategoryIds = (cats: Category[]): string[] => {
    const ids: string[] = [];
    for (const cat of cats) {
      ids.push(cat.id);
      if (cat.children) ids.push(...flattenCategoryIds(cat.children));
    }
    return ids;
  };

  const selectedCategory = findCategory(categories, selectedId);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Categories" description="Organize your bookmarks with categories and subcategories.">
        <Button onClick={() => { setActionError(null); setIsCreating(true); setCreateParentId(null); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </PageHeader>

      {actionError && (
        <div className="mb-4 rounded-lg border border-danger/20 bg-danger-light px-4 py-3 text-sm text-danger">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Tree */}
        <div className="lg:col-span-4 rounded-xl border border-border bg-bg-primary shadow-xs">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-text-primary">Category Tree</h3>
          </div>
          <div className="p-2 max-h-[600px] overflow-y-auto">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-sm text-text-tertiary">
                <FolderTree className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No categories yet
              </div>
            ) : (
              categories.map((cat) => (
                <CategoryNode
                  key={cat.id}
                  category={cat}
                  depth={0}
                  selectedId={selectedId}
                  expandedIds={expandedIds}
                  editingId={editingId}
                  editingName={editingName}
                  dragOverId={dragOverId}
                  onSelect={setSelectedId}
                  onToggle={toggleExpand}
                  onEdit={(id, name) => { setEditingId(id); setEditingName(name); }}
                  onEditSave={handleUpdate}
                  onEditCancel={() => setEditingId(null)}
                  onEditNameChange={setEditingName}
                  onDelete={handleDelete}
                  onAddChild={(parentId) => { setIsCreating(true); setCreateParentId(parentId); }}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              ))
            )}

            {/* Inline create */}
            {isCreating && (
              <div className="flex items-center gap-2 px-3 py-2 mt-1">
                <FolderTree className="h-4 w-4 text-accent shrink-0" />
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setIsCreating(false); setNewName(''); } }}
                  placeholder={createParentId ? 'Subcategory name...' : 'Category name...'}
                  className="flex-1 h-7 rounded-md border border-border bg-bg-secondary px-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button onClick={handleCreate} className="text-success hover:text-success/80"><Check className="h-4 w-4" /></button>
                <button onClick={() => { setIsCreating(false); setNewName(''); }} className="text-text-tertiary hover:text-danger"><X className="h-4 w-4" /></button>
              </div>
            )}
          </div>
        </div>

        {/* Bookmarks for selected category */}
        <div className="lg:col-span-8">
          {selectedId && selectedCategory ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-display font-semibold text-text-primary">{selectedCategory.name}</h2>
                  <p className="text-sm text-text-secondary">{bookmarks.length} bookmarks</p>
                </div>
              </div>
              {bookmarksLoading ? (
                <div className="flex justify-center py-16">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </div>
              ) : (
                <BookmarkGrid
                  bookmarks={bookmarks}
                  onPin={handleBookmarkPin}
                  onDelete={handleBookmarkDelete}
                />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-border">
              <FolderTree className="h-12 w-12 text-text-tertiary/30 mb-3" />
              <h3 className="text-lg font-semibold text-text-primary mb-1">Select a category</h3>
              <p className="text-sm text-text-secondary">Click on a category to view its bookmarks</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryNode({
  category, depth, selectedId, expandedIds, editingId, editingName, dragOverId,
  onSelect, onToggle, onEdit, onEditSave, onEditCancel, onEditNameChange, onDelete, onAddChild,
  onDragStart, onDragOver, onDrop,
}: {
  category: Category; depth: number; selectedId: string | null;
  expandedIds: Set<string>; editingId: string | null; editingName: string;
  dragOverId: string | null;
  onSelect: (id: string) => void; onToggle: (id: string) => void;
  onEdit: (id: string, name: string) => void; onEditSave: (id: string) => void;
  onEditCancel: () => void; onEditNameChange: (name: string) => void;
  onDelete: (id: string) => void; onAddChild: (parentId: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (id: string) => void;
}) {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedIds.has(category.id);
  const isSelected = selectedId === category.id;
  const isEditing = editingId === category.id;
  const isDragOver = dragOverId === category.id;
  const count = category._count?.bookmarks ?? 0;

  return (
    <div>
      <div
        draggable
        onDragStart={() => onDragStart(category.id)}
        onDragOver={(e) => onDragOver(e, category.id)}
        onDrop={() => onDrop(category.id)}
        onDragEnd={() => {}}
        className={cn(
          'group flex items-center gap-1.5 rounded-lg px-2 py-1.5 cursor-pointer transition-all text-sm',
          isSelected ? 'bg-accent/10 text-accent' : 'hover:bg-bg-secondary text-text-primary',
          isDragOver && 'ring-2 ring-accent/50 bg-accent/5',
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(category.id)}
      >
        {/* Drag handle */}
        <GripVertical className="h-3.5 w-3.5 text-text-tertiary/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab shrink-0" />

        {/* Expand toggle */}
        {hasChildren ? (
          <button onClick={(e) => { e.stopPropagation(); onToggle(category.id); }} className="shrink-0 p-0.5">
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-[18px]" />
        )}

        {/* Icon + Name */}
        <FolderTree className="h-3.5 w-3.5 shrink-0" />
        {isEditing ? (
          <input
            autoFocus
            value={editingName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onEditSave(category.id); if (e.key === 'Escape') onEditCancel(); }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 h-6 rounded border border-accent bg-bg-primary px-1.5 text-xs focus:outline-none"
          />
        ) : (
          <span className="flex-1 truncate text-[13px] font-medium">{category.name}</span>
        )}

        {/* Count */}
        {count > 0 && !isEditing && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{count}</Badge>
        )}

        {/* Actions */}
        {!isEditing && (
          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
            <button onClick={(e) => { e.stopPropagation(); onAddChild(category.id); }} className="p-0.5 text-text-tertiary hover:text-accent" title="Add subcategory">
              <Plus className="h-3 w-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onEdit(category.id, category.name); }} className="p-0.5 text-text-tertiary hover:text-accent" title="Rename">
              <Edit2 className="h-3 w-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(category.id); }} className="p-0.5 text-text-tertiary hover:text-danger" title="Delete">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}

        {isEditing && (
          <div className="flex items-center gap-0.5">
            <button onClick={(e) => { e.stopPropagation(); onEditSave(category.id); }} className="text-success"><Check className="h-3.5 w-3.5" /></button>
            <button onClick={(e) => { e.stopPropagation(); onEditCancel(); }} className="text-text-tertiary"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {category.children!.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              editingId={editingId}
              editingName={editingName}
              dragOverId={dragOverId}
              onSelect={onSelect}
              onToggle={onToggle}
              onEdit={onEdit}
              onEditSave={onEditSave}
              onEditCancel={onEditCancel}
              onEditNameChange={onEditNameChange}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function findCategory(categories: Category[], id: string | null): Category | null {
  if (!id) return null;
  for (const cat of categories) {
    if (cat.id === id) return cat;
    if (cat.children) {
      const found = findCategory(cat.children, id);
      if (found) return found;
    }
  }
  return null;
}
