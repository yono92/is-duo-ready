'use client';
import { Banner } from '@/components/ui/surfaces';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { operationAction, type OperationState } from '@/app/[locale]/admin/operations-actions';
import { Button } from '@/components/ui/button';

export function OperationForm({
  fields,
  label,
  children,
  disabled = false,
  onComplete,
}: {
  fields: Record<string, string | number>;
  label: string;
  children?: React.ReactNode;
  disabled?: boolean;
  onComplete?: () => Promise<void>;
}) {
  const t = useTranslations('Operations');
  const [state, action, pending] = useActionState(
    onComplete
      ? async (previous: OperationState, data: FormData) => {
          const result = await operationAction(previous, data);
          // A failed collection can still change its run/failure records.
          await onComplete();
          return result;
        }
      : operationAction,
    {},
  );
  return (
    <form action={action} className="space-y-4">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {children}
      {state.error && (
        <Banner role="alert" status="error" title={<>{t(`errors.${state.error}`)}</>} />
      )}
      {state.success && (
        <p role="status" className="text-sm">
          {t(`results.${state.success}`)}
        </p>
      )}
      <Button type="submit" disabled={disabled || pending}>
        {pending ? t('working') : label}
      </Button>
    </form>
  );
}
