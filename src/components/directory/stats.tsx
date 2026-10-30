import { getFormatter, getTranslations } from 'next-intl/server';
import { Card } from '@/components/ui/surfaces';
import { SupportDistribution } from './support-distribution';
import type { DirectoryStats } from '@/lib/directory/types';

const statuses = ['supported', 'planned', 'unsupported', 'unknown'] as const;
const colors = {
  supported: 'var(--color-data-categorical-green)',
  planned: 'var(--color-data-categorical-blue)',
  unsupported: 'var(--color-data-categorical-red)',
  unknown: 'var(--directory-chart-unknown)',
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
      <Card padding={0} className="directory-overview-panel">
        <div className="directory-overview-header">
          <div>
            <p className="directory-overview-label">{t('supported')}</p>
            <p className="directory-overview-headline">
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
          </div>
          <p className="directory-overview-caption" data-stat="total">
            {t(fictional ? 'sampleTotal' : 'total', { count: stats.total })}
          </p>
        </div>
        <SupportDistribution stats={stats} />
        <dl className="directory-overview-legend">
          {statuses.map((status) => (
            <div key={status} data-stat={status} className="directory-overview-legend-item">
              <dt className="directory-overview-legend-label">
                <span
                  className="directory-overview-dot"
                  style={{ backgroundColor: colors[status] }}
                  aria-hidden="true"
                />
                {t(status)}
              </dt>
              <dd className="directory-overview-legend-count">{format.number(stats[status])}</dd>
            </div>
          ))}
        </dl>
        <p className="directory-overview-note">{t(fictional ? 'sampleScope' : 'scope')}</p>
      </Card>
    </section>
  );
}
