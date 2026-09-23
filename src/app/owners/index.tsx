import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContentColumn } from '@/components/layout/content-column';
import { ScreenHeader } from '@/components/nav/screen-header';
import { Banner } from '@/components/ui/banner';
import { Chip } from '@/components/ui/chip';
import { useOwners } from '@/features/owners/hooks';
import { maskPhone } from '@/lib/format';

const MUTED_ICON_COLOR = { light: '#5B6363', dark: '#9AA3A3' };
const TEXT_ICON_COLOR = { light: '#1B2020', dark: '#EDEFEF' };

export default function OwnerProfilesScreen() {
  const { data: owners, isLoading } = useOwners();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!owners) return [];
    const query = search.trim().toLowerCase();
    if (!query) return owners;
    return owners.filter((owner) => owner.name.toLowerCase().includes(query));
  }, [owners, search]);

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScreenHeader
        title="Owner Profiles"
        trailing={
          <Pressable
            onPress={() => router.push('/owners/new')}
            accessibilityRole="button"
            accessibilityLabel="Add owner"
            className="h-8 w-8 items-center justify-center rounded-sm border border-border bg-surface active:bg-surface-2">
            <Ionicons name="add" size={20} color={TEXT_ICON_COLOR[scheme]} />
          </Pressable>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingHorizontal: 16 }}>
        <ContentColumn className="flex-1 gap-3 py-4">
          <View className="flex-row items-center gap-2 rounded-pill border border-border bg-surface px-3.5 py-2.5">
            <Ionicons name="search" size={16} color={MUTED_ICON_COLOR[scheme]} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search owners"
              placeholderTextColor="#8B9494"
              accessibilityLabel="Search owners"
              className="flex-1 font-body text-[13px] text-text outline-none"
            />
          </View>

          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#1F7A6E" />
            </View>
          ) : filtered.length === 0 ? (
            <View className="flex-1 items-center justify-center gap-2 px-6 py-10">
              <Text className="font-display-extrabold text-[15px] text-text">
                {owners && owners.length > 0 ? 'No matching owners' : 'No owners yet'}
              </Text>
              <Text className="text-center font-body text-[13px] text-text-muted">
                {owners && owners.length > 0
                  ? 'Try a different search.'
                  : "Add your first owner — a property can't be saved without one."}
              </Text>
            </View>
          ) : (
            <View className="gap-2.5">
              <View className="rounded-md border border-border bg-surface px-3.5">
                {filtered.map((owner, index) => (
                  <View key={owner.id}>
                    <Pressable
                      onPress={() => router.push(`/owners/${owner.id}`)}
                      accessibilityRole="button"
                      className="flex-row items-center gap-2.5 py-3">
                      <View className="h-10 w-10 items-center justify-center rounded-full border border-border bg-info-bg">
                        <Text className="font-body-bold text-[13px] text-info-fg">
                          {owner.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View className="flex-1 gap-0.5">
                        <Text className="font-body-bold text-[14px] text-text">{owner.name}</Text>
                        <Text className="font-body text-[12px] text-text-muted">{maskPhone(owner.phone)}</Text>
                      </View>
                      <Chip variant="info">{owner.relation}</Chip>
                      <Ionicons name="chevron-forward" size={16} color={MUTED_ICON_COLOR[scheme]} />
                    </Pressable>
                    {index < filtered.length - 1 ? <View className="h-px bg-border" /> : null}
                  </View>
                ))}
              </View>

              <Pressable
                onPress={() => router.push('/owners/new')}
                accessibilityRole="button"
                className="flex-row items-center justify-center gap-2 rounded-md border border-dashed border-border-strong px-4 py-3 active:bg-surface-2">
                <Text className="font-body-bold text-[14px] text-text-muted">+ Add new owner</Text>
              </Pressable>
            </View>
          )}

          <Banner variant="info">
            <Text className="font-body text-[12.5px] leading-5 text-info-fg">
              Aadhaar and PAN are required for an owner before an agreement can be generated using their
              profile as Licensor.
            </Text>
          </Banner>
        </ContentColumn>
      </ScrollView>
    </SafeAreaView>
  );
}
