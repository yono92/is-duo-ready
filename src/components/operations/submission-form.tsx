'use client';
import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { submitAction } from '@/app/[locale]/submit/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export function SubmissionForm({
  storeUrl = '',
  enabled,
}: {
  storeUrl?: string;
  enabled: boolean;
}) {
  const t = useTranslations('Submission');
  const [state, action, pending] = useActionState(submitAction, {});
  if (state.received)
    return (
      <div role="status" className="mt-8 rounded-xl border bg-card p-6">
        <h2 className="text-xl font-semibold">{t('received')}</h2>
        <p className="mt-3 text-muted-foreground">{t('receivedBody')}</p>
      </div>
    );
  return (
    <form action={action} className="mt-8 space-y-5">
      <fieldset disabled={!enabled || pending} className="space-y-5">
        <legend className="sr-only">{t('title')}</legend>
        <label className="block space-y-2">
          <span>{t('kind')}</span>
          <select
            name="kind"
            defaultValue={storeUrl ? 'correction' : 'add'}
            className="h-11 w-full rounded-lg border bg-background px-3"
          >
            <option value="add">{t('add')}</option>
            <option value="correction">{t('correction')}</option>
          </select>
        </label>
        <div className="block space-y-2">
          <Input
            label={t('storeUrl')}
            name="store_url"
            type="url"
            required
            maxLength={2000}
            defaultValue={storeUrl}
            placeholder="https://apps.apple.com/kr/app/id…"
          />
        </div>
        <label className="block space-y-2">
          <span>{t('body')}</span>
          <textarea
            name="body"
            required
            minLength={10}
            maxLength={4000}
            rows={6}
            aria-describedby="submission-privacy"
            className="w-full rounded-lg border bg-background p-3"
          />
        </label>
        <div className="block space-y-2">
          <Input
            label={t('evidenceUrl')}
            name="evidence_url"
            type="url"
            required
            maxLength={2000}
          />
        </div>
        <div hidden aria-hidden="true">
          <label>
            {t('website')}
            <input name="website" autoComplete="off" tabIndex={-1} />
          </label>
        </div>
      </fieldset>
      <p id="submission-privacy" className="text-sm text-muted-foreground">
        {t('privacy')}
      </p>
      {!enabled && <p role="status">{t('errors.unavailable')}</p>}
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <Button type="submit" disabled={!enabled || pending}>
        {t(pending ? 'working' : 'send')}
      </Button>
    </form>
  );
}
