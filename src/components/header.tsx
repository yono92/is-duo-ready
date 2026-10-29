import { getTranslations } from 'next-intl/server';
import { SiteNavigation } from './site-navigation';
export async function Header() {
  const t = await getTranslations('Nav');
  return (
    <header className="site-header">
      <a href="#main" className="skip-link">
        {t('skip')}
      </a>
      <SiteNavigation />
    </header>
  );
}
