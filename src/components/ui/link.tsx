'use client';
import { type ComponentProps } from 'react';
import { Link as AstryxLink } from '@astryxdesign/core/Link';
import { Link as LocaleLink } from '@/i18n/navigation';

export function Link({ children, ...props }: Omit<ComponentProps<typeof AstryxLink>, 'as'>) {
  return (
    <AstryxLink {...props} as={LocaleLink}>
      {children}
    </AstryxLink>
  );
}
