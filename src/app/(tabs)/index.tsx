import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContentColumn } from '@/components/layout/content-column';
import { Banner } from '@/components/ui/banner';
import { Chip } from '@/components/ui/chip';
import { computeRegistrationDeadline, daysUntil, formatInr } from '@/features/agreements/calculations';
import { useUnregisteredAgreements } from '@/features/agreements/hooks';
import { useProperties } from '@/features/properties/hooks';
import { useUpcomingRentDue } from '@/features/rent-ledger/hooks';
import { getLedgerDisplayStatus, LEDGER_STATUS_LABELS } from '@/features/rent-ledger/lifecycle';
import { useUtilityBills } from '@/features/utility-bills/hooks';
import { getBillDisplayStatus, BILL_STATUS_LABELS } from '@/features/utility-bills/lifecycle';
import { billTypeLabel } from '@/features/utility-bills/types';
import { useAuth } from '@/lib/auth';

const MUTED_ICON_COLOR = { light: '#5B6363', dark: '#9AA3A3' };
const ATTENTION_WINDOW_DAYS = 30;
const MAX_DEADLINE_ROWS = 5;
const UPCOMING_RENT_WINDOW_DAYS = 31;
const MAX_BILL_ROWS = 5;

const STATUS_CHIP_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  paid: 'success',
  partial: 'warning',
  late: 'error',
  overdue: 'error',
  unpaid: 'neutral',
};

function readMetadataString(metadata: Record<string, unknown> | undefined, key: string): string {
  const value = metadata?.[key];
  return typeof value === 'string' ? value : '';
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <View className="flex-1 items-center gap-0.5 rounded-md border border-border bg-surface px-2 py-3">
      <Text className="font-display-extrabold text-[20px] text-text">{value}</Text>
      <Text className="font-body text-[11px] text-text-muted">{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { session } = useAuth();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: unregisteredAgreements, isLoading: agreementsLoading } = useUnregisteredAgreements();
  const { data: upcomingRent } = useUpcomingRentDue(UPCOMING_RENT_WINDOW_DAYS);
  const { data: utilityBills } = useUtilityBills();

  const firstName = readMetadataString(session?.user.user_metadata, 'first_name');
  const initial = firstName ? firstName[0].toUpperCase() : '?';

  const propertyNameById = useMemo(() => {
    const map = new Map<string, string>();
    properties?.forEach((property) => map.set(property.id, property.name));
    return map;
  }, [properties]);

  const deadlines = useMemo(() => {
    if (!unregisteredAgreements) return [];
    return unregisteredAgreements
      .map((agreement) => {
        const deadline = computeRegistrationDeadline(
          agreement.startDate,
          agreement.legalConfigSnapshot.registration.windowMonths
        );
        return {
          agreementId: agreement.id,
          propertyName: propertyNameById.get(agreement.propertyId) ?? 'Property',
          deadline,
          daysLeft: daysUntil(deadline),
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [unregisteredAgreements, propertyNameById]);

  const attentionItem = deadlines.find((item) => item.daysLeft <= ATTENTION_WINDOW_DAYS) ?? null;

  const billsDue = useMemo(() => {
    if (!utilityBills) return [];
    return utilityBills
      .filter((bill) => bill.status !== 'paid')
      .map((bill) => ({
        bill,
        propertyName: propertyNameById.get(bill.propertyId) ?? 'Property',
        displayStatus: getBillDisplayStatus(bill),
      }))
      .sort((a, b) => a.bill.dueDate.localeCompare(b.bill.dueDate))
      .slice(0, MAX_BILL_ROWS);
  }, [utilityBills, propertyNameById]);

  const isLoading = propertiesLoading || agreementsLoading;
  const totalProperties = properties?.length ?? 0;
  const occupiedCount = properties?.filter((p) => p.occupancyStatus !== 'vacant').length ?? 0;
  const vacantCount = totalProperties - occupiedCount;

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-row items-center gap-2.5 border-b border-border bg-surface px-4 py-3.5">
        <View className="flex-1">
          <Text className="font-body text-[12px] text-text-muted">{greeting()}</Text>
          <Text className="font-display-extrabold text-[17px] text-text" numberOfLines={1}>
            {firstName || 'there'}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/alerts')}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          className="h-9 w-9 items-center justify-center rounded-sm border border-border bg-surface active:bg-surface-2">
          <Ionicons name="notifications-outline" size={18} color={MUTED_ICON_COLOR[scheme]} />
          {attentionItem ? (
            <View className="absolute right-1.5 top-1.5 h-2 w-2 rounded-pill bg-danger-fg" />
          ) : null}
        </Pressable>
        <Pressable
          onPress={() => router.push('/profile')}
          accessibilityRole="button"
          accessibilityLabel="Profile"
          className="h-9 w-9 items-center justify-center rounded-pill bg-primary">
          <Text className="font-body-bold text-[13px] text-on-primary">{initial}</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1F7A6E" />
        </View>
      ) : totalProperties === 0 ? (
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Text className="font-display-extrabold text-[16px] text-text">No properties yet</Text>
          <Text className="text-center font-body text-[13px] text-text-muted">
            Add your first property to start tracking tenants, rent, and compliance deadlines.
          </Text>
          <Pressable
            onPress={() => router.push('/properties/new')}
            accessibilityRole="button"
            className="rounded-sm bg-primary px-4 py-2.5 active:opacity-90">
            <Text className="font-body-bold text-[13px] text-on-primary">Add your first property</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingHorizontal: 16 }}>
          <ContentColumn className="gap-4 py-4">
            <View className="flex-row gap-2.5">
              <StatTile value={totalProperties} label="Properties" />
              <StatTile value={occupiedCount} label="Occupied" />
              <StatTile value={vacantCount} label="Vacant" />
            </View>

            {attentionItem ? (
              <Pressable
                onPress={() => router.push(`/agreements/${attentionItem.agreementId}`)}
                accessibilityRole="button">
                <Banner variant={attentionItem.daysLeft <= 7 ? 'error' : 'warning'}>
                  <Text
                    className={`font-body-bold text-[13px] ${
                      attentionItem.daysLeft <= 7 ? 'text-danger-fg' : 'text-warning-fg'
                    }`}>
                    Needs your attention
                  </Text>
                  <Text
                    className={`font-body text-[12.5px] leading-5 ${
                      attentionItem.daysLeft <= 7 ? 'text-danger-fg' : 'text-warning-fg'
                    }`}>
                    {attentionItem.propertyName}&apos;s registration is{' '}
                    {attentionItem.daysLeft < 0 ? 'overdue' : `due in ${attentionItem.daysLeft} days`} (
                    {attentionItem.deadline}).
                  </Text>
                </Banner>
              </Pressable>
            ) : (
              <Banner variant="success">
                <Text className="font-body text-[12.5px] leading-5 text-success-fg">
                  You&apos;re all caught up — no urgent compliance deadlines right now.
                </Text>
              </Banner>
            )}

            {deadlines.length > 0 ? (
              <View className="gap-1.5">
                <Text className="font-body-bold text-[12px] text-text-muted">Compliance deadlines</Text>
                <View className="rounded-md border border-border bg-surface px-3.5">
                  {deadlines.slice(0, MAX_DEADLINE_ROWS).map((item, index) => (
                    <View key={item.agreementId}>
                      <Pressable
                        onPress={() => router.push(`/agreements/${item.agreementId}`)}
                        accessibilityRole="button"
                        className="flex-row items-center justify-between py-3">
                        <View className="flex-1 pr-3">
                          <Text className="font-body-bold text-[13px] text-text">{item.propertyName}</Text>
                          <Text className="font-body text-[12px] text-text-muted">
                            Registration due {item.deadline}
                          </Text>
                        </View>
                        <Text
                          className={`font-body-bold text-[12.5px] ${
                            item.daysLeft <= 7
                              ? 'text-danger-fg'
                              : item.daysLeft <= 30
                                ? 'text-warning-fg'
                                : 'text-text-muted'
                          }`}>
                          {item.daysLeft < 0 ? 'Overdue' : `${item.daysLeft}d left`}
                        </Text>
                      </Pressable>
                      {index < Math.min(deadlines.length, MAX_DEADLINE_ROWS) - 1 ? (
                        <View className="h-px bg-border" />
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {upcomingRent && upcomingRent.length > 0 ? (
              <View className="gap-1.5">
                <Text className="font-body-bold text-[12px] text-text-muted">Upcoming rent</Text>
                <View className="rounded-md border border-border bg-surface px-3.5">
                  {upcomingRent.map(({ entry, propertyName }, index) => {
                    const displayStatus = getLedgerDisplayStatus(entry);
                    return (
                      <View key={entry.id}>
                        <Pressable
                          onPress={() => router.push(`/agreements/${entry.agreementId}`)}
                          accessibilityRole="button"
                          className="flex-row items-center justify-between py-3">
                          <View className="flex-1 pr-3">
                            <Text className="font-body-bold text-[13px] text-text">{propertyName}</Text>
                            <Text className="font-body text-[12px] text-text-muted">
                              {entry.periodStart} · {formatInr(entry.amountDue)}
                            </Text>
                          </View>
                          <Chip variant={STATUS_CHIP_VARIANT[displayStatus]}>{LEDGER_STATUS_LABELS[displayStatus]}</Chip>
                        </Pressable>
                        {index < upcomingRent.length - 1 ? <View className="h-px bg-border" /> : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {billsDue.length > 0 ? (
              <View className="gap-1.5">
                <Text className="font-body-bold text-[12px] text-text-muted">Utility bills due</Text>
                <View className="rounded-md border border-border bg-surface px-3.5">
                  {billsDue.map(({ bill, propertyName, displayStatus }, index) => (
                    <View key={bill.id}>
                      <Pressable
                        onPress={() => router.push({ pathname: '/bills/[id]', params: { id: bill.id } })}
                        accessibilityRole="button"
                        className="flex-row items-center justify-between py-3">
                        <View className="flex-1 pr-3">
                          <Text className="font-body-bold text-[13px] text-text">
                            {propertyName} · {billTypeLabel(bill.billType)}
                          </Text>
                          <Text className="font-body text-[12px] text-text-muted">
                            Due {bill.dueDate} · {formatInr(bill.amount)}
                          </Text>
                        </View>
                        <Chip variant={STATUS_CHIP_VARIANT[displayStatus]}>{BILL_STATUS_LABELS[displayStatus]}</Chip>
                      </Pressable>
                      {index < billsDue.length - 1 ? <View className="h-px bg-border" /> : null}
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </ContentColumn>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
