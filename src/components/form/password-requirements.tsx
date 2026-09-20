import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { Text, View } from 'react-native';

// Mirrors the password policy configured in the Supabase dashboard
// (Authentication → Providers → Email → Password Requirements).
export const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { key: 'lower', label: 'A lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { key: 'upper', label: 'An uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { key: 'digit', label: 'A number', test: (value: string) => /\d/.test(value) },
  { key: 'symbol', label: 'A symbol (e.g. ! @ # $)', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const;

export function isPasswordValid(password: string) {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

const ICON_COLOR = {
  met: { light: '#1E7B4D', dark: '#6FD79A' },
  unmet: { light: '#8B9494', dark: '#6B7576' },
};

export function PasswordRequirements({ password }: { password: string }) {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <View className="gap-1">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <View key={rule.key} className="flex-row items-center gap-1.5">
            <Ionicons
              name={met ? 'checkmark-circle' : 'ellipse-outline'}
              size={13}
              color={met ? ICON_COLOR.met[scheme] : ICON_COLOR.unmet[scheme]}
            />
            <Text className={`font-body text-[11.5px] ${met ? 'text-success-fg' : 'text-text-faint'}`}>
              {rule.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
