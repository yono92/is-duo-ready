export const locales = ['ko', 'en'] as const;
export type Locale = (typeof locales)[number];
// App Store category names; this is the subset represented in the local directory.
// Slugs are our URL identifiers, not Apple category IDs. See docs/references/app-store-categories.md.
export const categories = [
  'productivity',
  'graphics-design',
  'music',
  'books',
  'travel',
  'navigation',
  'photo-video',
  'entertainment',
  'lifestyle',
  'reference',
  'sports',
  'utilities',
  'games',
  'food-drink',
  'shopping',
  'finance',
  'education',
  'business',
  'health-fitness',
  'weather',
  'news',
  'social-networking',
] as const;
export type Category = (typeof categories)[number];
export const statuses = ['supported', 'planned', 'unknown', 'unsupported'] as const;
export type SupportStatus = (typeof statuses)[number];
type DirectoryBase = {
  slug: string;
  publication: 'published' | 'draft';
  country: 'KR';
  names: Record<Locale, string>;
  aliases: string[];
  developer: string;
  category: Category;
  status: SupportStatus;
  icon: string;
  originalLocale: Locale;
  translations: Partial<Record<Locale, { summary: string; state: 'current' | 'needs-review' }>>;
  reviewedAt: string | null;
  supportChangedAt: string | null;
};
export type Evidence = {
  id: string;
  url: string;
  title: string;
  kind: 'app_store' | 'developer' | 'apple';
  quote: string;
  announcedAt: string | null;
  supportVersion: string | null;
  country: 'KR';
};
export type RealDirectoryApp = DirectoryBase & {
  fictional: false;
  iconUrl?: string | null;
  evidence: Evidence[];
  features: { key: string; description: string; evidenceId: string }[];
  storeUrl: string;
  currentVersion: string | null;
  supportVersion: string | null;
  investigationReason: string | null;
  previousSlugs: string[];
};
export type DirectoryApp =
  (DirectoryBase & { fictional: true; evidence: readonly [] }) | RealDirectoryApp;
export type DirectoryResult = { apps: DirectoryApp[]; total: number; page: number; pages: number };
export type PublicHistory = {
  id: string;
  slug: string;
  names: Record<Locale, string>;
  beforeStatus: SupportStatus | null;
  afterStatus: SupportStatus;
  reason: string;
  changedAt: string;
};
export type DirectoryQuery = {
  q: string;
  category: Category | 'all';
  status: SupportStatus | 'all';
  sort: 'recommended' | 'updated' | 'name';
  page: number;
};
export const STORE_COUNTRY = 'KR' as const;
