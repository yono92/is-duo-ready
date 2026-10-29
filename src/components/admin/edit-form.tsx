'use client';
import { Card, Banner } from '@/components/ui/surfaces';

import { Select, TextArea, Checkbox, DateInput } from '@/components/ui/form-controls';

import { useActionState, useState, type ComponentProps } from 'react';
import { useTranslations } from 'next-intl';
import { saveAppAction, reviewAppAction } from '@/app/[locale]/admin/actions';
import { type AdminDraft, type AdminEvidence } from '@/lib/admin/input';
import { categories, locales, statuses } from '@/lib/directory/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type TextField =
  'app_store_id' | 'slug' | 'name' | 'developer' | 'current_version' | 'support_version';
const newEvidence = (): AdminEvidence => ({
  url: '',
  title: '',
  kind: 'developer',
  quote: '',
  official_confirmed: false,
  announced_at: '',
  support_version: '',
  features: [],
});

export function EditForm({ initial }: { initial: AdminDraft }) {
  const t = useTranslations('Admin');
  const c = useTranslations('Categories');
  const s = useTranslations('Status');
  const [draft, setDraft] = useState(initial);
  const [aliasesText, setAliasesText] = useState(initial.aliases.join(', '));
  const [state, action, pending] = useActionState(saveAppAction, {});
  function update<K extends keyof AdminDraft>(key: K, value: AdminDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  function evidence(index: number, patch: Partial<AdminEvidence>) {
    setDraft((current) => ({
      ...current,
      evidence: current.evidence.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  }
  const field = (key: TextField, maxLength: number, required = false) => (
    <div key={key} className="block space-y-2 text-sm">
      <Input
        label={t(`fields.${key}`)}
        value={draft[key]}
        onChange={(event) => update(key, event.target.value)}
        maxLength={maxLength}
        required={required}
        readOnly={key === 'app_store_id' && Boolean(draft.id)}
        pattern={
          key === 'app_store_id'
            ? '[1-9][0-9]*'
            : key === 'slug'
              ? '[a-z0-9]+(-[a-z0-9]+)*'
              : undefined
        }
        onInvalid={(event) =>
          event.currentTarget.setCustomValidity(
            t(
              key === 'app_store_id' || key === 'slug'
                ? `fieldErrors.${key}`
                : 'fieldErrors.required',
            ),
          )
        }
        onInput={(event) => event.currentTarget.setCustomValidity('')}
      />
    </div>
  );
  return (
    <form action={action} className="mt-8 space-y-6">
      <input type="hidden" name="payload" value={JSON.stringify(draft)} />
      <Card padding={5}>
        <fieldset className="space-y-5">
          <legend className="px-2 text-lg font-semibold">{t('basic')}</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            {field('name', 200, true)}
            {field('developer', 200, true)}
            {field('app_store_id', 20, true)}
            {field('slug', 150, true)}
            <div className="space-y-2 text-sm">
              <Select
                label={t('fields.category')}
                value={draft.category}
                onChange={(value) => update('category', value as AdminDraft['category'])}
                options={[
                  { value: '', label: t('unclassified') },
                  ...categories.map((value) => ({ value: value, label: c(value) })),
                ]}
              />
            </div>
            <div className="space-y-2 text-sm">
              <Select
                label={t('fields.original_locale')}
                value={draft.original_locale}
                onChange={(value) =>
                  update('original_locale', value as AdminDraft['original_locale'])
                }
                options={[
                  ...locales.map((value) => ({ value: value, label: t(`languages.${value}`) })),
                ]}
              />
            </div>
          </div>
          <div className="block space-y-2 text-sm">
            <Input
              label={t('fields.aliases')}
              value={aliasesText}
              onChange={(event) => {
                setAliasesText(event.target.value);
                update(
                  'aliases',
                  event.target.value
                    .split(',')
                    .map((value) => value.trim())
                    .filter(Boolean),
                );
              }}
            />
            <span className="block text-muted-foreground">{t('aliasesHint')}</span>
          </div>
        </fieldset>
      </Card>
      <Card padding={5}>
        <fieldset className="space-y-5">
          <legend className="px-2 text-lg font-semibold">{t('translations')}</legend>
          <div className="grid gap-6 md:grid-cols-2">
            {locales.map((locale) => {
              const value = draft.translations[locale] ?? {
                name: '',
                summary: '',
                state: 'current' as const,
              };
              const change = (patch: Partial<typeof value>) =>
                update('translations', { ...draft.translations, [locale]: { ...value, ...patch } });
              return (
                <section key={locale} className="space-y-4">
                  <h2 className="font-semibold">{t(`languages.${locale}`)}</h2>
                  <div className="block space-y-2 text-sm">
                    <Input
                      label={t('fields.translatedName')}
                      value={value.name}
                      onChange={(event) => change({ name: event.target.value })}
                      maxLength={200}
                    />
                  </div>
                  <div className="block space-y-2 text-sm">
                    <TextArea
                      label={t('fields.summary')}
                      rows={4}
                      value={value.summary}
                      onChange={(event) => change({ summary: event.target.value })}
                      maxLength={4000}
                    />
                  </div>
                  {locale !== draft.original_locale && (
                    <div className="block space-y-2 text-sm">
                      <Select
                        label={t('fields.translationState')}
                        value={value.state}
                        onChange={(next) => change({ state: next as typeof value.state })}
                        options={[
                          { value: 'current', label: t('translationCurrent') },
                          { value: 'needs-review', label: t('translationNeedsReview') },
                        ]}
                      />
                    </div>
                  )}
                </section>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground">{t('translationHint')}</p>
        </fieldset>
      </Card>
      <Card padding={5}>
        <fieldset className="space-y-5">
          <legend className="px-2 text-lg font-semibold">{t('assessment')}</legend>
          <p className="text-sm text-muted-foreground">{t('assessmentHint')}</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 text-sm">
              <Select
                label={t('fields.status')}
                value={draft.status}
                onChange={(value) => update('status', value as AdminDraft['status'])}
                options={[...statuses.map((value) => ({ value: value, label: s(value) }))]}
              />
            </div>
            {field('support_version', 100)}
            {field('current_version', 100)}
          </div>
          <div className="block space-y-2 text-sm">
            <TextArea
              label={t('fields.investigation_reason')}
              rows={3}
              value={draft.investigation_reason}
              onChange={(event) => update('investigation_reason', event.target.value)}
              maxLength={4000}
            />
          </div>
          <div className="block space-y-2 text-sm">
            <TextArea
              label={t('fields.release_notes')}
              rows={3}
              value={draft.release_notes}
              onChange={(event) => update('release_notes', event.target.value)}
              maxLength={20000}
            />
          </div>
        </fieldset>
      </Card>
      <Card padding={5}>
        <fieldset className="space-y-5">
          <legend className="px-2 text-lg font-semibold">{t('evidence')}</legend>
          <p className="text-sm text-muted-foreground">{t('evidenceHint')}</p>
          {draft.evidence.map((item, index) => (
            <section key={index}>
              <Card padding={5} className="space-y-4 ">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">{t('evidenceNumber', { number: index + 1 })}</h2>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      update(
                        'evidence',
                        draft.evidence.filter((_, i) => i !== index),
                      )
                    }
                  >
                    {t('remove')}
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {(['title', 'url', 'support_version'] as const).map((key) => (
                    <div key={key} className="space-y-2 text-sm">
                      <Input
                        label={t(`fields.${key}`)}
                        type={key === 'url' ? 'url' : 'text'}
                        value={item[key]}
                        onChange={(event) => evidence(index, { [key]: event.target.value })}
                        required={key === 'title' || key === 'url'}
                      />
                    </div>
                  ))}
                  <DateInput
                    label={t('fields.announced_at')}
                    value={
                      (item.announced_at || undefined) as ComponentProps<typeof DateInput>['value']
                    }
                    onChange={(value) => evidence(index, { announced_at: value ?? '' })}
                    presentation="adaptive-bottom-sheet"
                    size="lg"
                  />
                </div>
                <div className="block space-y-2 text-sm">
                  <Select
                    label={t('fields.sourceKind')}
                    value={item.kind}
                    onChange={(value) => evidence(index, { kind: value as AdminEvidence['kind'] })}
                    options={[
                      ...(['developer', 'apple', 'app_store'] as const).map((kind) => ({
                        value: kind,
                        label: t(`sourceKinds.${kind}`),
                      })),
                    ]}
                  />
                </div>
                <div className="block space-y-2 text-sm">
                  <TextArea
                    label={t('fields.quote')}
                    rows={4}
                    maxLength={4000}
                    value={item.quote}
                    onChange={(event) => evidence(index, { quote: event.target.value })}
                    required
                  />
                </div>
                <div className="flex min-h-11 items-start gap-3 text-sm">
                  <Checkbox
                    label={t('officialConfirmation')}
                    checked={item.official_confirmed}
                    onChange={(event) =>
                      evidence(index, { official_confirmed: event.target.checked })
                    }
                  />
                </div>
                {item.features.map((feature, f) => {
                  const patch = (change: Partial<typeof feature>) =>
                    evidence(index, {
                      features: item.features.map((value, i) =>
                        i === f ? { ...value, ...change } : value,
                      ),
                    });
                  return (
                    <Card padding={5} key={f} className="space-y-3 ">
                      <div className="block space-y-2 text-sm">
                        <Select
                          label={t('fields.feature')}
                          value={feature.key}
                          onChange={(value) => patch({ key: value })}
                          options={[
                            ...['wide-layout', 'fold-posture', 'screen-transition'].map((key) => ({
                              value: key,
                              label: t(`features.${key}`),
                            })),
                          ]}
                        />
                      </div>
                      <div className="block space-y-2 text-sm">
                        <Input
                          label={t('fields.featureDescription')}
                          value={feature.description}
                          maxLength={1000}
                          required
                          onChange={(event) => patch({ description: event.target.value })}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          evidence(index, { features: item.features.filter((_, i) => i !== f) })
                        }
                      >
                        {t('removeFeature')}
                      </Button>
                    </Card>
                  );
                })}
                <Button
                  type="button"
                  variant="outline"
                  disabled={item.features.length >= 20}
                  onClick={() =>
                    evidence(index, {
                      features: [...item.features, { key: 'wide-layout', description: '' }],
                    })
                  }
                >
                  {t('addFeature')}
                </Button>
              </Card>
            </section>
          ))}
          <Button
            type="button"
            variant="outline"
            disabled={draft.evidence.length >= 50}
            onClick={() => update('evidence', [...draft.evidence, newEvidence()])}
          >
            {t('addEvidence')}
          </Button>
        </fieldset>
      </Card>
      {state.error && (
        <Banner role="alert" status="error" title={<>{t(`errors.${state.error}`)}</>} />
      )}
      <Button type="submit" disabled={pending}>
        {t(pending ? 'working' : 'saveDraft')}
      </Button>
    </form>
  );
}

export function ReviewForm({ app }: { app: AdminDraft & { id: string; revision: number } }) {
  const t = useTranslations('Admin');
  const [state, action, pending] = useActionState(reviewAppAction, {});
  return (
    <Card padding={5} className="mt-10">
      <form action={action} className="space-y-5">
        <h2 className="text-xl font-semibold">{t('reviewTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('reviewHint')}</p>
        <input type="hidden" name="id" value={app.id} />
        <input type="hidden" name="revision" value={app.revision} />
        <div className="block space-y-2 text-sm">
          <Select
            label={t('fields.action')}
            name="action"
            options={[
              { value: 'publish', label: t('publish') },
              { value: 'archive', label: t('archive') },
            ]}
          />
        </div>
        <div className="block space-y-2 text-sm">
          <TextArea
            label={t('fields.changeReason')}
            name="reason"
            rows={3}
            maxLength={4000}
            required
          />
        </div>
        <div className="flex min-h-11 items-start gap-3 text-sm">
          <Checkbox label={t('reviewConfirmation')} name="confirmed" required />
        </div>
        {state.error && (
          <Banner role="alert" status="error" title={<>{t(`errors.${state.error}`)}</>} />
        )}
        <Button type="submit" disabled={pending}>
          {t(pending ? 'working' : 'applyReview')}
        </Button>
      </form>
    </Card>
  );
}
