import { forwardRef, useState } from 'react';
import { TextInput, type TextInputProps } from 'react-native';

type TextFieldProps = TextInputProps & {
  accessibilityLabel: string;
};

// Suppresses the browser's default focus outline (`outline-none`) and
// replaces it with our own border-primary treatment, matching the approved
// `.wf-input:focus` style from the wireframe instead of a stray black ring.
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { accessibilityLabel, onFocus, onBlur, ...props },
  ref
) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <TextInput
      {...props}
      ref={ref}
      accessibilityLabel={accessibilityLabel}
      placeholderTextColor={props.placeholderTextColor ?? '#8B9494'}
      onFocus={(event) => {
        setIsFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setIsFocused(false);
        onBlur?.(event);
      }}
      className={`w-full rounded-sm border bg-surface px-3 py-2.5 font-body text-[14px] text-text outline-none ${
        isFocused ? 'border-primary' : 'border-border'
      }`}
    />
  );
});
