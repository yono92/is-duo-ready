'use client';

import { useActionState, useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  continueImportAction,
  createImportAction,
  retryImportAction,
} from '@/app/[locale]/admin/import-actions';
import type { ImportRun } from '@/lib/import/repository';

export function ImportForm() {
  const t = useTranslations('Import');
  const [mode, setMode] = useState('urls');
  const [state, action, pending] = useActionState(createImportAction, {});
  if (state.run) return <ImportProgress key={state.run.id} initial={state.run} />;
  return (
    <form action={action} className="mt-8 max-w-3xl space-y-5">
      <label className="block space-y-2">
        <span>{t('mode')}</span>
        <select
          name="mode"
          value={mode}
          onChange={(event) => setMode(event.target.value)}
          className="h-11 w-full rounded-xl border bg-background px-3"
          disabled={pending}
        >
          <option value="urls">{t('urls')}</option>
          <option value="csv">{t('csv')}</option>
        </select>
      </label>
      <label className="block space-y-2">
        <span>{t(mode === 'urls' ? 'urlInput' : 'csvInput')}</span>
        <textarea
          name="input"
          rows={8}
          maxLength={524288}
          required={mode === 'urls'}
          disabled={pending}
          className="w-full rounded-xl border bg-background p-3 text-sm"
          aria-describedby="import-help"
        />
      </label>
      {mode === 'csv' && (
        <div className="block space-y-2">
          <Input
            label={t('file')}
            name="file"
            type="file"
            accept=".csv,text/csv"
            disabled={pending}
          />
        </div>
      )}
      <p id="import-help" className="break-words text-sm text-muted-foreground">
        {t(mode === 'urls' ? 'urlHelp' : 'csvHelp')}
      </p>
      {state.error && (
        <p role="alert" className="text-destructive">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {t(pending ? 'working' : 'preview')}
      </Button>
    </form>
  );
}

export function ImportProgress({ initial }: { initial: ImportRun }) {
  const t = useTranslations('Import');
  const [run, setRun] = useState(initial);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const stop = useRef(false);
  const completed = run.rows.filter((row) => row.state !== 'pending').length;
  const remaining = run.rows.length - completed;
  const retryable = run.rows.some((row) => row.retryable);
  function proceed(retry = false) {
    stop.current = false;
    setError(undefined);
    startTransition(async () => {
      try {
        let current = run;
        if (retry) {
          const result = await retryImportAction(run.id);
          if (!result.run) {
            setError(result.error ?? 'unavailable');
            return;
          }
          current = result.run;
          setRun(current);
        }
        while (!stop.current && current.rows.some((row) => row.state === 'pending')) {
          const result = await continueImportAction(current.id);
          if (!result.run) {
            setError(result.error ?? 'unavailable');
            return;
          }
          current = result.run;
          setRun(current);
        }
      } catch {
        setError('unavailable');
      }
    });
  }
  return (
    <section className="mt-8 space-y-5" aria-label={t('results')}>
      <div className="space-y-2">
        <p role="status">{t('progress', { completed, total: run.rows.length })}</p>
        <progress
          aria-label={t('results')}
          className="h-2 w-full accent-primary"
          max={run.rows.length}
          value={completed}
        />
        <p className="text-sm text-muted-foreground">{t(pending ? 'runningHelp' : 'resumeHelp')}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {remaining > 0 && (
          <Button disabled={pending} onClick={() => proceed()}>
            {t('start')}
          </Button>
        )}
        {pending && (
          <Button
            variant="outline"
            onClick={() => {
              stop.current = true;
            }}
          >
            {t('stop')}
          </Button>
        )}
        {retryable && (
          <Button variant="outline" disabled={pending} onClick={() => proceed(true)}>
            {t('retry')}
          </Button>
        )}
        <Link
          href={`/admin/apps/import?run=${run.id}`}
          className="inline-flex min-h-11 items-center text-sm text-primary"
        >
          {t('resumeLink')}
        </Link>
      </div>
      {error && (
        <p role="alert" className="text-destructive">
          {t(`errors.${error}`)}
        </p>
      )}
      <ol className="space-y-3">
        {run.rows.map((row) => (
          <li key={row.number} data-testid="import-row" className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-medium">
                {t('row', { number: row.number })} · {t(`states.${row.state}`)}
              </span>
              {row.appId && (
                <Link href={`/admin/apps/${row.appId}`} className="text-primary">
                  {t('edit')}
                </Link>
              )}
            </div>
            <p className="mt-2 break-all text-sm text-muted-foreground">{row.url}</p>
            {row.error && (
              <p className="mt-2 text-sm text-destructive">{t(`errors.${row.error}`)}</p>
            )}
            {row.appId && row.missingEvidence && (
              <p className="mt-2 text-sm">{t('missingEvidence')}</p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
