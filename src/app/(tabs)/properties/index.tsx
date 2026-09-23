import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContentColumn } from '@/components/layout/content-column';
import { Chip } from '@/components/ui/chip';
import { OCCUPANCY_STATUSES, occupancyStatusLabel, type OccupancyStatus } from '@/features/properties/types';
import { useProperties } from '@/features/properties/hooks';
import { PropertyImage } from '@/features/properties/property-image';

const MUTED_ICON_COLOR = { light: '#5B6363', dark: '#9AA3A3' };
const TEXT_ICON_COLOR = { light: '#1B2020', dark: '#EDEFEF' };

type OccupancyFilter = 'all' | OccupancyStatus;

const OCCUPANCY_FILTERS: { value: OccupancyFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...OCCUPANCY_STATUSES.map((status) => ({ value: status.value as OccupancyFilter, label: status.label })),
];

export default function PropertyRegistryScreen() {
  const { data: properties, isLoading } = useProperties();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const [search, setSearch] = useState('');
  const [occupancyFilter, setOccupancyFilter] = useState<OccupancyFilter>('all');

  const filtered = useMemo(() => {
    if (!properties) return [];
    const query = search.trim().toLowerCase();
    return properties.filter((property) => {
      const matchesQuery =
        query.length === 0 ||
        property.name.toLowerCase().includes(query) ||
        property.locality.toLowerCase().includes(query) ||
        property.city.toLowerCase().includes(query);
      const matchesOccupancy = occupancyFilter === 'all' || property.occupancyStatus === occupancyFilter;
      return matchesQuery && matchesOccupancy;
    });
  }, [properties, search, occupancyFilter]);

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-row items-center gap-2.5 border-b border-border bg-surface px-4 py-3.5">
        <Text className="flex-1 font-display-extrabold text-[17px] text-text">Properties</Text>
        <Pressable
          onPress={() => router.push('/properties/new')}
          accessibilityRole="button"
          accessibilityLabel="Add property"
          className="h-8 w-8 items-center justify-center rounded-sm border border-border bg-surface active:bg-surface-2">
          <Ionicons name="add" size={20} color={TEXT_ICON_COLOR[scheme]} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingHorizontal: 16 }}>
        <ContentColumn className="flex-1 gap-3 py-4">
          <View className="flex-row items-center gap-2 rounded-pill border border-border bg-surface px-3.5 py-2.5">
            <Ionicons name="search" size={16} color={MUTED_ICON_COLOR[scheme]} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search properties"
              placeholderTextColor="#8B9494"
              accessibilityLabel="Search properties"
              className="flex-1 font-body text-[13px] text-text outline-none"
            />
          </View>

          <View className="flex-row flex-wrap gap-2">
            {OCCUPANCY_FILTERS.map((filter) => {
              const isActive = filter.value === occupancyFilter;
              return (
                <Pressable
                  key={filter.value}
                  onPress={() => setOccupancyFilter(filter.value)}
                  accessibilityRole="button"
                  className={`rounded-pill border px-3 py-1.5 ${
                    isActive ? 'border-primary bg-primary' : 'border-border bg-surface'
                  }`}>
                  <Text className={`font-body-bold text-[12.5px] ${isActive ? 'text-on-primary' : 'text-text-muted'}`}>
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#1F7A6E" />
            </View>
          ) : filtered.length === 0 ? (
            <View className="flex-1 items-center justify-center gap-2 px-6 py-10">
              <Text className="font-display-extrabold text-[15px] text-text">
                {properties && properties.length > 0 ? 'No matching properties' : 'No properties yet'}
              </Text>
              <Text className="text-center font-body text-[13px] text-text-muted">
                {properties && properties.length > 0
                  ? 'Try a different search or filter.'
                  : 'Add your first property to start tracking tenants and rent.'}
              </Text>
            </View>
          ) : (
            <View className="gap-2.5">
              <View className="rounded-md border border-border bg-surface px-3.5">
                {filtered.map((property, index) => (
                  <View key={property.id}>
                    <Pressable
                      onPress={() => router.push({ pathname: '/properties/[id]', params: { id: property.id } })}
                      accessibilityRole="button"
                      className="flex-row items-center gap-2.5 py-3">
                      <PropertyImage imagePath={property.imagePath} size="thumbnail" />
                      <View className="flex-1 gap-0.5">
                        <Text className="font-body-bold text-[14px] text-text">{property.name}</Text>
                        <Text className="font-body text-[12px] text-text-muted">
                          {property.locality}, {property.city}
                        </Text>
                      </View>
                      <Chip variant={property.occupancyStatus === 'vacant' ? 'neutral' : 'success'}>
                        {occupancyStatusLabel(property.occupancyStatus)}
                      </Chip>
                      <Ionicons name="chevron-forward" size={16} color={MUTED_ICON_COLOR[scheme]} />
                    </Pressable>
                    {index < filtered.length - 1 ? <View className="h-px bg-border" /> : null}
                  </View>
                ))}
              </View>

              <Pressable
                onPress={() => router.push('/properties/new')}
                accessibilityRole="button"
                className="flex-row items-center justify-center gap-2 rounded-md border border-dashed border-border-strong px-4 py-3 active:bg-surface-2">
                <Text className="font-body-bold text-[14px] text-text-muted">+ Add new property</Text>
              </Pressable>
            </View>
          )}
        </ContentColumn>
      </ScrollView>
    </SafeAreaView>
  );
}
