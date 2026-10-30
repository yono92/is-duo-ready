'use client';
import { Pagination } from '@astryxdesign/core/Pagination';
import { useRouter } from '@/i18n/navigation';
import { useTransition } from 'react';

export function RoutePagination({
  page,
  pages,
  hasMore,
  path,
  label,
}: {
  page: number;
  pages?: number;
  hasMore?: boolean;
  path: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Pagination
      page={page}
      totalPages={pages}
      hasMore={hasMore}
      variant={pages === undefined ? 'none' : 'pages'}
      label={label}
      isDisabled={pending}
      className="mt-6"
      onChange={(next) => {
        const [pathname, search] = path.split('?');
        const params = new URLSearchParams(search);
        params.set('page', String(next));
        startTransition(() => router.push(`${pathname}?${params}`));
      }}
    />
  );
}
