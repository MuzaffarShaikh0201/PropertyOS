import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Pressable, Text, View } from 'react-native';

type WizardHeaderProps = {
  title: string;
  step: number;
  totalSteps: number;
  onClose?: () => void;
};

// The New Agreement wizard's shared chrome: a close button, the step title,
// and a segmented progress bar — same treatment across Steps 1-3.
export function WizardHeader({ title, step, totalSteps, onClose }: WizardHeaderProps) {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#EDEFEF' : '#1B2020';

  return (
    <View className="gap-2.5 border-b border-border bg-surface px-4 py-3.5">
      <View className="flex-row items-center gap-2.5">
        <Pressable
          onPress={onClose ?? (() => router.back())}
          accessibilityRole="button"
          accessibilityLabel="Close"
          className="h-8 w-8 items-center justify-center rounded-sm border border-border bg-surface active:bg-surface-2">
          <Ionicons name="close" size={18} color={iconColor} />
        </Pressable>
        <View className="flex-1">
          <Text className="font-body text-[11px] text-text-muted">
            Step {step} of {totalSteps}
          </Text>
          <Text className="font-display-extrabold text-[16px] text-text" numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>
      <View className="flex-row gap-1.5">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View
            key={index}
            className={`h-1.5 flex-1 rounded-pill ${index < step ? 'bg-primary' : 'bg-surface-2'}`}
          />
        ))}
      </View>
    </View>
  );
}
