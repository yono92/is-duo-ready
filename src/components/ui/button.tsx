'use client';

import { Children, type ComponentProps } from 'react';
import { Button as AstryxButton } from '@astryxdesign/core/Button';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
type ButtonProps = ComponentProps<'button'> & {
  variant?: Variant;
  size?: 'default' | 'icon';
};

const variants = {
  default: 'primary',
  outline: 'secondary',
  secondary: 'secondary',
  ghost: 'ghost',
  destructive: 'destructive',
} as const;

export function Button({
  children,
  variant = 'default',
  size = 'default',
  disabled,
  className,
  ...props
}: ButtonProps) {
  const label =
    props['aria-label'] ??
    Children.toArray(children)
      .filter((child) => typeof child === 'string' || typeof child === 'number')
      .join('');
  return (
    <AstryxButton
      {...props}
      label={label}
      variant={variants[variant]}
      isDisabled={disabled}
      className={cn('duo-button', size === 'icon' && 'duo-icon-button', className)}
    >
      {children}
    </AstryxButton>
  );
}

export function ButtonLink({
  href,
  children,
  variant = 'default',
}: {
  href: string;
  children: string;
  variant?: Variant;
}) {
  return (
    <AstryxButton
      as={Link}
      href={href}
      label={children}
      variant={variants[variant]}
      className="duo-button"
    />
  );
}
