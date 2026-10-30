'use client';

import { Children, isValidElement, type ComponentProps } from 'react';
import { Button as AstryxButton } from '@astryxdesign/core/Button';
import { Link } from '@/i18n/navigation';

type Variant = 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
type ButtonProps = ComponentProps<'button'> & {
  variant?: Variant;
  size?: 'default' | 'icon';
  isLoading?: boolean;
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
  isLoading,
  className,
  ...props
}: ButtonProps) {
  const icon = Children.toArray(children).find(isValidElement);
  const label =
    props['aria-label'] ??
    Children.toArray(children)
      .filter((child) => typeof child === 'string' || typeof child === 'number')
      .join('');
  return (
    <AstryxButton
      {...props}
      label={label}
      icon={icon}
      variant={variants[variant]}
      isDisabled={disabled}
      isLoading={isLoading}
      isIconOnly={size === 'icon'}
      size="lg"
      className={className}
    />
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
      as={href.startsWith('#') ? 'a' : Link}
      href={href}
      label={children}
      variant={variants[variant]}
      size="lg"
    />
  );
}
