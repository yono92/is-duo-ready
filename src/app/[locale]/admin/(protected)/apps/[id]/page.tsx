import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { Locale } from '@/lib/directory/types';
import { getAdminApp } from '@/lib/admin/repository';
import { uuid } from '@/lib/admin/input';
import { EditForm, ReviewForm } from '@/components/admin/edit-form';
import { getImportProposals } from '@/lib/import/repository';
import { AppIcon } from '@/components/app-icon';
import { AppStoreBadge } from '@/components/app-store-badge';
export default async function EditApp({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; reviewed?: string }>;
}) {
  const actor = await requireAdmin((await getLocale()) as Locale);
  const { id } = await params;
  try {
    uuid(id);
  } catch {
    notFound();
  }
  const app = await getAdminApp(actor, id);
  if (!app || !app.id || !app.revision) notFound();
  const t = await getTranslations('Admin');
  const ti = await getTranslations('Import');
  const status = await getTranslations('Status');
  const proposals = await getImportProposals(actor, id);
  const query = await searchParams;
  return (
    <section>
      <div className="flex items-center gap-3">
        <AppIcon name="box" src={app.icon_url} />
        <h1 className="text-3xl font-semibold">{app.name}</h1>
      </div>
      {app.icon_url && (
        <div className="-ml-2.5 mt-2">
          <AppStoreBadge
            url={`https://apps.apple.com/kr/app/id${app.app_store_id}`}
            name={app.name}
          />
        </div>
      )}
      <p className="mt-3 text-sm text-muted-foreground">{t(`publication.${app.publication}`)}</p>
      {(query.saved || query.reviewed) && (
        <p role="status" className="mt-5 rounded-xl bg-muted p-4">
          {t(query.reviewed ? 'reviewed' : 'saved')}
        </p>
      )}
      <EditForm key={`${app.id}-${app.revision}`} initial={app} />
      {!!proposals.length && (
        <section className="my-8 space-y-4" aria-labelledby="import-proposals">
          <h2 id="import-proposals" className="text-xl font-semibold">
            {ti('proposals')}
          </h2>
          <p className="text-sm text-muted-foreground">{ti('proposalHelp')}</p>
          {proposals.map(({ id, proposal }) => (
            <article key={id} className="space-y-2 rounded-xl border p-4 text-sm">
              {proposal.source_url && (
                <a
                  className="break-all text-primary"
                  href={proposal.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {proposal.source_url}
                </a>
              )}
              {proposal.proposed_status && (
                <p>
                  {ti('proposedStatus')}: {status(proposal.proposed_status)}
                </p>
              )}
              {proposal.evidence_summary && (
                <p className="whitespace-pre-wrap break-words">{proposal.evidence_summary}</p>
              )}
              {proposal.announced_at && (
                <p>
                  {t('fields.announced_at')}: {proposal.announced_at}
                </p>
              )}
              {proposal.support_version && (
                <p>
                  {t('fields.support_version')}: {proposal.support_version}
                </p>
              )}
            </article>
          ))}
        </section>
      )}
      <ReviewForm
        key={`review-${app.revision}`}
        app={{ ...app, id: app.id, revision: app.revision }}
      />
    </section>
  );
}
