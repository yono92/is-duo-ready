'use client';
import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Globe2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@astryxdesign/core/DropdownMenu';
import { getPathname, usePathname } from '@/i18n/navigation';
import { Switch } from '@astryxdesign/core/Switch';
import type { Locale } from '@/lib/directory/types';

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function Preferences() {
  const t = useTranslations('Preferences');
  const locale = useLocale();
  const pathname = usePathname();
  const params = useSearchParams();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const isDark = mounted && resolvedTheme === 'dark';

  function changeLocale(nextLocale: string) {
    // A locale change replaces the document language and all localized content.
    window.location.replace(
      getPathname({
        href: `${pathname}${params.size ? `?${params}` : ''}`,
        locale: nextLocale as Locale,
      }),
    );
  }

  return (
    <div className="preferences-group">
      <DropdownMenu
        alignment="end"
        menuWidth={180}
        hasChevron={false}
        button={{
          label: t('language'),
          icon: <Globe2 size={18} aria-hidden="true" />,
          isIconOnly: true,
          variant: 'ghost',
        }}
      >
        <DropdownMenuRadioGroup label={t('language')} value={locale} onChange={changeLocale}>
          {(['ko', 'en'] as const).map((option) => (
            <DropdownMenuRadioItem
              key={option}
              value={option}
              label={<span lang={option}>{t(option)}</span>}
            />
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenu>
      <Switch
        label={t('darkMode')}
        isLabelHidden
        value={isDark}
        isDisabled={!mounted || !resolvedTheme}
        onChange={(checked) => setTheme(checked ? 'dark' : 'light')}
      />
    </div>
  );
}
