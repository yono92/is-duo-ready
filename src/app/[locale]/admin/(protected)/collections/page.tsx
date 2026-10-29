import { getLocale, getTranslations } from 'next-intl/server';
import { requireAdmin } from '@/lib/admin/auth';
import { listAdminApps } from '@/lib/admin/repository';
import { collectionOverview } from '@/lib/operations/repository';
import { OperationForm } from '@/components/operations/operation-form';
import { Input } from '@/components/ui/input';
import type { Locale } from '@/lib/directory/types';
import { Link } from '@/i18n/navigation';

export default async function Collections() {
  const locale = (await getLocale()) as Locale;
  const actor = await requireAdmin(locale);
  const t = await getTranslations('Operations');
  const [apps, data] = await Promise.all([listAdminApps(actor), collectionOverview(actor)]);
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
      <details className="rounded-xl border bg-card p-5">
        <summary className="min-h-11 cursor-pointer font-medium">{t('addTarget')}</summary>
        <OperationForm
          fields={{ operation: 'createTarget' }}
          label={t('addTarget')}
          disabled={!apps.length}
        >
          <label className="block space-y-2">
            <span>{t('app')}</span>
            <select
              name="app_id"
              required
              className="h-11 w-full rounded-lg border bg-background px-3"
            >
              {apps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name} ({app.app_store_id})
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span>{t('adapter')}</span>
            <select name="kind" className="h-11 w-full rounded-lg border bg-background px-3">
              <option value="app_store">{t('appStore')}</option>
              <option value="web">{t('officialWeb')}</option>
            </select>
          </label>
          <div className="block space-y-2">
            <Input label={t('sourceUrl')} name="url" type="url" required maxLength={2000} />
          </div>
          <div className="block space-y-2">
            <Input label={t('approvalNote')} name="approval_note" required maxLength={1000} />
          </div>
          <label className="flex min-h-11 items-start gap-3">
            <input name="confirmed" type="checkbox" required className="mt-1 size-5 shrink-0" />
            <span>{t('targetConfirm')}</span>
          </label>
          {!apps.length && <p>{t('needApp')}</p>}
        </OperationForm>
      </details>
      <OperationForm fields={{ operation: 'collect' }} label={t('runDue')} />
      <p className="text-sm text-muted-foreground">{t('limits')}</p>
      <ul className="space-y-4">
        {data.targets.map((target) => (
          <li key={target.id} className="space-y-4 rounded-xl border bg-card p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <Link className="font-semibold text-primary" href={`/admin/apps/${target.app_id}`}>
                {target.name}
              </Link>
              <span>{t(target.enabled ? 'enabled' : 'paused')}</span>
            </div>
            <a
              href={target.url}
              target="_blank"
              rel="noreferrer"
              className="block text-sm break-all text-primary"
            >
              {target.url}
            </a>
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
                fields={{ operation: 'collect', id: target.id }}
                label={t(target.running ? 'running' : 'runNow')}
                disabled={!target.enabled || target.running}
              />
              <OperationForm
                fields={{
                  operation: 'toggleTarget',
                  id: target.id,
                  enabled: String(target.enabled),
                }}
                label={t(target.enabled ? 'pause' : 'resume')}
              />
            </div>
          </li>
        ))}
      </ul>
      {!data.targets.length && <p>{t('emptyTargets')}</p>}
      <section>
        <h2 className="mb-4 text-xl font-semibold">{t('recentRuns')}</h2>
        <ul className="space-y-3">
          {data.runs.map((run) => (
            <li
              key={run.id}
              className="flex flex-wrap justify-between gap-2 rounded-lg border p-4 text-sm"
            >
              <span>
                {run.name} · {date(run.started_at)}
              </span>
              <span>
                {t(`runStates.${run.state}`)} · {t('attempts', { count: run.attempts })}
                {run.error_code
                  ? ` · ${t.has(`errors.${run.error_code}`) ? t(`errors.${run.error_code}`) : t('errors.upstream')}`
                  : ''}
              </span>
            </li>
          ))}
        </ul>
        {!data.runs.length && <p>{t('emptyRuns')}</p>}
      </section>
      <p className="text-sm text-muted-foreground">{t('weeklyResearch')}</p>
    </section>
  );
}
