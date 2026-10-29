'use client';

import { type ComponentProps } from 'react';
import { TextInput } from '@astryxdesign/core/TextInput';
import { useFormValue } from './form-value';

type Props = Omit<ComponentProps<'input'>, 'type' | 'value' | 'defaultValue' | 'size' | 'ref'> & {
  label: string;
  isLabelHidden?: boolean;
  type?: 'text' | 'search' | 'url' | 'email' | 'password';
  value?: string;
  defaultValue?: string;
  startIcon?: ComponentProps<typeof TextInput>['startIcon'];
};

export function Input({
  label,
  isLabelHidden,
  type = 'text',
  name,
  value,
  defaultValue = '',
  onChange,
  disabled,
  readOnly,
  required,
  className,
  autoFocus,
  ...props
}: Props) {
  const {
    value: fieldValue,
    setValue,
    ref,
  } = useFormValue<string, HTMLInputElement>(value, defaultValue);
  return (
    <TextInput
      {...props}
      ref={ref}
      label={label}
      isLabelHidden={isLabelHidden}
      type={type === 'search' || type === 'url' ? 'text' : type}
      role={type === 'search' ? 'searchbox' : undefined}
      {...{
        inputMode: type === 'url' ? ('url' as const) : props.inputMode,
        pattern: props.pattern ?? (type === 'url' ? 'https?://.+' : undefined),
        required,
      }}
      htmlName={name}
      value={fieldValue}
      onChange={(next, event) => {
        setValue(next);
        onChange?.(event);
      }}
      isDisabled={disabled}
      isReadOnly={readOnly}
      isRequired={required}
      hasAutoFocus={autoFocus}
      containerClassName={className}
      size="lg"
    />
  );
}
