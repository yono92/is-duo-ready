import { Check, Clock3, CircleHelp, Minus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { SupportStatus } from '@/lib/directory/types';
const icons = { supported: Check, planned: Clock3, unknown: CircleHelp, unsupported: Minus };
export function StatusBadge({
  status,
  fictional = true,
}: {
  status: SupportStatus;
  fictional?: boolean;
}) {
  const t = useTranslations('Status');
  const d = useTranslations('Directory');
  const Icon = icons[status];
  return (
    <Badge
      className={`status-badge status-${status}`}
      icon={<Icon size={13} aria-hidden="true" />}
      label={
        <>
          {t(status)}
          {fictional && <span> · {d('sample')}</span>}
        </>
      }
    />
  );
}
