'use client';
import { Banner } from '@/components/ui/surfaces';

import { Checkbox, FileInput, Select, TextArea } from '@/components/ui/form-controls';

import { useActionState, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { submitAction, type SubmissionState } from '@/app/[locale]/submit/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export function SubmissionForm({
  storeUrl = '',
  enabled,
  initialKind,
}: {
  storeUrl?: string;
  enabled: boolean;
  initialKind?: 'usage';
}) {
  const t = useTranslations('Submission');
  const u = useTranslations('Usage');
  const locale = useLocale();
  const [kind, setKind] = useState(initialKind ?? (storeUrl ? 'correction' : 'add'));
  const [file, setFile] = useState<File | null>(null);
  const [state, action, pending] = useActionState((previous: SubmissionState, form: FormData) => {
    if (kind === 'usage' && file) form.set('screenshot', file);
    return submitAction(previous, form);
  }, {});
  if (state.received)
    return (
      <Banner
        role="status"
        status="success"
        className="mt-8"
        title={<h2 className="text-xl font-semibold">{t('received')}</h2>}
        description={t('receivedBody')}
      />
    );
  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <fieldset disabled={!enabled || pending} className="space-y-5">
        <legend className="sr-only">{t('title')}</legend>
        <div className="block space-y-2">
          <Select
            label={t('kind')}
            name="kind"
            value={kind}
            onChange={(value) => {
              setKind(value);
              setFile(null);
            }}
            options={[
              { value: 'add', label: t('add') },
              { value: 'correction', label: t('correction') },
              { value: 'usage', label: t('usage') },
            ]}
          />
        </div>
        {kind === 'usage' && (
          <fieldset className="space-y-5" aria-describedby="usage-help">
            <legend className="mb-3 text-lg font-semibold">{u('environmentTitle')}</legend>
            <p id="usage-help" className="text-sm leading-relaxed text-muted-foreground">
              {u('formHelp')}
            </p>
            <Select
              label={u('environment')}
              name="environment"
              options={['device', 'simulator'].map((value) => ({
                value,
                label: u(`environments.${value}`),
              }))}
            />
            <Input label={u('deviceModel')} name="device_model" required maxLength={80} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label={u('osVersion')} name="os_version" required maxLength={80} />
              <Input label={u('appVersion')} name="app_version" required maxLength={80} />
            </div>
            <Input
              label={u('observedOn')}
              name="observed_on"
              placeholder="YYYY-MM-DD"
              pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
              required
              maxLength={10}
            />
            <Select
              label={u('displayMode')}
              name="display_mode"
              options={['unfolded', 'folded', 'transition'].map((value) => ({
                value,
                label: u(`displayModes.${value}`),
              }))}
            />
            <Select
              label={u('result')}
              name="result"
              options={['works', 'issues'].map((value) => ({
                value,
                label: u(`results.${value}`),
              }))}
            />
          </fieldset>
        )}
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
            label={t(kind === 'usage' ? 'optionalEvidenceUrl' : 'evidenceUrl')}
            name="evidence_url"
            type="url"
            required={kind !== 'usage'}
            maxLength={2000}
          />
        </div>
        {kind === 'usage' && (
          <div className="space-y-4">
            <FileInput
              label={u('screenshot')}
              value={file}
              onChange={(value) => setFile(Array.isArray(value) ? (value[0] ?? null) : value)}
              accept="image/png,image/jpeg,image/webp"
              maxSize={2 * 1024 * 1024}
              isDisabled={pending || !enabled}
              description={u('screenshotHelp')}
            />
            <Checkbox label={u('consent')} name="publish_consent" required />
          </div>
        )}
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
      {!enabled && <Banner role="status" status="warning" title={t('errors.unavailable')} />}
      {state.error && (
        <Banner role="alert" status="error" title={<>{t(`errors.${state.error}`)}</>} />
      )}
      <Button type="submit" disabled={!enabled} isLoading={pending}>
        {t('send')}
      </Button>
    </form>
  );
}
