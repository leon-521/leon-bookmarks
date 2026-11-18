import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookmarkService, type BookmarkFilters, type CreateBookmarkData, type UpdateBookmarkData } from '@/lib/services';

export function useBookmarks(filters?: BookmarkFilters) {
  return useQuery({
    queryKey: ['bookmarks', filters],
    queryFn: () => bookmarkService.getAll(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useBookmark(id: string) {
  return useQuery({
    queryKey: ['bookmark', id],
    queryFn: () => bookmarkService.getOne(id),
    enabled: !!id,
  });
}

export function useCreateBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBookmarkData) => bookmarkService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}

export function useUpdateBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateBookmarkData & { id: string }) => bookmarkService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookmarkService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}

export function useBatchDeleteBookmarks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => bookmarkService.batchDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}

export function useBatchMoveBookmarks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, categoryId }: { ids: string[]; categoryId: string | null }) => bookmarkService.batchMove(ids, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}
