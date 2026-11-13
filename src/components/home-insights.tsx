import { ArrowRight, ArrowUpRight, PanelsTopLeft } from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';
import { Link } from '@/components/ui/link';
import { Card, Collapsible } from '@/components/ui/surfaces';
import type { Locale, PublicHistory } from '@/lib/directory/types';
import styles from './home-insights.module.css';

const layouts = ['centered', 'expanded', 'full'] as const;

export async function HomeInsights({ items, locale }: { items: PublicHistory[]; locale: Locale }) {
  const [t, updates, status, format] = await Promise.all([
    getTranslations('HomeInsights'),
    getTranslations('Updates'),
    getTranslations('Status'),
    getFormatter(),
  ]);

  return (
    <div className={styles.insights}>
      <section aria-label={t('guideTitle')}>
        <Card padding={5}>
          <Collapsible
            defaultIsOpen={false}
            trigger={
              <span className={styles.guideTrigger}>
                <PanelsTopLeft size={20} aria-hidden="true" />
                <span>
                  <span className={styles.guideTitle}>{t('guideTitle')}</span>
                  <span className={styles.guideSubtitle}>{t('guideSubtitle')}</span>
                </span>
              </span>
            }
          >
            <div className={styles.layouts}>
              {layouts.map((layout) => (
                <figure className={styles.layout} key={layout}>
                  <div className={styles.device} data-layout={layout} aria-hidden="true">
                    <div className={styles.app}>
                      <span className={styles.appTitle} />
                      <span className={styles.appLine} />
                      <span className={styles.appLine} />
                      <span className={styles.appTile} />
                    </div>
                    <span className={styles.statusBar} />
                    {layout === 'full' && (
                      <span className={styles.toolbar}>
                        <i />
                        <i />
                        <i />
                      </span>
                    )}
                  </div>
                  <figcaption>
                    <h3 className={styles.layoutTitle}>{t(`${layout}Title`)}</h3>
                    <p className={styles.sdk}>{t(`${layout}Sdk`)}</p>
                    <p className={styles.layoutDescription}>{t(`${layout}Description`)}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className={styles.guideFooter}>
              <p>{t('guideNote')}</p>
              <Link
                href="https://developer.apple.com/iphone-duo/prepare/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.sourceLink}
              >
                <span className={styles.linkContent}>
                  {t('guideSource')}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </span>
              </Link>
            </div>
          </Collapsible>
        </Card>
      </section>

      {items.length > 0 && (
        <section aria-labelledby="home-updates-heading">
          <div className={styles.updatesHeading}>
            <h2 id="home-updates-heading" className={styles.heading}>
              {t('updatesTitle')}
            </h2>
            <Link href="/updates" className={styles.sourceLink}>
              <span className={styles.linkContent}>
                {t('updatesAll')}
                <ArrowRight size={14} aria-hidden="true" />
              </span>
            </Link>
          </div>
          <ol className={styles.updates}>
            {items.slice(0, 4).map((item) => (
              <li key={item.id} className={styles.update}>
                <Link href={`/apps/${item.slug}`} display="block" className={styles.updateLink}>
                  <span className={styles.updateRow}>
                    <span className={styles.updateCopy}>
                      <span className={styles.appName}>{item.names[locale]}</span>
                      <span className={styles.change}>
                        {item.beforeStatus
                          ? item.beforeStatus === item.afterStatus
                            ? updates('corrected', { status: status(item.afterStatus) })
                            : updates('changed', {
                                before: status(item.beforeStatus),
                                after: status(item.afterStatus),
                              })
                          : updates('initial', { status: status(item.afterStatus) })}
                      </span>
                    </span>
                    <time className={styles.date} dateTime={item.changedAt}>
                      {format.dateTime(new Date(item.changedAt), {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </time>
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
