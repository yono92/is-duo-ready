'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Collapsible, Card, Banner } from '@/components/ui/surfaces';
import { Select, Checkbox } from '@/components/ui/form-controls';
import { OperationForm } from '@/components/operations/operation-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from '@/components/ui/link';
import {
  collectionQueryKey,
  collectionQueryOptions,
  isCollectionAccessError,
  type CollectionOverview,
} from '@/lib/operations/collection-query';

export function CollectionDashboard({
  apps,
  initialData,
  initialDataUpdatedAt,
}: {
  apps: { id: string; name: string; app_store_id: string }[];
  initialData: CollectionOverview;
  initialDataUpdatedAt: number;
}) {
  const locale = useLocale();
  const t = useTranslations('Operations');
  const queryClient = useQueryClient();
  const { data, error, isFetching, refetch } = useQuery({
    ...collectionQueryOptions(),
    initialData,
    initialDataUpdatedAt,
  });
  const refreshCollections = () => queryClient.invalidateQueries({ queryKey: collectionQueryKey });

  if (isCollectionAccessError(error)) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold">{t('collections')}</h1>
        <Banner role="alert" status="error" title={t('overviewAccessLost')} />
        <Link href="/admin/login">{t('overviewSignIn')}</Link>
      </section>
    );
  }
  const date = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'Asia/Seoul',
        }).format(new Date(value))
      : t('never');
  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">{t('collections')}</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">{t('collectionHelp')}</p>
      </header>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>
          {t(isFetching ? 'refreshingOverview' : 'refreshOverview')}
        </Button>
        <p className="text-sm text-muted-foreground">{t('overviewRefreshHelp')}</p>
      </div>
      {error && <Banner role="alert" status="error" title={t('overviewRefreshFailed')} />}
      <Card padding={5}>
        <Collapsible defaultIsOpen={false} trigger={<>{t('addTarget')}</>}>
          <OperationForm
            onComplete={refreshCollections}
            fields={{ operation: 'createTarget' }}
            label={t('addTarget')}
            disabled={!apps.length}
          >
            <div className="block space-y-2">
              <Select
                label={t('app')}
                name="app_id"
                required
                options={[
                  ...apps.map((app) => ({
                    value: app.id,
                    label: `${app.name} (${app.app_store_id})`,
                  })),
                ]}
              />
            </div>
            <div className="block space-y-2">
              <Select
                label={t('adapter')}
                name="kind"
                options={[
                  { value: 'app_store', label: t('appStore') },
                  { value: 'web', label: t('officialWeb') },
                ]}
              />
            </div>
            <div className="block space-y-2">
              <Input label={t('sourceUrl')} name="url" type="url" required maxLength={2000} />
            </div>
            <div className="block space-y-2">
              <Input label={t('approvalNote')} name="approval_note" required maxLength={1000} />
            </div>
            <div className="flex min-h-11 items-start gap-3">
              <Checkbox label={t('targetConfirm')} name="confirmed" required />
            </div>
            {!apps.length && <p>{t('needApp')}</p>}
          </OperationForm>
        </Collapsible>
      </Card>
      <OperationForm
        onComplete={refreshCollections}
        fields={{ operation: 'collect' }}
        label={t('runDue')}
      />
      <p className="text-sm text-muted-foreground">{t('limits')}</p>
      <ul className="space-y-4">
        {data.targets.map((target) => (
          <li key={target.id}>
            <Card padding={5} className="space-y-4 ">
              <div className="flex flex-wrap justify-between gap-3">
                <Link className="font-semibold text-primary" href={`/admin/apps/${target.app_id}`}>
                  {target.name}
                </Link>
                <span>{t(target.enabled ? 'enabled' : 'paused')}</span>
              </div>
              <Link
                href={target.url}
                target="_blank"
                rel="noreferrer"
                className="block text-sm break-all text-primary"
              >
                {target.url}
              </Link>
              <dl className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">{t('lastSuccess')}</dt>
                  <dd>{date(target.last_success_at)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('nextDue')}</dt>
                  <dd>{date(target.next_due_at)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('failures')}</dt>
                  <dd>{target.failures}</dd>
                </div>
              </dl>
              {target.failures >= 3 && (
                <p role="status" className="font-medium">
                  {t('longFailure')}
                </p>
              )}
              {target.last_error && (
                <p className="text-sm text-destructive">
                  {t('collectionError')}{' '}
                  {t.has(`errors.${target.last_error}`)
                    ? t(`errors.${target.last_error}`)
                    : t('errors.upstream')}
                </p>
              )}
              <div className="flex flex-wrap gap-4">
                <OperationForm
                  onComplete={refreshCollections}
                  fields={{ operation: 'collect', id: target.id }}
                  label={t(target.running ? 'running' : 'runNow')}
                  disabled={!target.enabled || target.running}
                />
                <OperationForm
                  onComplete={refreshCollections}
                  fields={{
                    operation: 'toggleTarget',
                    id: target.id,
                    enabled: String(target.enabled),
                  }}
                  label={t(target.enabled ? 'pause' : 'resume')}
                />
              </div>
            </Card>
          </li>
        ))}
      </ul>
      {!data.targets.length && <p>{t('emptyTargets')}</p>}
      <section>
        <h2 className="mb-4 text-xl font-semibold">{t('recentRuns')}</h2>
        <ul className="space-y-3">
          {data.runs.map((run) => (
            <li key={run.id}>
              <Card padding={5} className="flex flex-wrap justify-between gap-2 text-sm">
                <span>
                  {run.name} · {date(run.started_at)}
                </span>
                <span>
                  {t(`runStates.${run.state}`)} · {t('attempts', { count: run.attempts })}
                  {run.error_code
                    ? ` · ${t.has(`errors.${run.error_code}`) ? t(`errors.${run.error_code}`) : t('errors.upstream')}`
                    : ''}
                </span>
              </Card>
            </li>
          ))}
        </ul>
        {!data.runs.length && <p>{t('emptyRuns')}</p>}
      </section>
    </section>
  );
}
