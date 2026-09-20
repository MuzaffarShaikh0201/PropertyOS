import { Text, View } from 'react-native';

import { LogoMark } from './logo-mark';

type LogoLockupProps = {
  markSize?: number;
  textSize?: number;
};

// Composed from the icon mark + our own type tokens (rather than the flattened
// lockup SVG) so the wordmark's color follows text-text and stays legible in
// dark mode, where the source asset's fixed dark fill would not.
export function LogoLockup({ markSize = 32, textSize = 17 }: LogoLockupProps) {
  return (
    <View className="flex-row items-center gap-2.5">
      <LogoMark size={markSize} />
      <Text className="font-display-extrabold text-text" style={{ fontSize: textSize }}>
        PropertyOS
      </Text>
    </View>
  );
}
