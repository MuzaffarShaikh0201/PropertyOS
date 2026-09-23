import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContentColumn } from '@/components/layout/content-column';
import { ScreenHeader } from '@/components/nav/screen-header';
import { Banner } from '@/components/ui/banner';
import { Chip } from '@/components/ui/chip';
import { useToast } from '@/components/ui/toast';
import { useLatestAgreementForProperty } from '@/features/agreements/hooks';
import { getLifecycleStatus, LIFECYCLE_LABELS } from '@/features/agreements/lifecycle';
import { useOwner } from '@/features/owners/hooks';
import { useDeleteProperty, useProperty } from '@/features/properties/hooks';
import { deletePropertyImage } from '@/features/properties/image';
import { PropertyImage } from '@/features/properties/property-image';
import { bhkLabel, furnishingLabel, occupancyStatusLabel, propertyTypeLabel } from '@/features/properties/types';

const DELETE_ICON_COLOR = { light: '#A23B2E', dark: '#F08A75' };
const MUTED_ICON_COLOR = { light: '#5B6363', dark: '#9AA3A3' };

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-2.5">
      <Text className="font-body text-[13px] text-text-muted">{label}</Text>
      <Text className="font-body-bold text-[13px] text-text">{value}</Text>
    </View>
  );
}

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: property, isLoading } = useProperty(id);
  const { data: owner } = useOwner(property?.ownerId ?? '');
  const { data: agreement } = useLatestAgreementForProperty(id);
  const deleteProperty = useDeleteProperty();
  const toast = useToast();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      if (property?.imagePath) {
        await deletePropertyImage(property.imagePath).catch(() => undefined);
      }
      await deleteProperty.mutateAsync(id);
      toast.success('Property removed.');
      router.back();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove property.');
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScreenHeader
        title={property?.name ?? 'Property'}
        trailing={
          property ? (
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => router.push(`/properties/new?id=${property.id}`)}
                accessibilityRole="button"
                accessibilityLabel="Edit property"
                className="h-8 w-8 items-center justify-center rounded-sm border border-border bg-surface active:bg-surface-2">
                <Ionicons name="create-outline" size={16} color={MUTED_ICON_COLOR[scheme]} />
              </Pressable>
              <Pressable
                onPress={handleDelete}
                disabled={deleting}
                accessibilityRole="button"
                accessibilityLabel="Delete property"
                className="h-8 w-8 items-center justify-center rounded-sm border border-border bg-surface active:bg-surface-2">
                <Ionicons name="trash-outline" size={16} color={DELETE_ICON_COLOR[scheme]} />
              </Pressable>
            </View>
          ) : undefined
        }
      />

      {isLoading || !property ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1F7A6E" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingHorizontal: 16 }}>
          <ContentColumn className="gap-4 py-4">
            <PropertyImage imagePath={property.imagePath} size="hero" />

            <View className="flex-row flex-wrap items-center gap-2">
              <Chip variant={property.occupancyStatus === 'vacant' ? 'neutral' : 'success'}>
                {occupancyStatusLabel(property.occupancyStatus)}
              </Chip>
              <Chip variant="info">{propertyTypeLabel(property.propertyType)}</Chip>
              <Chip variant="info">{bhkLabel(property.bhk)}</Chip>
            </View>

            <View className="gap-1">
              <Text className="font-display-extrabold text-[17px] text-text">{property.name}</Text>
              <Text className="font-body text-[13px] text-text-muted">
                {property.addressLine1}, {property.locality}, {property.city} — {property.pincode}
              </Text>
              <Text className="font-body text-[13px] text-text-muted">{property.state}</Text>
            </View>

            <View className="rounded-md border border-border bg-surface px-3.5">
              <DetailRow label="Owner" value={owner?.name ?? '—'} />
              <View className="h-px bg-border" />
              <DetailRow label="Furnishing" value={furnishingLabel(property.furnishing)} />
              <View className="h-px bg-border" />
              <DetailRow
                label="Area"
                value={property.areaSqft ? `${property.areaSqft} sq. ft.` : 'Not recorded'}
              />
            </View>

            {property.notes ? (
              <View className="gap-1.5">
                <Text className="font-body-bold text-[12px] text-text-muted">Notes</Text>
                <Text className="font-body text-[13px] leading-5 text-text">{property.notes}</Text>
              </View>
            ) : null}

            <View className="gap-2">
              <Text className="font-body-bold text-[12px] text-text-muted">Tenancy</Text>
              {agreement ? (
                <Pressable
                  onPress={() => router.push(`/agreements/${agreement.id}`)}
                  accessibilityRole="button"
                  className="flex-row items-center justify-between rounded-md border border-border bg-surface px-3.5 py-3 active:bg-surface-2">
                  <View className="gap-0.5">
                    <Text className="font-body-bold text-[13px] text-text">
                      {agreement.startDate} → {agreement.endDate}
                    </Text>
                    <Text className="font-body text-[12px] text-text-muted">
                      {LIFECYCLE_LABELS[getLifecycleStatus(agreement)]}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={MUTED_ICON_COLOR[scheme]} />
                </Pressable>
              ) : (
                <>
                  <Banner variant="info">
                    <Text className="font-body text-[12.5px] leading-5 text-info-fg">
                      No active agreement on this property yet.
                    </Text>
                  </Banner>
                  <Pressable
                    onPress={() => router.push({ pathname: '/agreements/new/step1', params: { propertyId: property.id } })}
                    accessibilityRole="button"
                    className="flex-row items-center justify-center gap-2 rounded-sm border border-border-strong px-4 py-3 active:bg-surface-2">
                    <Text className="font-body-bold text-[14px] text-text">Add tenant &amp; new agreement</Text>
                  </Pressable>
                </>
              )}
            </View>
          </ContentColumn>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
