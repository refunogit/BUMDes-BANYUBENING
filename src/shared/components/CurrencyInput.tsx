import { forwardRef, useEffect, useState } from 'react';
import { TextInput, type TextInputProps } from 'react-native';

import { CustomTextField } from './CustomTextField';
import { formatPlain, parseNumber } from '@/core/utils/currency';

type Props = Omit<TextInputProps, 'value' | 'onChangeText' | 'onChange'> & {
  label?: string;
  value: number | null;
  onChange: (value: number) => void;
  error?: string | null;
  required?: boolean;
  prefix?: string;
};

/** Rupiah input with live thousand separators ("10.000"). */
export const CurrencyInput = forwardRef<TextInput, Props>(function CurrencyInput(
  { label, value, onChange, error, required, prefix = 'Rp ', ...rest },
  ref,
) {
  const [text, setText] = useState(value ? formatPlain(value) : '');

  useEffect(() => {
    const parsed = text === '' ? 0 : parseNumber(text);
    if (!Number.isFinite(parsed) || parsed !== (value ?? 0)) {
      setText(value ? formatPlain(value) : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <CustomTextField
      ref={ref}
      label={label}
      required={required}
      error={error}
      prefix={prefix}
      keyboardType="number-pad"
      value={text}
      onChangeText={(next) => {
        const digits = next.replace(/[^\d]/g, '');
        const numeric = digits ? Number(digits) : 0;
        setText(digits ? formatPlain(numeric) : '');
        onChange(Number.isFinite(numeric) ? numeric : 0);
      }}
      {...rest}
    />
  );
});
