import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Preferences } from './preferences';
import { BrandMark } from './brand-mark';
export async function Header() {
  const t = await getTranslations('Nav');
  return (
    <header className="site-header">
      <a href="#main" className="skip-link">
        {t('skip')}
      </a>
      <div className="site-width header-inner">
        <Link href="/" className="brand-link">
          <BrandMark />
          <span>Is Duo Ready?</span>
        </Link>
        <nav aria-label={t('menu')} className="header-nav">
          <Link href="/" className="nav-link">
            {t('explore')}
          </Link>
          <Link href="/updates" className="nav-link">
            {t('updates')}
          </Link>
          <Link href="/submit" className="nav-link">
            {t('submit')}
          </Link>
        </nav>
        <Preferences />
      </div>
    </header>
  );
}
