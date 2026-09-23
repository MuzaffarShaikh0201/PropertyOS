import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoMark } from '@/components/brand/logo-mark';
import { ContentColumn } from '@/components/layout/content-column';
import { ScreenHeader } from '@/components/nav/screen-header';

const MUTED_ICON_COLOR = { light: '#5B6363', dark: '#9AA3A3' };

export default function AboutScreen() {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScreenHeader title="About" />
      <View className="flex-1 px-4 py-6">
        <ContentColumn className="gap-4">
          <View className="items-center gap-2">
            <LogoMark size={48} />
            <Text className="font-display-extrabold text-[15px] text-text">PropertyOS</Text>
            <Text className="font-body text-[12px] text-text-muted">Version {version}</Text>
          </View>

          <View className="rounded-md border border-border bg-surface px-3.5">
            <Pressable
              onPress={() => router.push('/terms')}
              accessibilityRole="button"
              className="flex-row items-center gap-2.5 py-3">
              <Text className="flex-1 font-body-bold text-[14px] text-text">Terms of Service</Text>
              <Ionicons name="chevron-forward" size={16} color={MUTED_ICON_COLOR[scheme]} />
            </Pressable>
            <View className="h-px bg-border" />
            <Pressable
              onPress={() => router.push('/privacy')}
              accessibilityRole="button"
              className="flex-row items-center gap-2.5 py-3">
              <Text className="flex-1 font-body-bold text-[14px] text-text">Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={16} color={MUTED_ICON_COLOR[scheme]} />
            </Pressable>
          </View>

          <Text className="text-center font-body text-[11px] text-text-faint">
            Personal property management for Maharashtra rental law.
          </Text>
        </ContentColumn>
      </View>
    </SafeAreaView>
  );
}
