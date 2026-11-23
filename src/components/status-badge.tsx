import { Check, Clock3, CircleHelp, Contrast } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { publicSupportStatus, type SupportStatus } from '@/lib/directory/types';
const icons = { supported: Check, partial: Contrast, planned: Clock3, unknown: CircleHelp };
export function StatusBadge({
  status: storedStatus,
  fictional = true,
}: {
  status: SupportStatus;
  fictional?: boolean;
}) {
  const t = useTranslations('Status');
  const d = useTranslations('Directory');
  const status = publicSupportStatus(storedStatus);
  const Icon = icons[status];
  return (
    <Badge
      variant={
        (
          {
            supported: 'success',
            partial: 'teal',
            planned: 'info',
            unknown: 'neutral',
          } as const
        )[status]
      }
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
