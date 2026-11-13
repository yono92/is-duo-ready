'use client';

import { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { AppIcon } from '@/components/app-icon';
import { Button } from '@/components/ui/button';
import { Link } from '@/components/ui/link';
import styles from './app-marquee.module.css';

export type AppMarqueeIcon = {
  slug: string;
  icon: string;
  iconUrl?: string | null;
  name: string;
  storeLinkLabel: string;
  storeUrl?: string;
};

export function AppMarquee({
  icons,
  pauseLabel,
  resumeLabel,
}: {
  icons: AppMarqueeIcon[];
  pauseLabel: string;
  resumeLabel: string;
}) {
  const [paused, setPaused] = useState(false);
  if (!icons.length) return null;

  const rows = [icons.filter((_, i) => i % 2 === 0), icons.filter((_, i) => i % 2 === 1)];

  return (
    <div className={styles.marquee} data-paused={paused} data-testid="app-marquee">
      <div className={styles.rows}>
        {rows
          .filter((row) => row.length)
          .map((row, index) => (
            <div className={styles.row} key={index}>
              <div className={styles.track} data-marquee-track>
                {[false, true].map((copy) => (
                  <div
                    className={styles.group}
                    key={String(copy)}
                    data-copy={copy}
                    aria-hidden={copy || undefined}
                  >
                    {row.map((icon) => (
                      <div className={styles.tile} key={icon.slug}>
                        {icon.storeUrl ? (
                          <Link
                            href={icon.storeUrl}
                            aria-label={icon.storeLinkLabel}
                            target="_blank"
                            rel="noopener noreferrer"
                            tabIndex={copy ? -1 : undefined}
                            className={styles.appLink}
                          >
                            <span className={styles.appLinkContent}>
                              <AppIcon name={icon.icon} src={icon.iconUrl} />
                              <span className={styles.name}>{icon.name}</span>
                            </span>
                          </Link>
                        ) : (
                          <div className={styles.fixture} aria-hidden="true">
                            <AppIcon name={icon.icon} />
                            <span className={styles.name}>{icon.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
      <div className={styles.motionControl}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={paused ? resumeLabel : pauseLabel}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
        </Button>
      </div>
    </div>
  );
}
