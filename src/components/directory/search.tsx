'use client';

import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDirectoryNavigation } from './navigation';
import type { DirectoryQuery } from '@/lib/directory/types';

export function DirectorySearch({ query }: { query: DirectoryQuery }) {
  const t = useTranslations('Directory');
  const { pending, update } = useDirectoryNavigation();

  return (
    <form
      role="search"
      aria-label={t('search')}
      aria-busy={pending}
      className="hero-search-form"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        update({
          q: String(data.get('q') ?? '')
            .normalize('NFC')
            .trim()
            .slice(0, 100),
        });
      }}
    >
      <Input
        key={query.q}
        name="q"
        type="search"
        maxLength={100}
        defaultValue={query.q}
        label={t('search')}
        isLabelHidden
        placeholder={t('searchPlaceholder')}
        startIcon={<Search size={20} aria-hidden="true" />}
        disabled={pending}
        className="min-w-0 flex-1"
      />
      <Button type="submit" disabled={pending}>
        {t('searchButton')}
      </Button>
    </form>
  );
}
