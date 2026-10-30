'use client';

import { Bar, BarChart, Rectangle, Tooltip, XAxis, YAxis } from 'recharts';
import { useFormatter, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/surfaces';
import type { DirectoryStats } from '@/lib/directory/types';

const statuses = ['supported', 'planned', 'unsupported', 'unknown'] as const;
const colors = {
  supported: 'var(--color-data-categorical-green)',
  planned: 'var(--color-data-categorical-blue)',
  unsupported: 'var(--color-data-categorical-red)',
  unknown: 'var(--directory-chart-unknown)',
};

export default function DistributionChart({ stats }: { stats: DirectoryStats }) {
  const t = useTranslations('DirectoryStats');
  const format = useFormatter();
  const visibleStatuses = statuses.filter((status) => stats[status] > 0);
  const share = (count: number) =>
    format.number(stats.total ? count / stats.total : 0, {
      style: 'percent',
      maximumFractionDigits: 1,
    });

  return (
    <BarChart
      responsive
      style={{ width: '100%', height: '100%' }}
      data={[{ group: 'all', ...stats }]}
      layout="vertical"
      stackOffset="expand"
      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
      barSize={12}
      barCategoryGap={0}
      barGap={0}
      accessibilityLayer
      aria-label={t('distributionTitle')}
    >
      <XAxis type="number" domain={[0, 1]} hide allowDataOverflow />
      <YAxis type="category" dataKey="group" hide />
      {visibleStatuses.map((status, index) => (
        <Bar
          key={status}
          dataKey={status}
          name={t(status)}
          stackId="support"
          fill={colors[status]}
          isAnimationActive={false}
          shape={(props) => (
            <Rectangle
              {...props}
              radius={[
                index === 0 ? 6 : 0,
                index === visibleStatuses.length - 1 ? 6 : 0,
                index === visibleStatuses.length - 1 ? 6 : 0,
                index === 0 ? 6 : 0,
              ]}
              role="img"
              data-status={status}
              aria-label={`${t(status)}: ${format.number(stats[status])} (${share(stats[status])})`}
            />
          )}
        />
      ))}
      <Tooltip
        shared={false}
        cursor={false}
        isAnimationActive={false}
        allowEscapeViewBox={{ x: false, y: true }}
        reverseDirection={{ y: true }}
        offset={16}
        content={({ active, payload }) => {
          const status = statuses.find((value) => value === payload?.[0]?.dataKey);
          if (!active || !status) return null;
          return (
            <Card padding={3} className="directory-chart-tooltip">
              <p className="flex items-center gap-2 text-sm font-medium">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: colors[status] }}
                  aria-hidden="true"
                />
                {t(status)}
              </p>
              <p className="mt-2 flex items-baseline gap-3 tabular-nums">
                <strong className="text-xl font-semibold">{format.number(stats[status])}</strong>
                <span className="text-sm text-muted-foreground">{share(stats[status])}</span>
              </p>
            </Card>
          );
        }}
      />
    </BarChart>
  );
}
