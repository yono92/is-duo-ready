'use client';
import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { saveAppAction, reviewAppAction } from '@/app/[locale]/admin/actions';
import { type AdminDraft, type AdminEvidence } from '@/lib/admin/input';
import { categories, locales, statuses } from '@/lib/directory/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const control =
  'min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';
const section = 'space-y-5 rounded-[18px] border bg-card p-5 sm:p-6';
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
      <fieldset className={section}>
        <legend className="px-2 text-lg font-semibold">{t('basic')}</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          {field('name', 200, true)}
          {field('developer', 200, true)}
          {field('app_store_id', 20, true)}
          {field('slug', 150, true)}
          <label className="space-y-2 text-sm">
            <span>{t('fields.category')}</span>
            <select
              className={control}
              value={draft.category}
              onChange={(event) => update('category', event.target.value as AdminDraft['category'])}
            >
              <option value="">{t('unclassified')}</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {c(value)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span>{t('fields.original_locale')}</span>
            <select
              className={control}
              value={draft.original_locale}
              onChange={(event) =>
                update('original_locale', event.target.value as AdminDraft['original_locale'])
              }
            >
              {locales.map((value) => (
                <option key={value} value={value}>
                  {t(`languages.${value}`)}
                </option>
              ))}
            </select>
          </label>
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
      <fieldset className={section}>
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
                <label className="block space-y-2 text-sm">
                  <span>{t('fields.summary')}</span>
                  <textarea
                    className={control}
                    rows={4}
                    value={value.summary}
                    onChange={(event) => change({ summary: event.target.value })}
                    maxLength={4000}
                  />
                </label>
                {locale !== draft.original_locale && (
                  <label className="block space-y-2 text-sm">
                    <span>{t('fields.translationState')}</span>
                    <select
                      className={control}
                      value={value.state}
                      onChange={(event) =>
                        change({ state: event.target.value as typeof value.state })
                      }
                    >
                      <option value="current">{t('translationCurrent')}</option>
                      <option value="needs-review">{t('translationNeedsReview')}</option>
                    </select>
                  </label>
                )}
              </section>
            );
          })}
        </div>
        <p className="text-sm text-muted-foreground">{t('translationHint')}</p>
      </fieldset>
      <fieldset className={section}>
        <legend className="px-2 text-lg font-semibold">{t('assessment')}</legend>
        <p className="text-sm text-muted-foreground">{t('assessmentHint')}</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span>{t('fields.status')}</span>
            <select
              className={control}
              value={draft.status}
              onChange={(event) => update('status', event.target.value as AdminDraft['status'])}
            >
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {s(value)}
                </option>
              ))}
            </select>
          </label>
          {field('support_version', 100)}
          {field('current_version', 100)}
        </div>
        <label className="block space-y-2 text-sm">
          <span>{t('fields.investigation_reason')}</span>
          <textarea
            className={control}
            rows={3}
            value={draft.investigation_reason}
            onChange={(event) => update('investigation_reason', event.target.value)}
            maxLength={4000}
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span>{t('fields.release_notes')}</span>
          <textarea
            className={control}
            rows={3}
            value={draft.release_notes}
            onChange={(event) => update('release_notes', event.target.value)}
            maxLength={20000}
          />
        </label>
      </fieldset>
      <fieldset className={section}>
        <legend className="px-2 text-lg font-semibold">{t('evidence')}</legend>
        <p className="text-sm text-muted-foreground">{t('evidenceHint')}</p>
        {draft.evidence.map((item, index) => (
          <section key={index} className="space-y-4 rounded-xl border p-4">
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
              {(['title', 'url', 'announced_at', 'support_version'] as const).map((key) => (
                <div key={key} className="space-y-2 text-sm">
                  <Input
                    label={t(`fields.${key}`)}
                    type={key === 'announced_at' ? 'date' : key === 'url' ? 'url' : 'text'}
                    value={item[key]}
                    onChange={(event) => evidence(index, { [key]: event.target.value })}
                    required={key === 'title' || key === 'url'}
                  />
                </div>
              ))}
            </div>
            <label className="block space-y-2 text-sm">
              <span>{t('fields.sourceKind')}</span>
              <select
                className={control}
                value={item.kind}
                onChange={(event) =>
                  evidence(index, { kind: event.target.value as AdminEvidence['kind'] })
                }
              >
                {(['developer', 'apple', 'app_store'] as const).map((kind) => (
                  <option key={kind} value={kind}>
                    {t(`sourceKinds.${kind}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2 text-sm">
              <span>{t('fields.quote')}</span>
              <textarea
                className={control}
                rows={4}
                maxLength={4000}
                value={item.quote}
                onChange={(event) => evidence(index, { quote: event.target.value })}
                required
              />
            </label>
            <label className="flex min-h-11 items-start gap-3 text-sm">
              <input
                className="mt-1 size-5 shrink-0"
                type="checkbox"
                checked={item.official_confirmed}
                onChange={(event) => evidence(index, { official_confirmed: event.target.checked })}
              />
              <span>{t('officialConfirmation')}</span>
            </label>
            {item.features.map((feature, f) => {
              const patch = (change: Partial<typeof feature>) =>
                evidence(index, {
                  features: item.features.map((value, i) =>
                    i === f ? { ...value, ...change } : value,
                  ),
                });
              return (
                <div key={f} className="space-y-3 rounded-xl bg-muted p-4">
                  <label className="block space-y-2 text-sm">
                    <span>{t('fields.feature')}</span>
                    <select
                      className={control}
                      value={feature.key}
                      onChange={(event) => patch({ key: event.target.value })}
                    >
                      {['wide-layout', 'fold-posture', 'screen-transition'].map((key) => (
                        <option key={key} value={key}>
                          {t(`features.${key}`)}
                        </option>
                      ))}
                    </select>
                  </label>
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
                </div>
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
      {state.error && (
        <p role="alert" className="rounded-xl border p-4 text-sm text-destructive">
          {t(`errors.${state.error}`)}
        </p>
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
    <form action={action} className={`${section} mt-10`}>
      <h2 className="text-xl font-semibold">{t('reviewTitle')}</h2>
      <p className="text-sm text-muted-foreground">{t('reviewHint')}</p>
      <input type="hidden" name="id" value={app.id} />
      <input type="hidden" name="revision" value={app.revision} />
      <label className="block space-y-2 text-sm">
        <span>{t('fields.action')}</span>
        <select className={control} name="action">
          <option value="publish">{t('publish')}</option>
          <option value="archive">{t('archive')}</option>
        </select>
      </label>
      <label className="block space-y-2 text-sm">
        <span>{t('fields.changeReason')}</span>
        <textarea className={control} name="reason" rows={3} maxLength={4000} required />
      </label>
      <label className="flex min-h-11 items-start gap-3 text-sm">
        <input className="mt-1 size-5 shrink-0" type="checkbox" name="confirmed" required />
        <span>{t('reviewConfirmation')}</span>
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {t(pending ? 'working' : 'applyReview')}
      </Button>
    </form>
  );
}
