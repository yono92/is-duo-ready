import { getTranslations } from 'next-intl/server';
import { SiteNavigation } from './site-navigation';
import { Link } from '@/components/ui/link';
export async function Header() {
  const t = await getTranslations('Nav');
  return (
    <header className="site-header">
      <Link href="#main" className="skip-link" color="inherit" type="inherit">
        {t('skip')}
      </Link>
      <SiteNavigation />
    </header>
  );
}
