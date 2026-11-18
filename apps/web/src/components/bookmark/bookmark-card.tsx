'use client';

import * as React from 'react';
import {
  MoreHorizontal,
  Pin,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { cn, getDomainFromUrl } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string | null;
  favicon?: string;
  faviconUrl?: string | null;
  categoryId?: string | null;
  categoryName?: string;
  category?: { id: string; name: string } | null;
  tags: string[];
  isPinned: boolean;
  status?: string;
  clickCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface BookmarkCardProps {
  bookmark: Bookmark;
  variant?: 'card' | 'list';
  onEdit?: (bookmark: Bookmark) => void;
  onDelete?: (bookmark: Bookmark) => void;
  onPin?: (bookmark: Bookmark) => void;
}

export function BookmarkCard({
  bookmark,
  variant = 'card',
  onEdit,
  onDelete,
  onPin,
}: BookmarkCardProps) {
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(bookmark.url);
  };

  if (variant === 'list') {
    return (
      <div className="group flex items-center gap-4 rounded-lg border border-border bg-bg-primary px-4 py-3 transition-all duration-200 hover:border-border-hover hover:shadow-sm">
        {/* Favicon */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-bg-secondary">
          {bookmark.faviconUrl || bookmark.favicon ? (
            <img
              src={bookmark.faviconUrl || bookmark.favicon}
              alt=""
              className="h-5 w-5 rounded-sm object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <Globe className={cn('h-4 w-4 text-text-tertiary', bookmark.faviconUrl || bookmark.favicon && 'hidden')} />
        </div>

        {/* Title & URL */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {bookmark.isPinned && (
              <Pin className="h-3 w-3 shrink-0 text-accent fill-accent" />
            )}
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-sm font-medium text-text-primary hover:text-accent transition-colors"
            >
              {bookmark.title}
            </a>
          </div>
          <p className="truncate text-xs text-text-tertiary mt-0.5">
            {getDomainFromUrl(bookmark.url)}
          </p>
        </div>

        {/* Category */}
        <Badge variant="secondary" className="hidden sm:inline-flex shrink-0">
          {bookmark.categoryName}
        </Badge>

        {/* Status */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              bookmark.status === 'active' ? 'bg-success' : 'bg-danger'
            )}
          />
          <span className="text-xs text-text-tertiary capitalize">{bookmark.status}</span>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-md p-1 text-text-tertiary opacity-0 transition-all group-hover:opacity-100 hover:bg-bg-secondary hover:text-text-primary">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem icon={<ExternalLink className="h-4 w-4" />}>
              <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                Open
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem icon={<Copy className="h-4 w-4" />} onClick={handleCopyUrl}>
              Copy URL
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={<Pin className="h-4 w-4" />}
              onClick={() => onPin?.(bookmark)}
            >
              {bookmark.isPinned ? 'Unpin' : 'Pin'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              icon={<Pencil className="h-4 w-4" />}
              onClick={() => onEdit?.(bookmark)}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => onDelete?.(bookmark)}
              className="text-danger focus:text-danger"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="interactive-card group relative flex flex-col rounded-xl border border-border bg-bg-primary overflow-hidden">
      {/* Accent border on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />

      <div className="flex flex-1 flex-col p-4">
        {/* Header: Favicon + Menu */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-secondary shadow-xs">
              {bookmark.faviconUrl || bookmark.favicon ? (
                <img
                  src={bookmark.faviconUrl || bookmark.favicon}
                  alt=""
                  className="h-6 w-6 rounded-sm object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <Globe className={cn('h-5 w-5 text-text-tertiary', bookmark.faviconUrl || bookmark.favicon && 'hidden')} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                {bookmark.isPinned && (
                  <Pin className="h-3 w-3 shrink-0 text-accent fill-accent" />
                )}
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-sm font-semibold text-text-primary hover:text-accent transition-colors"
                >
                  {bookmark.title}
                </a>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full shrink-0',
                    bookmark.status === 'active' ? 'bg-success' : 'bg-danger'
                  )}
                />
                <span className="truncate text-xs text-text-tertiary">
                  {getDomainFromUrl(bookmark.url)}
                </span>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-md p-1 text-text-tertiary opacity-0 transition-all group-hover:opacity-100 hover:bg-bg-secondary hover:text-text-primary">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem icon={<ExternalLink className="h-4 w-4" />}>
                <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                  Open
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem icon={<Copy className="h-4 w-4" />} onClick={handleCopyUrl}>
                Copy URL
              </DropdownMenuItem>
              <DropdownMenuItem
                icon={<Pin className="h-4 w-4" />}
                onClick={() => onPin?.(bookmark)}
              >
                {bookmark.isPinned ? 'Unpin' : 'Pin'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                icon={<Pencil className="h-4 w-4" />}
                onClick={() => onEdit?.(bookmark)}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                icon={<Trash2 className="h-4 w-4" />}
                onClick={() => onDelete?.(bookmark)}
                className="text-danger focus:text-danger"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        <p className="line-clamp-2 text-sm text-text-secondary leading-relaxed mb-3">
          {bookmark.description}
        </p>

        {/* Tags */}
        <div className="mt-auto flex flex-wrap gap-1.5">
          {bookmark.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[11px] px-2 py-0">
              {tag}
            </Badge>
          ))}
          {bookmark.tags.length > 3 && (
            <Badge variant="secondary" className="text-[11px] px-2 py-0">
              +{bookmark.tags.length - 3}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
