import { getFormatter, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale, PublicHistory } from '@/lib/directory/types';
export async function HistoryList({
  items,
  locale,
  showNames = false,
}: {
  items: PublicHistory[];
  locale: Locale;
  showNames?: boolean;
}) {
  const [t, s, format] = await Promise.all([
    getTranslations('Updates'),
    getTranslations('Status'),
    getFormatter(),
  ]);
  return (
    <ol className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="rounded-xl border bg-card p-5">
          {showNames && (
            <Link className="font-semibold text-primary" href={`/apps/${item.slug}`}>
              {item.names[locale]}
            </Link>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            <time dateTime={item.changedAt}>
              {format.dateTime(new Date(item.changedAt), {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </time>
          </p>
          <p className="mt-3 text-sm">
            {item.beforeStatus
              ? t('changed', { before: s(item.beforeStatus), after: s(item.afterStatus) })
              : t('initial', { status: s(item.afterStatus) })}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.reason}</p>
        </li>
      ))}
    </ol>
  );
}
