'use client';
import { TopNav, TopNavItem } from '@astryxdesign/core/TopNav';
import { usePathname, Link } from '@/i18n/navigation';
import { Preferences } from './preferences';
import { BrandMark } from './brand-mark';
import { useTranslations } from 'next-intl';

export function SiteNavigation() {
  const t = useTranslations('Nav');
  const pathname = usePathname();
  return (
    <div className="site-width header-layout">
      <Link href="/" className="brand-link">
        <BrandMark />
        <span>Is Duo Ready?</span>
      </Link>
      <TopNav
        className="header-navigation"
        label={t('menu')}
        startContent={
          <>
            {(
              [
                { href: '/', key: 'explore' },
                { href: '/updates', key: 'updates' },
                { href: '/submit', key: 'submit' },
              ] as const
            ).map(({ href, key }) => (
              <TopNavItem key={href} href={href} label={t(key)} isSelected={pathname === href} />
            ))}
          </>
        }
      />
      <Preferences />
    </div>
  );
}
