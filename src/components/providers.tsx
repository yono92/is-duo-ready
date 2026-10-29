'use client';

import { useSyncExternalStore } from 'react';
import { ThemeProvider, useTheme } from 'next-themes';
import { useLocale, useTranslations } from 'next-intl';
import { Theme } from '@astryxdesign/core/theme';
import koCatalog from '@astryxdesign/core/locales/ko-KR.generated.js';
import { LinkProvider } from '@astryxdesign/core/Link';
import { Link } from '@/i18n/navigation';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { InternationalizationProvider } from '@astryxdesign/core/i18n';

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function AstryxProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const locale = useLocale();
  const t = useTranslations('UI');
  const d = useTranslations('Directory');
  return (
    <InternationalizationProvider
      locale={locale === 'ko' ? 'ko-KR' : 'en'}
      messages={{ 'ko-KR': koCatalog }}
      overrides={{
        [locale === 'ko' ? 'ko-KR' : 'en']: {
          '@astryx.button.loading': t('loading'),
          '@astryx.pagination.previous': d('previous'),
          '@astryx.pagination.next': d('next'),
        },
      }}
    >
      <Theme
        theme={neutralTheme}
        mode={mounted && (theme === 'dark' || theme === 'light') ? theme : 'system'}
      >
        <LinkProvider component={Link}>{children}</LinkProvider>
      </Theme>
    </InternationalizationProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="duo-ready-theme"
      disableTransitionOnChange
    >
      <AstryxProvider>{children}</AstryxProvider>
    </ThemeProvider>
  );
}
