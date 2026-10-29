'use client';

import { type ComponentProps } from 'react';
import { Selector, type SelectorOptionType } from '@astryxdesign/core/Selector';
import { TextArea as AstryxTextArea } from '@astryxdesign/core/TextArea';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { useFormValue } from './form-value';
export { DateInput } from '@astryxdesign/core/DateInput';
export { FileInput } from '@astryxdesign/core/FileInput';

export function Select({
  label,
  options,
  value,
  defaultValue,
  onChange,
  name,
  disabled,
  required,
  ...props
}: {
  label: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  isLabelHidden?: boolean;
}) {
  const {
    value: fieldValue,
    setValue,
    ref,
  } = useFormValue<string, HTMLButtonElement>(value, defaultValue ?? options[0]?.value ?? '');
  return (
    <Selector
      {...props}
      ref={ref}
      label={label}
      options={options satisfies SelectorOptionType[]}
      htmlName={name}
      value={fieldValue}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      isDisabled={disabled}
      isRequired={required}
      size="lg"
    />
  );
}

export function TextArea({
  label,
  value,
  defaultValue = '',
  onChange,
  name,
  disabled,
  required,
  readOnly,
  className,
  ...props
}: Omit<ComponentProps<'textarea'>, 'value' | 'defaultValue' | 'ref'> & {
  label: string;
  value?: string;
  defaultValue?: string;
}) {
  const {
    value: fieldValue,
    setValue,
    ref,
  } = useFormValue<string, HTMLTextAreaElement>(value, defaultValue);
  return (
    <AstryxTextArea
      {...props}
      ref={ref}
      label={label}
      value={fieldValue}
      onChange={(next, event) => {
        setValue(next);
        onChange?.(event);
      }}
      htmlName={name}
      isDisabled={disabled}
      isRequired={required}
      {...{ required }}
      isReadOnly={readOnly}
      containerClassName={className}
    />
  );
}

export function Checkbox({
  label,
  checked,
  defaultChecked = false,
  onChange,
  name,
  disabled,
  required,
  ...props
}: Pick<
  ComponentProps<'input'>,
  'checked' | 'defaultChecked' | 'onChange' | 'name' | 'disabled' | 'required' | 'id'
> & { label: string }) {
  const {
    value: fieldValue,
    setValue,
    ref,
  } = useFormValue<boolean, HTMLInputElement>(checked, defaultChecked);
  return (
    <CheckboxInput
      {...props}
      ref={ref}
      label={label}
      value={fieldValue}
      onChange={(next, event) => {
        setValue(next);
        onChange?.(event);
      }}
      htmlName={name}
      isDisabled={disabled}
      isRequired={required}
    />
  );
}
