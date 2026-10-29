'use client';
import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { operationAction } from '@/app/[locale]/admin/operations-actions';
import { Button } from '@/components/ui/button';

export function OperationForm({
  fields,
  label,
  children,
  disabled = false,
}: {
  fields: Record<string, string | number>;
  label: string;
  children?: React.ReactNode;
  disabled?: boolean;
}) {
  const t = useTranslations('Operations');
  const [state, action, pending] = useActionState(operationAction, {});
  return (
    <form action={action} className="space-y-4">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {children}
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${state.error}`)}
        </p>
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
