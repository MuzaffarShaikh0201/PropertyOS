import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import type { ReactNode } from 'react';
import { View } from 'react-native';

export type MessageVariant = 'info' | 'warning' | 'error' | 'success';

const VARIANT_BG: Record<MessageVariant, string> = {
  info: 'bg-info-bg',
  warning: 'bg-warning-bg',
  error: 'bg-danger-bg',
  success: 'bg-success-bg',
};

const VARIANT_ICON: Record<MessageVariant, keyof typeof Ionicons.glyphMap> = {
  info: 'information-circle',
  warning: 'warning',
  error: 'alert-circle',
  success: 'checkmark-circle',
};

export const VARIANT_ICON_COLOR: Record<MessageVariant, { light: string; dark: string }> = {
  info: { light: '#1F7A6E', dark: '#5FC2B2' },
  warning: { light: '#92650A', dark: '#E8B854' },
  error: { light: '#A23B2E', dark: '#F08A75' },
  success: { light: '#1E7B4D', dark: '#6FD79A' },
};

type BannerProps = {
  variant: MessageVariant;
  children: ReactNode;
};

// A contextual, in-form message tied to a specific field or state (e.g. a
// validation nudge). For transient action feedback ("Logged in
// successfully"), use the Toast system instead — see components/ui/toast.tsx.
export function Banner({ variant, children }: BannerProps) {
  const { colorScheme } = useColorScheme();
  const iconColor = VARIANT_ICON_COLOR[variant][colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View className={`flex-row items-start gap-2 rounded-md px-3.5 py-3 ${VARIANT_BG[variant]}`}>
      <Ionicons name={VARIANT_ICON[variant]} size={16} color={iconColor} style={{ marginTop: 1 }} />
      <View className="flex-1 gap-2">{children}</View>
    </View>
  );
}
