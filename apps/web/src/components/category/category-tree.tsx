'use client';

import * as React from 'react';
import {
  ChevronRight,
  Code,
  Palette,
  Zap,
  Brain,
  BookOpen,
  Layout,
  Server,
  Cloud,
  Component,
  Sparkles,
  FileText,
  Video,
  FolderPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
type Category = Record<string, any>;

const iconMap: Record<string, React.ElementType> = {
  code: Code,
  palette: Palette,
  zap: Zap,
  brain: Brain,
  'book-open': BookOpen,
  layout: Layout,
  server: Server,
  cloud: Cloud,
  component: Component,
  sparkles: Sparkles,
  'file-text': FileText,
  video: Video,
};

interface CategoryTreeProps {
  categories: Category[];
  selectedId?: string;
  onSelect?: (category: Category) => void;
  onAddCategory?: () => void;
}

function CategoryNode({
  category,
  depth,
  selectedId,
  onSelect,
}: {
  category: Category;
  depth: number;
  selectedId?: string;
  onSelect?: (category: Category) => void;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = category.id === selectedId;
  const Icon = iconMap[category.icon] || Code;

  return (
    <div>
      <button
        onClick={() => {
          onSelect?.(category);
          if (hasChildren) setExpanded((prev) => !prev);
        }}
        className={cn(
          'group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm transition-all duration-150',
          'hover:bg-bg-secondary',
          isSelected && 'bg-accent-muted text-accent font-medium',
          !isSelected && 'text-text-secondary'
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {/* Expand/collapse */}
        <div className="flex h-4 w-4 items-center justify-center shrink-0">
          {hasChildren ? (
            <ChevronRight
              className={cn(
                'h-3.5 w-3.5 text-text-tertiary transition-transform duration-200',
                expanded && 'rotate-90'
              )}
            />
          ) : (
            <div className="h-1 w-1 rounded-full bg-text-tertiary opacity-40" />
          )}
        </div>

        {/* Icon */}
        <Icon
          className={cn(
            'h-4 w-4 shrink-0',
            isSelected ? 'text-accent' : 'text-text-tertiary group-hover:text-text-secondary'
          )}
        />

        {/* Name */}
        <span className="truncate flex-1 text-left">{category.name}</span>

        {/* Count */}
        <Badge
          variant={isSelected ? 'default' : 'secondary'}
          className="text-[10px] px-1.5 py-0 min-w-[20px] justify-center"
        >
          {category.bookmarkCount}
        </Badge>
      </button>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="relative">
          {/* Connecting line */}
          <div
            className="absolute left-0 top-0 bottom-0 w-px bg-border"
            style={{ marginLeft: `${depth * 20 + 18}px` }}
          />
          {category.children!.map((child: Category) => (
            <CategoryNode
              key={child.id}
              category={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTree({
  categories,
  selectedId,
  onSelect,
  onAddCategory,
}: CategoryTreeProps) {
  return (
    <div className="space-y-1">
      {/* All bookmarks option */}
      <button
        onClick={() => onSelect?.({ id: '', name: 'All Bookmarks', icon: 'code', parentId: null, bookmarkCount: 0 })}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm transition-all duration-150',
          'hover:bg-bg-secondary',
          !selectedId && 'bg-accent-muted text-accent font-medium',
          selectedId && 'text-text-secondary'
        )}
      >
        <div className="h-4 w-4" />
        <BookOpen className={cn('h-4 w-4', !selectedId ? 'text-accent' : 'text-text-tertiary')} />
        <span className="flex-1 text-left">All Bookmarks</span>
      </button>

      {/* Category tree */}
      {categories.map((category) => (
        <CategoryNode
          key={category.id}
          category={category}
          depth={0}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}

      {/* Add category button */}
      {onAddCategory && (
        <div className="pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddCategory}
            className="w-full justify-start gap-2 text-text-tertiary"
          >
            <FolderPlus className="h-4 w-4" />
            Add Category
          </Button>
        </div>
      )}
    </div>
  );
}
