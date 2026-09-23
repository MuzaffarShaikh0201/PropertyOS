import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContentColumn } from '@/components/layout/content-column';

const MUTED_ICON_COLOR = { light: '#5B6363', dark: '#9AA3A3' };
const PRIMARY_ICON_COLOR = { light: '#1F7A6E', dark: '#3FA396' };

const ITEMS = [
  { href: '/owners', icon: 'people-outline', label: 'Owner Profiles' },
  { href: '/legal-config', icon: 'shield-checkmark-outline', label: 'Legal Config' },
  { href: '/settings', icon: 'settings-outline', label: 'Settings' },
] as const;

export default function MoreScreen() {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-4 py-4">
        <ContentColumn align="start" className="gap-3">
          <Text className="font-display-extrabold text-[17px] text-text">More</Text>

          <View className="rounded-md border border-border bg-surface px-3.5">
            {ITEMS.map((item, index) => (
              <View key={item.href}>
                <Pressable
                  onPress={() => router.push(item.href)}
                  accessibilityRole="button"
                  className="flex-row items-center gap-2.5 py-3">
                  <Ionicons name={item.icon} size={18} color={PRIMARY_ICON_COLOR[scheme]} />
                  <Text className="flex-1 font-body-bold text-[14px] text-text">{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={MUTED_ICON_COLOR[scheme]} />
                </Pressable>
                {index < ITEMS.length - 1 ? <View className="h-px bg-border" /> : null}
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => router.push('/about')}
            accessibilityRole="button"
            className="flex-row items-center gap-2.5 rounded-md border border-border bg-surface px-3.5 py-3">
            <Ionicons name="information-circle-outline" size={18} color={MUTED_ICON_COLOR[scheme]} />
            <Text className="flex-1 font-body-bold text-[14px] text-text-muted">About</Text>
            <Ionicons name="chevron-forward" size={16} color={MUTED_ICON_COLOR[scheme]} />
          </Pressable>
        </ContentColumn>
      </View>
    </SafeAreaView>
  );
}
