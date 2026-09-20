import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

const ICON_COLOR = { light: '#5B6363', dark: '#9AA3A3' };

type PasswordInputProps = Omit<TextInputProps, 'secureTextEntry'> & {
  accessibilityLabel: string;
};

export function PasswordInput({ accessibilityLabel, onFocus, onBlur, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { colorScheme } = useColorScheme();
  const iconColor = ICON_COLOR[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View
      className={`flex-row items-center rounded-sm border bg-surface pr-3 ${
        isFocused ? 'border-primary' : 'border-border'
      }`}>
      <TextInput
        {...props}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={props.placeholderTextColor ?? '#8B9494'}
        accessibilityLabel={accessibilityLabel}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        className="flex-1 rounded-sm px-3 py-2.5 font-body text-[14px] text-text outline-none"
      />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        hitSlop={8}>
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={18} color={iconColor} />
      </Pressable>
    </View>
  );
}
