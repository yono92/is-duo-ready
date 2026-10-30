import { getFormatter, getTranslations } from 'next-intl/server';
import { Circle, CircleDashed, Clock3, SquareMinus } from 'lucide-react';
import { SupportDistribution } from './support-distribution';
import type { DirectoryStats } from '@/lib/directory/types';

const statuses = ['supported', 'planned', 'unsupported', 'unknown'] as const;
const indicators = {
  supported: { Icon: Circle, color: 'var(--color-data-categorical-green)' },
  planned: { Icon: Clock3, color: 'var(--color-data-categorical-blue)' },
  unsupported: { Icon: SquareMinus, color: 'var(--color-data-categorical-red)' },
  unknown: { Icon: CircleDashed, color: 'var(--color-data-neutral)' },
};

export async function DirectoryOverview({
  stats,
  fictional,
}: {
  stats: DirectoryStats;
  fictional: boolean;
}) {
  const [t, format] = await Promise.all([getTranslations('DirectoryStats'), getFormatter()]);
  return (
    <section
      aria-label={t(fictional ? 'sampleTitle' : 'title')}
      data-testid="directory-stats"
      className="directory-overview"
    >
      <p className="directory-overview-caption" data-stat="total">
        {t(fictional ? 'sampleTotal' : 'total', { count: stats.total })}
      </p>
      <p className="directory-overview-headline">
        <span className="directory-overview-label">{t('supported')}</span>
        <strong className="directory-overview-count" data-testid="supported-count">
          {format.number(stats.supported)}
        </strong>
        <span className="directory-overview-share">
          <span className="sr-only">{t('shareOfTotal')} </span>
          {format.number(stats.total ? stats.supported / stats.total : 0, {
            style: 'percent',
            maximumFractionDigits: 1,
          })}
        </span>
      </p>
      <SupportDistribution stats={stats} />
      <dl className="directory-overview-legend">
        {statuses.map((status) => {
          const { Icon, color } = indicators[status];
          return (
            <div key={status} data-stat={status} className="directory-overview-legend-item">
              <dt className="directory-overview-legend-label">
                <Icon
                  size={14}
                  aria-hidden="true"
                  className="shrink-0"
                  style={{ color }}
                  fill={status === 'supported' ? 'currentColor' : 'none'}
                />
                {t(status)}
              </dt>
              <dd className="directory-overview-legend-count">{format.number(stats[status])}</dd>
            </div>
          );
        })}
      </dl>
      <p className="directory-overview-note">{t(fictional ? 'sampleScope' : 'scope')}</p>
    </section>
  );
}
