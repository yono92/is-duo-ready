import { getTranslations } from 'next-intl/server';
import type { UsageDetails as Details } from '@/lib/operations/usage-types';

export async function UsageDetails({ usage }: { usage: Details }) {
  const t = await getTranslations('Usage');
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      {[
        [t('environment'), t(`environments.${usage.environment}`)],
        [t('deviceModel'), usage.device_model],
        [t('osVersion'), usage.os_version],
        [t('appVersion'), usage.app_version],
        [t('observedOn'), usage.observed_on],
        [t('displayMode'), t(`displayModes.${usage.display_mode}`)],
        [t('result'), t(`results.${usage.result}`)],
      ].map(([label, value]) => (
        <div key={label}>
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="mt-1 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
