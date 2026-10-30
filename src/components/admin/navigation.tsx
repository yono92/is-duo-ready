'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { TopNav, TopNavItem } from '@/components/ui/surfaces';

const sections = [
  '/admin',
  '/admin/apps',
  '/admin/apps/import',
  '/admin/collections',
  '/admin/reviews',
  '/admin/submissions',
] as const;

export function AdminNavigation() {
  const t = useTranslations('Admin');
  const ops = useTranslations('Operations');
  const pathname = usePathname();
  // The most specific section wins: importing belongs to Import, not Apps.
  const selected = sections.findLast(
    (href) => pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`)),
  );
  const labels = [
    t('overview'),
    t('apps'),
    t('importApps'),
    ops('collections'),
    ops('reviews'),
    ops('submissions'),
  ];

  return (
    <TopNav
      label={t('navigation')}
      className="min-w-0 flex-1"
      startContent={
        <div className="flex flex-wrap gap-1">
          {sections.map((href, index) => (
            <TopNavItem
              key={href}
              href={href}
              label={labels[index]}
              isSelected={selected === href}
            />
          ))}
        </div>
      }
    />
  );
}
