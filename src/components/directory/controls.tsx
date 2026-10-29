'use client';
import { Select } from '@/components/ui/form-controls';

import { useId, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Link } from '@/components/ui/link';
import { useRouter } from '@/i18n/navigation';
import { categories, statuses, type DirectoryQuery } from '@/lib/directory/types';
import { changeQuery, defaultQuery, queryString } from '@/lib/directory/query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SideNavItem, Pagination } from '@/components/ui/surfaces';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';

export function DirectoryControls({
  query,
  total,
  pages,
  fictional = true,
  children,
}: {
  query: DirectoryQuery;
  total: number;
  pages: number;
  fictional?: boolean;
  children: React.ReactNode;
}) {
  const n = useTranslations('Nav');
  const t = useTranslations('Directory');
  const c = useTranslations('Categories');
  const s = useTranslations('Status');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const descriptionId = useId();
  const [open, setOpen] = useState(false);
  const active = Number(query.category !== 'all') + Number(query.status !== 'all');
  const modified = active > 0 || !!query.q || query.sort !== 'recommended';
  function navigate(next: DirectoryQuery) {
    const qs = queryString(next);
    startTransition(() => router.push(`/${qs ? `?${qs}` : ''}`, { scroll: false }));
  }
  function update(patch: Partial<DirectoryQuery>) {
    navigate(changeQuery(query, patch));
  }
  const categoryList = (
    <fieldset disabled={pending} className="space-y-1">
      <legend className="mb-3 text-xs font-medium text-muted-foreground">{t('categories')}</legend>
      {(['all', ...categories] as const).map((category) => {
        return (
          <SideNavItem
            key={category}
            label={category === 'all' ? t('all') : c(category)}
            isSelected={query.category === category}
            aria-pressed={query.category === category}
            isDisabled={pending}
            onClick={() => update({ category })}
          />
        );
      })}
    </fieldset>
  );
  const statusSelect = (
    <div className="flex min-w-0 flex-col gap-2 text-sm">
      <Select
        label={t('status')}
        isLabelHidden
        disabled={pending}
        value={query.status}
        onChange={(value) => update({ status: value as DirectoryQuery['status'] })}
        options={[
          { value: 'all', label: t('allStatuses') },
          ...statuses.map((status) => ({ value: status, label: s(status) })),
        ]}
      />
    </div>
  );
  const sortSelect = (
    <div className="flex items-center gap-2">
      <Select
        label={t('sort')}
        isLabelHidden
        disabled={pending}
        value={query.sort}
        onChange={(value) => update({ sort: value as DirectoryQuery['sort'] })}
        options={[
          { value: 'recommended', label: t('recommended') },
          { value: 'updated', label: t('updated') },
          { value: 'name', label: t('name') },
        ]}
      />
    </div>
  );
  return (
    <div className="directory-layout" aria-busy={pending}>
      <div className="directory-toolbar">
        <fieldset disabled={pending} className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <form
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
              role="search"
              className="flex min-w-0 flex-1 gap-2"
            >
              <div className="relative min-w-0 flex-1">
                <Input
                  key={query.q}
                  name="q"
                  type="search"
                  maxLength={100}
                  defaultValue={query.q}
                  label={t('search')}
                  isLabelHidden
                  placeholder={t('searchPlaceholder')}
                  startIcon={<Search size={18} aria-hidden="true" />}
                />
              </div>
              <Button type="submit">{t('searchButton')}</Button>
            </form>
            <div className="hidden md:block">{sortSelect}</div>
          </div>
          <div className="directory-summary flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="md:hidden">
                <Button
                  variant="outline"

                  onClick={() => setOpen(true)}
                  aria-haspopup="dialog"
                  aria-expanded={open}
                >
                  <SlidersHorizontal size={16} />
                  {t('filterCount', { count: active })}
                </Button>
                <Dialog
                  isOpen={open}
                  onOpenChange={setOpen}
                  width="min(90vw,360px)"
                  maxHeight="90dvh"
                  padding={4}
                  aria-label={t('filters')}
                  aria-describedby={descriptionId}
                >
                  <div className="p-5 pb-0">
                    <DialogHeader
                      title={t('filters')}
                      endContent={
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t('close')}
                          onClick={() => setOpen(false)}
                        >
                          <X />
                        </Button>
                      }
                    />
                    <p id={descriptionId} className="mt-2 text-sm text-muted-foreground">
                      {t('filterDescription')}
                    </p>
                  </div>
                  <div className="space-y-7 p-5">
                    <p className="text-sm text-muted-foreground">
                      {t('filterCount', { count: active })}
                    </p>
                    {categoryList}
                    <fieldset disabled={pending}>
                      <legend className="mb-2 text-sm font-semibold">{t('status')}</legend>
                      {statusSelect}
                    </fieldset>
                    <Button
                      disabled={pending || !modified}
                      variant="outline"
                      onClick={() => navigate(defaultQuery)}
                      className="w-full"
                    >
                      {t('reset')}
                    </Button>
                    <Button className="w-full" onClick={() => setOpen(false)}>
                      {t('done')}
                    </Button>
                  </div>
                </Dialog>
              </div>
              <p role="status" aria-live="polite" className="text-muted-foreground">
                {t(fictional ? 'results' : 'realResults', { count: total })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {modified && (
                <Button
                  variant="ghost"
                  onClick={() => navigate(defaultQuery)}
                  className="h-10 text-xs"
                >
                  <X size={13} />
                  {t('reset')}
                </Button>
              )}
              <div className="md:hidden">{sortSelect}</div>
            </div>
          </div>
        </fieldset>
      </div>
      <aside className="directory-sidebar hidden md:block">
        <fieldset disabled={pending} className="mb-7">
          <legend className="text-xs font-medium text-muted-foreground">{t('status')}</legend>
          <div className="mt-3">{statusSelect}</div>
        </fieldset>
        {categoryList}
        <div className="mt-6">
          <Link
            href="/methodology"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            {n('methodology')}
          </Link>
        </div>
      </aside>
      <div className="directory-results min-w-0">
        <div className={pending ? 'opacity-60 transition-opacity' : ''}>{children}</div>
        {pages > 1 && (
          <Pagination
            className="mt-8"
            page={query.page}
            totalPages={pages}
            onChange={(page) => update({ page })}
            isDisabled={pending}
            label={t('page', { page: query.page, pages })}
          />
        )}
      </div>
    </div>
  );
}
