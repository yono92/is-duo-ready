'use client';
import { Select } from '@/components/ui/form-controls';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal, X } from 'lucide-react';
import { Link } from '@/components/ui/link';
import { categories, statuses, type DirectoryQuery } from '@/lib/directory/types';
import { defaultQuery } from '@/lib/directory/query';
import { useDirectoryNavigation } from './navigation';
import { Button } from '@/components/ui/button';
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
  const { pending, navigate, update } = useDirectoryNavigation();
  const descriptionId = useId();
  const [open, setOpen] = useState(false);
  const active = Number(query.category !== 'all') + Number(query.status !== 'all');
  const modified = active > 0 || !!query.q || query.sort !== defaultQuery.sort;
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
  const sortSelect = (
    <div className="flex items-center gap-2">
      <Select
        label={t('sort')}
        isLabelHidden
        disabled={pending}
        value={query.sort}
        onChange={(value) => update({ sort: value as DirectoryQuery['sort'] })}
        options={[
          { value: 'familiar', label: t('familiar') },
          { value: 'top-free', label: t('topFree') },
          { value: 'top-paid', label: t('topPaid') },
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
          <fieldset disabled={pending} className="min-w-0">
            <legend className="sr-only">{t('status')}</legend>
            <div className="flex flex-wrap gap-2">
              {(['all', ...statuses] as const).map((status) => (
                <Button
                  key={status}
                  variant={query.status === status ? 'default' : 'outline'}
                  aria-pressed={query.status === status}
                  disabled={pending}
                  onClick={() => update({ status })}
                >
                  {status === 'all' ? t('allStatuses') : s(status)}
                </Button>
              ))}
            </div>
          </fieldset>
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
              {sortSelect}
            </div>
          </div>
        </fieldset>
      </div>
      <aside className="directory-sidebar hidden md:block">
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
