'use client';

import { createContext, useContext, useTransition, type ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { getPathname, useRouter } from '@/i18n/navigation';
import { useDocumentNavigation } from '@/components/ad-navigation';
import { changeQuery, queryString } from '@/lib/directory/query';
import type { DirectoryQuery, Locale } from '@/lib/directory/types';

const NavigationContext = createContext<{
  pending: boolean;
  navigate: (next: DirectoryQuery) => void;
  update: (patch: Partial<DirectoryQuery>) => void;
} | null>(null);

export function DirectoryNavigation({
  query,
  children,
}: {
  query: DirectoryQuery;
  children: ReactNode;
}) {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const documentNavigation = useDocumentNavigation();
  const [pending, startTransition] = useTransition();
  function navigate(next: DirectoryQuery) {
    const qs = queryString(next);
    if (documentNavigation) {
      window.location.assign(
        getPathname({ href: `/${qs ? `?${qs}` : ''}#directory-heading`, locale }),
      );
      return;
    }
    startTransition(() => router.push(`/${qs ? `?${qs}` : ''}`, { scroll: false }));
  }
  return (
    <NavigationContext
      value={{ pending, navigate, update: (patch) => navigate(changeQuery(query, patch)) }}
    >
      {children}
    </NavigationContext>
  );
}

export function useDirectoryNavigation() {
  const navigation = useContext(NavigationContext);
  if (!navigation) throw new Error('Directory navigation requires its provider.');
  return navigation;
}
