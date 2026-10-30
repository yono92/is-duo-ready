import { statuses, type DirectoryApp, type DirectoryStats } from './types';

export function assertDirectoryStats(stats: DirectoryStats) {
  if (
    [stats.total, ...statuses.map((status) => stats[status])].some(
      (value) => !Number.isSafeInteger(value) || value < 0,
    ) ||
    statuses.reduce((sum, status) => sum + stats[status], 0) !== stats.total
  )
    throw new Error('Directory statistics do not reconcile.');
  return stats;
}

export function directoryStats(apps: DirectoryApp[]) {
  const stats: DirectoryStats = { total: 0, supported: 0, planned: 0, unknown: 0, unsupported: 0 };
  for (const app of apps) {
    if (app.publication !== 'published' || app.country !== 'KR') continue;
    stats.total++;
    stats[app.status]++;
  }
  return assertDirectoryStats(stats);
}
