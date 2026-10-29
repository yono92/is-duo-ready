import { queryOptions } from '@tanstack/react-query';
import type { collectionOverview } from './repository';

export type CollectionOverview = Awaited<ReturnType<typeof collectionOverview>>;
export const collectionQueryKey = ['admin', 'collections'] as const;

export class CollectionQueryError extends Error {
  constructor(public status: number) {
    super('Collection overview request failed');
  }
}

export function isCollectionAccessError(error: unknown) {
  return error instanceof CollectionQueryError && (error.status === 401 || error.status === 403);
}

export function collectionQueryOptions() {
  return queryOptions({
    queryKey: collectionQueryKey,
    queryFn: async ({ signal }): Promise<CollectionOverview> => {
      const response = await fetch('/api/admin/collections', {
        signal,
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (!response.ok) throw new CollectionQueryError(response.status);
      return response.json();
    },
    staleTime: 10_000,
    refetchInterval: (query) => (isCollectionAccessError(query.state.error) ? false : 15_000),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: (query) => !isCollectionAccessError(query.state.error),
    refetchOnReconnect: (query) => !isCollectionAccessError(query.state.error),
    retry: (failures, error) => !isCollectionAccessError(error) && failures < 1,
  });
}
