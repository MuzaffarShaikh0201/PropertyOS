import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ScreenPlaceholder({ title }: { title: string }) {
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="font-display-extrabold text-[17px] text-text">{title}</Text>
        <Text className="mt-1 font-body text-[13px] text-text-muted">Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}
