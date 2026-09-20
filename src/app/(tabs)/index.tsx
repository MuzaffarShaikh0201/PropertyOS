import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';

export default function DashboardScreen() {
  const { signOut } = useAuth();
  const toast = useToast();

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 items-center justify-center gap-4 px-6">
        <Text className="font-display-extrabold text-[17px] text-text">02 · Dashboard</Text>
        <Text className="font-body text-[13px] text-text-muted">Coming soon</Text>

        {/* Temporary — remove once a real sign-out entry point exists (e.g. Settings). */}
        <Pressable
          onPress={async () => {
            await signOut();
            toast.info('Logged out.');
          }}
          accessibilityRole="button"
          className="mt-4 rounded-sm border border-border-strong bg-surface px-4 py-2.5 active:bg-surface-2">
          <Text className="font-body-bold text-[13px] text-danger-fg">Log out (test)</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
