'use client';
import { Banner, Card, ProgressBar } from '@/components/ui/surfaces';

import { Select, TextArea, FileInput } from '@/components/ui/form-controls';

import { useActionState, useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/components/ui/link';
import { Button } from '@/components/ui/button';
import {
  continueImportAction,
  createImportAction,
  retryImportAction,
} from '@/app/[locale]/admin/import-actions';
import type { ImportRun } from '@/lib/import/repository';

export function ImportForm() {
  const t = useTranslations('Import');
  const [mode, setMode] = useState('urls');
  const [file, setFile] = useState<File | File[] | null>(null);
  const [state, action, pending] = useActionState(createImportAction, {});
  if (state.run) return <ImportProgress key={state.run.id} initial={state.run} />;
  return (
    <form
      action={(data) => {
        if (mode === 'csv' && file instanceof File) data.set('file', file);
        action(data);
      }}
      className="mt-8 max-w-3xl space-y-5"
    >
      <div className="block space-y-2">
        <Select
          label={t('mode')}
          name="mode"
          value={mode}
          onChange={(value) => setMode(value)}
          disabled={pending}
          options={[
            { value: 'urls', label: t('urls') },
            { value: 'csv', label: t('csv') },
          ]}
        />
      </div>
      <div className="block space-y-2">
        <TextArea
          label={t(mode === 'urls' ? 'urlInput' : 'csvInput')}
          name="input"
          rows={8}
          maxLength={524288}
          required={mode === 'urls'}
          disabled={pending}
          aria-describedby="import-help"
        />
      </div>
      {mode === 'csv' && (
        <div className="block space-y-2">
          <FileInput
            label={t('file')}
            value={file}
            onChange={setFile}
            accept=".csv,text/csv"
            isDisabled={pending}
          />
        </div>
      )}
      <p id="import-help" className="break-words text-sm text-muted-foreground">
        {t(mode === 'urls' ? 'urlHelp' : 'csvHelp')}
      </p>
      {state.error && (
        <Banner role="alert" status="error" title={<>{t(`errors.${state.error}`)}</>} />
      )}
      <Button type="submit" isLoading={pending}>
        {t('preview')}
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
        <ProgressBar label={t('results')} isLabelHidden max={run.rows.length} value={completed} />
        <p className="text-sm text-muted-foreground">
          {t(pending ? 'runningHelp' : remaining > 0 ? 'resumeHelp' : 'completedHelp')}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        {remaining > 0 && (
          <Button isLoading={pending} onClick={() => proceed()}>
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
          <Button variant="outline" isLoading={pending} onClick={() => proceed(true)}>
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
      {error && <Banner role="alert" status="error" title={<>{t(`errors.${error}`)}</>} />}
      <ol className="space-y-3">
        {run.rows.map((row) => (
          <li key={row.number} data-testid="import-row">
            <Card padding={5} className=" ">
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
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
