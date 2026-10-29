import { Card, Collapsible } from '@/components/ui/surfaces';
import { Select, TextArea, Checkbox } from '@/components/ui/form-controls';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { requireAdmin } from '@/lib/admin/auth';
import { uuid } from '@/lib/admin/input';
import { getAdminApp } from '@/lib/admin/repository';
import { getReview, matchingSubmissionApp, type Candidate } from '@/lib/operations/repository';
import { OperationForm } from '@/components/operations/operation-form';
import { Link } from '@/components/ui/link';
import type { Locale } from '@/lib/directory/types';

export default async function ReviewDetail({ params }: { params: Promise<{ id: string }> }) {
  const locale = (await getLocale()) as Locale;
  const actor = await requireAdmin(locale);
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Seoul',
    }).format(new Date(value));
  const t = await getTranslations('Operations');
  const a = await getTranslations('Status');
  let id: string;
  try {
    id = uuid((await params).id);
  } catch {
    notFound();
  }
  const item = await getReview(actor, id);
  if (!item) notFound();
  const draft = item.app_id ? await getAdminApp(actor, item.app_id) : null;
  const match =
    !item.app_id && item.submission_id && item.candidate_payload.app_store_id
      ? await matchingSubmissionApp(actor, item.candidate_payload.app_store_id)
      : null;
  const terminal = ['approved', 'rejected'].includes(item.state);
  const candidate = (value: Candidate | null) => (
    <div className="min-w-0 space-y-3 text-sm">
      {!value ? (
        <p>{t('none')}</p>
      ) : (
        <>
          {value.source_url && (
            <Link
              className="block break-all text-primary"
              href={value.source_url}
              target="_blank"
              rel="noreferrer"
            >
              {value.source_url}
            </Link>
          )}
          {value.store_url && value.store_url !== value.source_url && (
            <Link
              className="block break-all text-primary"
              href={value.store_url}
              target="_blank"
              rel="noreferrer"
            >
              {value.store_url}
            </Link>
          )}
          {value.current_version && (
            <p>
              {t('version')}: {value.current_version}
            </p>
          )}
          <p className="break-words whitespace-pre-wrap">
            {value.text ?? value.release_notes ?? t('noText')}
          </p>
          {value.truncated && <p className="text-muted-foreground">{t('truncated')}</p>}
        </>
      )}
    </div>
  );
  return (
    <section className="space-y-7">
      <Link
        className="text-primary"
        href={item.submission_id ? '/admin/submissions' : '/admin/reviews'}
      >
        {t('backQueue')}
      </Link>
      <header>
        <h1 className="mt-4 text-3xl font-semibold">{t('reviewDetail')}</h1>
        <p className="mt-2">
          {item.name ?? t('unlinkedApp')} · {t(`states.${item.state}`)}
        </p>
        <p className="mt-3 text-muted-foreground">{t('compareHelp')}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('receivedAt')}: {date(item.created_at)}
        </p>
      </header>
      <div className="grid gap-5 lg:grid-cols-2">
        <section>
          <Card padding={5} className="min-w-0 space-y-4 ">
            <h2 className="text-xl font-semibold">{t('published')}</h2>
            {item.snapshot ? (
              <>
                <p>{a(item.snapshot.status ?? 'unknown')}</p>
                <p>
                  {t('version')}: {item.snapshot.currentVersion ?? t('none')}
                </p>
                <p>
                  {t('supportVersion')}: {item.snapshot.supportVersion ?? t('none')}
                </p>
                {item.snapshot.reviewedAt && (
                  <p>
                    {t('reviewedAt')}: {date(item.snapshot.reviewedAt)}
                  </p>
                )}
                <p>{item.snapshot.investigationReason}</p>
                {item.snapshot.evidence?.map((e, i) => (
                  <blockquote key={i} className="space-y-2 border-l-2 pl-3">
                    <p className="break-words whitespace-pre-wrap">{e.quote}</p>
                    <Link
                      className="break-all text-primary"
                      href={e.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {e.url}
                    </Link>
                  </blockquote>
                ))}
              </>
            ) : (
              <p>{t('notPublished')}</p>
            )}
          </Card>
        </section>
        <section>
          <Card padding={5} className="min-w-0 space-y-4 ">
            <h2 className="text-xl font-semibold">{t('candidate')}</h2>
            {candidate(item.candidate_payload)}
          </Card>
        </section>
      </div>
      <Card padding={5}>
        <Collapsible defaultIsOpen={false} trigger={<>{t('previousObservation')}</>}>
          {candidate(item.before_payload)}
        </Collapsible>
      </Card>
      {draft && (
        <section>
          <Card padding={5} className="space-y-4 ">
            <h2 className="text-xl font-semibold">{t('savedDraft')}</h2>
            <p>
              {a(draft.status)} · {t('version')}: {draft.current_version || t('none')}
            </p>
            <p className="break-words">{draft.translations[draft.original_locale]?.summary}</p>
            <p className="break-words">{draft.investigation_reason}</p>
            <p>
              {t('supportVersion')}: {draft.support_version || t('none')}
            </p>
            {draft.evidence.map((e, i) => (
              <blockquote key={i} className="space-y-2 border-l-2 pl-3">
                <p className="break-words whitespace-pre-wrap">{e.quote}</p>
                <p className="text-sm text-muted-foreground">
                  {t(e.official_confirmed ? 'officialConfirmed' : 'officialUnconfirmed')}
                </p>
                <Link
                  href={e.url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-primary"
                >
                  {e.url}
                </Link>
              </blockquote>
            ))}
            <Link
              className="inline-flex min-h-11 items-center text-primary"
              href={`/admin/apps/${item.app_id}`}
            >
              {t('editDraft')}
            </Link>
            <p className="text-sm text-muted-foreground">{t('draftHelp')}</p>
          </Card>
        </section>
      )}
      {!item.app_id && !terminal && (
        <section>
          <Card padding={5} className="space-y-4 ">
            <h2 className="text-xl font-semibold">{t('linkApp')}</h2>
            {match ? (
              <OperationForm
                fields={{
                  operation: 'link',
                  id: item.id,
                  revision: item.revision,
                  app_id: match.id,
                }}
                label={t('linkApp')}
              >
                <p>{match.name}</p>
              </OperationForm>
            ) : (
              <>
                <p>{t('importFirst')}</p>
                <Link className="text-primary" href="/admin/apps/import">
                  {t('importApp')}
                </Link>
              </>
            )}
          </Card>
        </section>
      )}
      {item.reason && (
        <section>
          <h2 className="font-semibold">{t('lastReason')}</h2>
          <p className="mt-2 break-words whitespace-pre-wrap">{item.reason}</p>
        </section>
      )}
      {!terminal && (
        <OperationForm
          key={item.revision}
          fields={{
            operation: 'decide',
            id: item.id,
            revision: item.revision,
            app_revision: draft?.revision ?? 0,
          }}
          label={t('saveDecision')}
        >
          <div className="block space-y-2">
            <Select
              label={t('decision')}
              name="decision"
              defaultValue="deferred"
              options={[
                { value: 'deferred', label: t('defer') },
                { value: 'rejected', label: t('reject') },
                { value: 'approved', label: t('approve'), disabled: !draft },
              ]}
            />
          </div>
          <div className="block space-y-2">
            <TextArea label={t('reason')} name="reason" required maxLength={4000} rows={3} />
          </div>
          <div className="flex min-h-11 items-start gap-3">
            <Checkbox label={t('approveConfirm')} name="confirmed" />
          </div>
        </OperationForm>
      )}
    </section>
  );
}
