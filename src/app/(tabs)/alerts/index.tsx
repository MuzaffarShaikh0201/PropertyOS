import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContentColumn } from '@/components/layout/content-column';
import { addDays, todayIsoDate } from '@/features/agreements/calculations';
import { useMarkNotificationRead, useNotifications } from '@/features/notifications/hooks';
import type { AppNotification, NotificationType } from '@/features/notifications/types';

const PRIMARY_ICON_COLOR = { light: '#1F7A6E', dark: '#3FA396' };

const TYPE_ICON: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  compliance_deadline: 'shield-checkmark-outline',
  legal_update: 'document-text-outline',
  rent_due: 'cash-outline',
  rent_paid: 'checkmark-circle-outline',
  bill_due: 'flash-outline',
  bill_paid: 'checkmark-circle-outline',
};

type Bucket = 'Today' | 'This week' | 'Earlier';

function bucketFor(createdAt: string, today: string, weekAgo: string): Bucket {
  const date = createdAt.slice(0, 10);
  if (date === today) return 'Today';
  if (date >= weekAgo) return 'This week';
  return 'Earlier';
}

function formatTimestamp(createdAt: string, bucket: Bucket): string {
  const date = new Date(createdAt);
  if (bucket === 'Today') {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return createdAt.slice(0, 10);
}

export default function NotificationsScreen() {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';

  const groups = useMemo(() => {
    const today = todayIsoDate();
    const weekAgo = addDays(today, -7);
    const buckets: Record<Bucket, AppNotification[]> = { Today: [], 'This week': [], Earlier: [] };
    (notifications ?? []).forEach((notification) => {
      buckets[bucketFor(notification.createdAt, today, weekAgo)].push(notification);
    });
    return buckets;
  }, [notifications]);

  const handlePress = (notification: AppNotification) => {
    if (!notification.readAt) {
      markRead.mutate(notification.id);
    }
    router.push(notification.route);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-row items-center gap-2.5 border-b border-border bg-surface px-4 py-3.5">
        <Text className="flex-1 font-display-extrabold text-[17px] text-text">Alerts</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1F7A6E" />
        </View>
      ) : !notifications || notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="font-body text-[13px] text-text-muted">No alerts right now.</Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingHorizontal: 16 }}>
          <ContentColumn className="gap-4 py-4">
            {(['Today', 'This week', 'Earlier'] as const).map((bucket) =>
              groups[bucket].length > 0 ? (
                <View key={bucket} className="gap-1.5">
                  <Text className="font-body-bold text-[12px] text-text-muted">{bucket}</Text>
                  <View className="rounded-md border border-border bg-surface px-3.5">
                    {groups[bucket].map((notification, index) => (
                      <View key={notification.id}>
                        <Pressable
                          onPress={() => handlePress(notification)}
                          accessibilityRole="button"
                          className="flex-row items-start gap-2.5 py-3">
                          <View className="h-8 w-8 items-center justify-center rounded-pill bg-surface-2">
                            <Ionicons
                              name={TYPE_ICON[notification.type]}
                              size={16}
                              color={PRIMARY_ICON_COLOR[scheme]}
                            />
                          </View>
                          <View className="flex-1 gap-0.5">
                            <Text className="font-body-bold text-[13px] text-text">{notification.title}</Text>
                            <Text className="font-body text-[12.5px] leading-5 text-text-muted">
                              {notification.message}
                            </Text>
                            <Text className="font-body text-[11px] text-text-faint">
                              {formatTimestamp(notification.createdAt, bucket)}
                            </Text>
                          </View>
                          {!notification.readAt ? (
                            <View className="mt-1.5 h-2 w-2 rounded-pill bg-primary" />
                          ) : null}
                        </Pressable>
                        {index < groups[bucket].length - 1 ? <View className="h-px bg-border" /> : null}
                      </View>
                    ))}
                  </View>
                </View>
              ) : null
            )}
          </ContentColumn>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
