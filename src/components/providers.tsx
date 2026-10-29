'use client';

import { useSyncExternalStore } from 'react';
import { ThemeProvider, useTheme } from 'next-themes';
import { useLocale, useTranslations } from 'next-intl';
import { Theme } from '@astryxdesign/core/theme';
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
  return (
    <InternationalizationProvider
      locale={locale}
      overrides={{
        [locale]: {
          '@astryx.button.loading': t('loading'),
        },
      }}
    >
      <Theme
        theme={neutralTheme}
        mode={mounted && (theme === 'dark' || theme === 'light') ? theme : 'system'}
      >
        {children}
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
