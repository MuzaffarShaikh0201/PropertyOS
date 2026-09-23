import { Text, View } from 'react-native';

import type { MessageVariant } from '@/components/ui/banner';

type ChipVariant = MessageVariant | 'neutral';

const VARIANT_CLASSES: Record<ChipVariant, string> = {
  success: 'bg-success-bg text-success-fg',
  warning: 'bg-warning-bg text-warning-fg',
  error: 'bg-danger-bg text-danger-fg',
  info: 'bg-info-bg text-info-fg',
  // Matches the wireframe convention: "neutral grey" for a resting state
  // (Vacant, a superseded/Ended agreement) that isn't itself a status to act on.
  neutral: 'bg-surface-2 text-text-muted',
};

type ChipProps = {
  variant: ChipVariant;
  children: string;
};

export function Chip({ variant, children }: ChipProps) {
  const [bg, fg] = VARIANT_CLASSES[variant].split(' ');
  return (
    <View className={`rounded-pill px-2.5 py-[3px] ${bg}`}>
      <Text className={`font-body-bold text-[10.5px] ${fg}`}>{children}</Text>
    </View>
  );
}
