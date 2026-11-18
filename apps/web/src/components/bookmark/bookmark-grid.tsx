'use client';

import * as React from 'react';
import { BookmarkCard } from './bookmark-card';
import type { Bookmark } from '@/lib/mock-data';

interface BookmarkGridProps {
  bookmarks: Bookmark[];
  onEdit?: (bookmark: Bookmark) => void;
  onDelete?: (bookmark: Bookmark) => void;
  onPin?: (bookmark: Bookmark) => void;
}

export function BookmarkGrid({ bookmarks, onEdit, onDelete, onPin }: BookmarkGridProps) {
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {bookmarks.map((bookmark, index) => (
        <div
          key={bookmark.id}
          className="animate-fade-up"
          style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
        >
          <BookmarkCard
            bookmark={bookmark}
            variant="card"
            onEdit={onEdit}
            onDelete={onDelete}
            onPin={onPin}
          />
        </div>
      ))}
    </div>
  );
}
