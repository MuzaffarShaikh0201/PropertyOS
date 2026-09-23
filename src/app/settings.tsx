import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContentColumn } from '@/components/layout/content-column';
import { ScreenHeader } from '@/components/nav/screen-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { useThemePreference } from '@/lib/theme-preference';

const MUTED_ICON_COLOR = { light: '#5B6363', dark: '#9AA3A3' };

export default function SettingsScreen() {
  const { preference, setPreference } = useThemePreference();
  const { session, signOut } = useAuth();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const toast = useToast();

  const metadata = session?.user.user_metadata;
  const firstName = typeof metadata?.first_name === 'string' ? metadata.first_name : '';
  const lastName = typeof metadata?.last_name === 'string' ? metadata.last_name : '';
  const displayName = `${firstName} ${lastName}`.trim();

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScreenHeader title="Settings" />
      <View className="flex-1 px-4 py-4">
        <ContentColumn className="gap-6">
          <View className="gap-2">
            <Text className="font-body-bold text-[12px] text-text-muted">Appearance</Text>
            <SegmentedControl
              value={preference}
              onChange={setPreference}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' },
              ]}
            />
          </View>

          <View className="gap-2">
            <Text className="font-body-bold text-[12px] text-text-muted">Account</Text>
            <Pressable
              onPress={() => router.push('/profile')}
              accessibilityRole="button"
              className="flex-row items-center gap-2.5 rounded-md border border-border bg-surface px-3.5 py-3 active:bg-surface-2">
              <View className="flex-1 gap-0.5">
                <Text className="font-body-bold text-[13px] text-text">{displayName || 'Add your name'}</Text>
                <Text className="font-body text-[12px] text-text-muted">{session?.user.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={MUTED_ICON_COLOR[scheme]} />
            </Pressable>
            <Pressable
              onPress={async () => {
                await signOut();
                toast.info('Logged out.');
              }}
              accessibilityRole="button"
              className="items-center rounded-sm border border-border-strong bg-surface px-4 py-2.5 active:bg-surface-2">
              <Text className="font-body-bold text-[13px] text-danger-fg">Log out</Text>
            </Pressable>
          </View>
        </ContentColumn>
      </View>
    </SafeAreaView>
  );
}
