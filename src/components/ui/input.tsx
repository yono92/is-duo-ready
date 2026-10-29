'use client';

import { useId, type ComponentProps } from 'react';
import { Field } from '@astryxdesign/core/Field';
import { cn } from '@/lib/utils';

// Native controls preserve FormData, browser validation, file/date/url types,
// and uncontrolled reset semantics used by the server-action forms.
export function Input({
  label,
  isLabelHidden = false,
  id,
  className,
  ...props
}: ComponentProps<'input'> & { label: string; isLabelHidden?: boolean }) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <Field
      label={label}
      isLabelHidden={isLabelHidden}
      inputID={inputId}
      isDisabled={props.disabled}
      className="duo-field"
    >
      <input {...props} id={inputId} className={cn('duo-input', className)} />
    </Field>
  );
}
