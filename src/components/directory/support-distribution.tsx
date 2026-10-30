'use client';

import dynamic from 'next/dynamic';
import type { DirectoryStats } from '@/lib/directory/types';

const DistributionChart = dynamic(() => import('./support-distribution-chart'), { ssr: false });

export function SupportDistribution({ stats }: { stats: DirectoryStats }) {
  return (
    <div className="support-distribution" data-testid="support-distribution">
      <DistributionChart stats={stats} />
    </div>
  );
}
