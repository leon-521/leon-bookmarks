'use client';

import * as React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BookmarkCard } from './bookmark-card';
type Bookmark = Record<string, any>;

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onEdit?: (bookmark: Bookmark) => void;
  onDelete?: (bookmark: Bookmark) => void;
  onPin?: (bookmark: Bookmark) => void;
  onSort?: (column: string) => void;
  sortColumn?: string;
}

export function BookmarkList({
  bookmarks,
  onEdit,
  onDelete,
  onPin,
  onSort,
  sortColumn,
}: BookmarkListProps) {
  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 rounded-full bg-bg-tertiary p-4">
          <svg
            className="h-8 w-8 text-text-tertiary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-text-primary">No bookmarks found</h3>
        <p className="mt-1 text-sm text-text-secondary max-w-sm">
          Try adjusting your search or filters, or add your first bookmark to get started.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header row */}
      <div className="hidden sm:flex items-center gap-4 px-4 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">
        <div className="w-8" />
        <button
          className={cn(
            'flex items-center gap-1 flex-1 hover:text-text-secondary transition-colors',
            sortColumn === 'title' && 'text-text-secondary'
          )}
          onClick={() => onSort?.('title')}
        >
          Title
          <ArrowUpDown className="h-3 w-3" />
        </button>
        <div className="w-24">Category</div>
        <div className="w-20 hidden md:block">Status</div>
        <div className="w-8" />
      </div>

      {/* Bookmark rows */}
      <div className="space-y-2">
        {bookmarks.map((bookmark, index) => (
          <div
            key={bookmark.id}
            className="animate-fade-up"
            style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'backwards' }}
          >
            <BookmarkCard
              bookmark={bookmark}
              variant="list"
              onEdit={onEdit}
              onDelete={onDelete}
              onPin={onPin}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
