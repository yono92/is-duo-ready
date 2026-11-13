import source from '@/data/support-research-2026-11-13.json';
import type { Locale } from './types';

export type ResearchCheck = {
  kind: 'app_store' | 'developer' | 'badge';
  url: string;
  checkedAt: string;
  scope: string;
  outcome: 'explicit_support' | 'limited_statement' | 'no_explicit_statement' | 'access_failed';
  note: Record<Locale, string>;
  quote?: string;
};
export type AppResearch = {
  appStoreId: string;
  slug: string;
  name: string;
  checks: ResearchCheck[];
};
export const supportResearch = source as { version: number; country: 'KR'; apps: AppResearch[] };
export function researchForApp(storeUrl: string) {
  const id = /^https:\/\/apps\.apple\.com\/kr\/app\/(?:[^/]+\/)?id([0-9]+)(?:\?.*)?$/.exec(
    storeUrl,
  )?.[1];
  return supportResearch.apps.find((app) => app.appStoreId === id) ?? null;
}
