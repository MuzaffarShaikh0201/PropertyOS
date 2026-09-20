import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MUTED_ICON_COLOR = { light: '#5B6363', dark: '#9AA3A3' };
const PRIMARY_ICON_COLOR = { light: '#1F7A6E', dark: '#3FA396' };

export default function MoreScreen() {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="gap-3 px-4 py-4">
        <Text className="font-display-extrabold text-[17px] text-text">More</Text>

        <View className="rounded-md border border-border bg-surface px-3.5">
          <Pressable
            onPress={() => router.push('/owners')}
            accessibilityRole="button"
            className="flex-row items-center gap-2.5 py-3">
            <Ionicons name="people-outline" size={18} color={PRIMARY_ICON_COLOR[scheme]} />
            <Text className="flex-1 font-body-bold text-[14px] text-text">Owner Profiles</Text>
            <Ionicons name="chevron-forward" size={16} color={MUTED_ICON_COLOR[scheme]} />
          </Pressable>
          <View className="h-px bg-border" />
          <View className="flex-row items-center gap-2.5 py-3 opacity-50">
            <Ionicons name="shield-checkmark-outline" size={18} color={MUTED_ICON_COLOR[scheme]} />
            <Text className="flex-1 font-body-bold text-[14px] text-text-muted">Legal Config</Text>
            <Text className="font-body text-[11px] text-text-faint">Coming soon</Text>
          </View>
          <View className="h-px bg-border" />
          <View className="flex-row items-center gap-2.5 py-3 opacity-50">
            <Ionicons name="settings-outline" size={18} color={MUTED_ICON_COLOR[scheme]} />
            <Text className="flex-1 font-body-bold text-[14px] text-text-muted">Settings</Text>
            <Text className="font-body text-[11px] text-text-faint">Coming soon</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
