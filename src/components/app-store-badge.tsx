import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

export async function AppStoreBadge({ url, name }: { url: string; name: string }) {
  const t = await getTranslations('AppAssets');
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('storeLink', { name })}
      className="inline-flex min-h-11 shrink-0 items-center p-2.5"
    >
      <Image src="/badges/app-store.svg" alt={t('badgeAlt')} width={120} height={40} unoptimized />
    </a>
  );
}
