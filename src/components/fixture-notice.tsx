import { FlaskConical } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Banner } from '@/components/ui/surfaces';
export async function FixtureNotice() {
  const t = await getTranslations('Home');
  return (
    <Banner
      status="info"
      title={t('fixture')}
      description={t('fixtureDescription')}
      icon={<FlaskConical size={18} aria-hidden="true" />}
    />
  );
}
