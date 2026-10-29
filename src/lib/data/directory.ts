import 'server-only';
import { fixturesAllowed } from './policy';
import { cache } from 'react';
import { database, databaseConfigured } from '@/lib/db/server';
import { queryDirectory, queryApp, queryHistory } from './postgres-query.ts';
import { selectApps } from '../directory/query';
import type {
  DirectoryApp,
  DirectoryQuery,
  DirectoryResult,
  Locale,
  PublicHistory,
} from '../directory/types';

export function dataSource() {
  const source = process.env.DIRECTORY_DATA_SOURCE;
  if (source === 'postgres') return databaseConfigured() ? 'postgres' : 'unavailable';
  if (source && source !== 'fixtures') throw new Error('Invalid directory data source.');
  return fixturesAllowed(process.env) ? 'fixtures' : 'unavailable';
}

export async function getDirectoryPage(
  query: DirectoryQuery,
  locale: Locale,
): Promise<
  { kind: 'available'; fictional: boolean; result: DirectoryResult } | { kind: 'unavailable' }
> {
  const source = dataSource();
  if (source === 'unavailable') return { kind: 'unavailable' };
  if (source === 'fixtures') {
    const { fixtureApps } = await import('./fixtures');
    return { kind: 'available', fictional: true, result: selectApps(fixtureApps, query, locale) };
  }
  return {
    kind: 'available',
    fictional: false,
    result: await database(null, (db) => queryDirectory(db, query, locale)),
  };
}

export const getPublishedApp = cache(
  async (
    slug: string,
  ): Promise<{ id?: string; app: DirectoryApp } | { redirect: string } | null> => {
    const source = dataSource();
    if (source === 'unavailable') return null;
    if (source === 'fixtures') {
      const { fixtureApps } = await import('./fixtures');
      const app = fixtureApps.find(
        (item) => item.slug === slug && item.publication === 'published',
      );
      return app ? { app } : null;
    }
    return database(null, (db) => queryApp(db, slug));
  },
);

export async function getPublicHistory(
  page = 1,
  appId: string | null = null,
): Promise<{ items: PublicHistory[]; total: number; page: number; pages: number }> {
  if (dataSource() !== 'postgres') return { items: [], total: 0, page: 1, pages: 1 };
  return database(null, (db) => queryHistory(db, page, appId));
}
