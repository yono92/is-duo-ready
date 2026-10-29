'use client';
import { Pagination } from '@astryxdesign/core/Pagination';
import { useRouter } from '@/i18n/navigation';
import { useTransition } from 'react';

export function RoutePagination({
  page,
  pages,
  path,
  label,
}: {
  page: number;
  pages: number;
  path: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Pagination
      page={page}
      totalPages={pages}
      label={label}
      isDisabled={pending}
      className="mt-6"
      onChange={(next) => startTransition(() => router.push(`${path}?page=${next}`))}
    />
  );
}
