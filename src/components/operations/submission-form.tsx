'use client';
import { Card, Banner } from '@/components/ui/surfaces';

import { Select, TextArea } from '@/components/ui/form-controls';

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
      <Card padding={5} role="status" className="mt-8 ">
        <h2 className="text-xl font-semibold">{t('received')}</h2>
        <p className="mt-3 text-muted-foreground">{t('receivedBody')}</p>
      </Card>
    );
  return (
    <form action={action} className="mt-8 space-y-5">
      <fieldset disabled={!enabled || pending} className="space-y-5">
        <legend className="sr-only">{t('title')}</legend>
        <div className="block space-y-2">
          <Select
            label={t('kind')}
            name="kind"
            defaultValue={storeUrl ? 'correction' : 'add'}
            options={[
              { value: 'add', label: t('add') },
              { value: 'correction', label: t('correction') },
            ]}
          />
        </div>
        <div className="block space-y-2">
          <Input
            label={t('storeUrl')}
            name="store_url"
            type="url"
            required
            maxLength={2000}
            defaultValue={storeUrl}
            placeholder={t('storeUrlPlaceholder')}
          />
        </div>
        <div className="block space-y-2">
          <TextArea
            label={t('body')}
            name="body"
            required
            minLength={10}
            maxLength={4000}
            rows={6}
            aria-describedby="submission-privacy"
          />
        </div>
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
        <Banner role="alert" status="error" title={<>{t(`errors.${state.error}`)}</>} />
      )}
      <Button type="submit" disabled={!enabled || pending}>
        {t(pending ? 'working' : 'send')}
      </Button>
    </form>
  );
}
