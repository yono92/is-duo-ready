import source from '@/data/support-reports.json';
import type { Locale } from './types';

type Localized = Record<Locale, string>;
export type ReportApp = {
  appStoreId: string;
  slug: string;
  kind: 'new' | 'existing';
  name: string;
  supportVersion: string | null;
  quote: string;
  sourceUrl: string;
  observedAt: string;
  summary: Localized;
};
export type SupportReport = {
  date: string;
  record: string;
  totals: {
    published: number;
    supported: number;
    unknown: number;
    previousSupported: number;
    newApps: number;
    versionUpdates: number;
    archived: number;
    renamed: number;
    reconfirmed: number;
    existingSupported: number;
  };
  title: Localized;
  summary: Localized;
  intro: Localized;
  groups: { heading: Localized; body: Localized; apps: string[] }[];
  notCounted: Localized[];
  apps: ReportApp[];
};
// Newest first. Each report is written from one verified refresh record.
export const supportReports = (
  source as { version: number; country: 'KR'; reports: SupportReport[] }
).reports;
export function reportByDate(date: string) {
  return supportReports.find((report) => report.date === date) ?? null;
}
