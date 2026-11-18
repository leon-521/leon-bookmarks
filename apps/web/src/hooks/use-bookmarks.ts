import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockBookmarks, type Bookmark } from '@/lib/mock-data';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useBookmarks(params?: {
  search?: string;
  categoryId?: string;
  tag?: string;
  sort?: string;
}) {
  return useQuery({
    queryKey: ['bookmarks', params],
    queryFn: async () => {
      await delay(500);
      let results = [...mockBookmarks];

      if (params?.search) {
        const q = params.search.toLowerCase();
        results = results.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.description.toLowerCase().includes(q) ||
            b.url.toLowerCase().includes(q)
        );
      }

      if (params?.categoryId) {
        results = results.filter((b) => b.categoryId === params.categoryId);
      }

      if (params?.tag) {
        results = results.filter((b) => b.tags.includes(params.tag!));
      }

      if (params?.sort === 'title') {
        results.sort((a, b) => a.title.localeCompare(b.title));
      } else if (params?.sort === 'newest') {
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (params?.sort === 'oldest') {
        results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } else {
        results.sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1));
      }

      return results;
    },
  });
}

export function useBookmark(id: string) {
  return useQuery({
    queryKey: ['bookmark', id],
    queryFn: async () => {
      await delay(300);
      return mockBookmarks.find((b) => b.id === id) || null;
    },
  });
}

export function useCreateBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => {
      await delay(800);
      const newBookmark: Bookmark = {
        ...data,
        id: Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newBookmark;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}

export function useUpdateBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Bookmark> & { id: string }) => {
      await delay(600);
      const existing = mockBookmarks.find((b) => b.id === id);
      if (!existing) throw new Error('Bookmark not found');
      return { ...existing, ...data, updatedAt: new Date().toISOString() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await delay(500);
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}
