import { useQuery } from '@tanstack/react-query';
import { portalService } from '@/lib/services';

export function usePortal(slug: string) {
  return useQuery({
    queryKey: ['portal', slug],
    queryFn: () => portalService.getData(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePortalSearch(slug: string, query: string) {
  return useQuery({
    queryKey: ['portal', slug, 'search', query],
    queryFn: () => portalService.search(slug, query),
    enabled: !!slug && !!query && query.length >= 2,
    staleTime: 1000 * 30,
  });
}
