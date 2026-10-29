'use client';
import { Banner } from '@/components/ui/surfaces';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { loginAction } from '@/app/[locale]/admin/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function LoginForm({ enabled }: { enabled: boolean }) {
  const t = useTranslations('Admin');
  const [state, action, pending] = useActionState(loginAction, {});
  return (
    <form action={action} className="mt-8 space-y-5">
      <div className="block space-y-2">
        <Input
          label={t('email')}
          name="email"
          type="email"
          autoComplete="username"
          required
          disabled={!enabled}
        />
      </div>
      <div className="block space-y-2">
        <Input
          label={t('password')}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={!enabled}
        />
      </div>
      {state.error && (
        <Banner role="alert" status="error" title={<>{t(`errors.${state.error}`)}</>} />
      )}
      <Button type="submit" disabled={!enabled || pending}>
        {t(pending ? 'working' : 'login')}
      </Button>
    </form>
  );
}
