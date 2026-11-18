'use client';

import * as React from 'react';
import { BookmarkCard } from './bookmark-card';

interface BookmarkGridProps {
  bookmarks: any[];
  onEdit?: (bookmark: any) => void;
  onDelete?: (bookmark: any) => void;
  onPin?: (bookmark: any) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

export function BookmarkGrid({ bookmarks, onEdit, onDelete, onPin, onReorder }: BookmarkGridProps) {
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 rounded-full bg-bg-tertiary p-4">
          <svg className="h-8 w-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-text-primary">No bookmarks found</h3>
        <p className="mt-1 text-sm text-text-secondary max-w-sm">
          Try adjusting your search or filters, or add your first bookmark to get started.
        </p>
      </div>
    );
  }

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  const handleDrop = (toIndex: number) => {
    if (dragIndex !== null && dragIndex !== toIndex && onReorder) {
      onReorder(dragIndex, toIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };
  const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null); };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {bookmarks.map((bookmark, index) => (
        <div
          key={bookmark.id}
          className={`animate-fade-up transition-all duration-200 ${
            dragOverIndex === index ? 'ring-2 ring-accent/50 rounded-xl scale-[0.98]' : ''
          } ${dragIndex === index ? 'opacity-40' : ''}`}
          style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
          draggable={!!onReorder}
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={() => handleDrop(index)}
          onDragEnd={handleDragEnd}
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
