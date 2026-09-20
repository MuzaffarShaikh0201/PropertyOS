import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

type ScreenHeaderProps = {
  title: string;
  mode?: 'back' | 'close';
  onLeadingPress?: () => void;
  trailing?: ReactNode;
};

export function ScreenHeader({ title, mode = 'back', onLeadingPress, trailing }: ScreenHeaderProps) {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#EDEFEF' : '#1B2020';

  return (
    <View className="flex-row items-center gap-2.5 border-b border-border bg-surface px-4 py-3.5">
      <Pressable
        onPress={onLeadingPress ?? (() => router.back())}
        accessibilityRole="button"
        accessibilityLabel={mode === 'close' ? 'Close' : 'Back'}
        className="h-8 w-8 items-center justify-center rounded-sm border border-border bg-surface active:bg-surface-2">
        <Ionicons name={mode === 'close' ? 'close' : 'chevron-back'} size={18} color={iconColor} />
      </Pressable>
      <Text className="flex-1 font-display-extrabold text-[17px] text-text" numberOfLines={1}>
        {title}
      </Text>
      {trailing}
    </View>
  );
}
