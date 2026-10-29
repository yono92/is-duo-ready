import { FlaskConical } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
export async function FixtureNotice() {
  const t = await getTranslations('Home');
  return (
    <div className="fixture-notice flex items-start gap-2 text-sm">
      <FlaskConical size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p>
        <strong className="mr-2 font-semibold">{t('fixture')}</strong>
        {t('fixtureDescription')}
      </p>
    </div>
  );
}
