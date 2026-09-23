import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContentColumn } from '@/components/layout/content-column';
import { Banner } from '@/components/ui/banner';
import { Chip } from '@/components/ui/chip';
import { ChipSelect } from '@/components/ui/chip-select';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useToast } from '@/components/ui/toast';
import { formatInr, todayIsoDate } from '@/features/agreements/calculations';
import { useLatestAgreementForProperty } from '@/features/agreements/hooks';
import { recordRentPaidNotification } from '@/features/notifications/api';
import { useProperties } from '@/features/properties/hooks';
import {
  useLedgerEntries,
  useRecordLedgerPayment,
  useRevertLedgerEntryToUnpaid,
} from '@/features/rent-ledger/hooks';
import { getLedgerDisplayStatus, LEDGER_STATUS_LABELS, ledgerShortfall } from '@/features/rent-ledger/lifecycle';
import { RecordPaymentSheet } from '@/features/rent-ledger/record-payment-sheet';
import type { RentLedgerEntry } from '@/features/rent-ledger/types';
import { useUtilityBills } from '@/features/utility-bills/hooks';
import { getBillDisplayStatus, BILL_STATUS_LABELS, billShortfall } from '@/features/utility-bills/lifecycle';
import { BILL_TYPES, billTypeLabel, responsiblePartyLabel, type BillType } from '@/features/utility-bills/types';

const TEXT_ICON_COLOR = { light: '#1B2020', dark: '#EDEFEF' };

const STATUS_CHIP_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  paid: 'success',
  partial: 'warning',
  late: 'error',
  overdue: 'error',
  unpaid: 'neutral',
};

function RentLedgerView({ propertyId }: { propertyId: string }) {
  const { data: agreement, isLoading: agreementLoading } = useLatestAgreementForProperty(propertyId);
  const { data: entries, isLoading: entriesLoading } = useLedgerEntries(agreement);
  const recordPayment = useRecordLedgerPayment(agreement?.id ?? '');
  const revertToUnpaid = useRevertLedgerEntryToUnpaid(agreement?.id ?? '');
  const toast = useToast();
  const [selectedEntry, setSelectedEntry] = useState<RentLedgerEntry | null>(null);
  const [busy, setBusy] = useState(false);

  if (agreementLoading || entriesLoading) {
    return (
      <View className="items-center justify-center py-10">
        <ActivityIndicator color="#1F7A6E" />
      </View>
    );
  }

  if (!agreement) {
    return (
      <Banner variant="info">
        <Text className="font-body text-[12.5px] leading-5 text-info-fg">
          No agreement on this property yet — the rent ledger fills in once one is created.
        </Text>
      </Banner>
    );
  }

  const today = todayIsoDate();
  const currentPeriod = [...(entries ?? [])].reverse().find((e) => e.periodStart <= today) ?? entries?.[0] ?? null;
  const paidCount = entries?.filter((e) => e.status === 'paid').length ?? 0;
  const overdueCount = entries?.filter((e) => getLedgerDisplayStatus(e) === 'late').length ?? 0;
  const pending = entries?.filter((e) => e.status === 'partial') ?? [];

  const closeSheet = () => setSelectedEntry(null);

  const runUpdate = async (action: () => Promise<unknown>, successMessage: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(successMessage);
      closeSheet();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update this period.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="gap-4">
      <View className="flex-row gap-2.5">
        <View className="flex-1 items-center gap-0.5 rounded-md border border-border bg-surface px-2 py-3">
          <Text className="font-display-extrabold text-[16px] text-text">
            {currentPeriod ? formatInr(currentPeriod.amountDue) : '—'}
          </Text>
          <Text className="font-body text-[11px] text-text-muted">Due this period</Text>
        </View>
        <View className="flex-1 items-center gap-0.5 rounded-md border border-border bg-surface px-2 py-3">
          <Text className="font-display-extrabold text-[16px] text-text">{paidCount}</Text>
          <Text className="font-body text-[11px] text-text-muted">Paid</Text>
        </View>
        <View className="flex-1 items-center gap-0.5 rounded-md border border-border bg-surface px-2 py-3">
          <Text className="font-display-extrabold text-[16px] text-text">{overdueCount}</Text>
          <Text className="font-body text-[11px] text-text-muted">Overdue</Text>
        </View>
      </View>

      <View className="rounded-md border border-border bg-surface px-3.5">
        {(entries ?? []).map((entry, index) => {
          const displayStatus = getLedgerDisplayStatus(entry);
          return (
            <View key={entry.id}>
              <Pressable
                onPress={() => setSelectedEntry(entry)}
                accessibilityRole="button"
                className="flex-row items-center justify-between py-3">
                <View>
                  <Text className="font-body-bold text-[13px] text-text">{entry.periodStart}</Text>
                  <Text className="font-body text-[12px] text-text-muted">{formatInr(entry.amountDue)}</Text>
                </View>
                <Chip variant={STATUS_CHIP_VARIANT[displayStatus]}>{LEDGER_STATUS_LABELS[displayStatus]}</Chip>
              </Pressable>
              {index < (entries?.length ?? 0) - 1 ? <View className="h-px bg-border" /> : null}
            </View>
          );
        })}
      </View>

      {pending.length > 0 ? (
        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Pending payments</Text>
          <View className="rounded-md border border-border bg-surface px-3.5">
            {pending.map((entry, index) => (
              <View key={entry.id}>
                <View className="flex-row items-center justify-between py-2.5">
                  <Text className="font-body text-[12.5px] text-text">{entry.periodStart}</Text>
                  <Text className="font-body-bold text-[12.5px] text-danger-fg">{formatInr(ledgerShortfall(entry))} owed</Text>
                </View>
                {index < pending.length - 1 ? <View className="h-px bg-border" /> : null}
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <RecordPaymentSheet
        entry={selectedEntry}
        busy={busy}
        onClose={closeSheet}
        onMarkPaid={(paymentMode) =>
          selectedEntry &&
          runUpdate(
            async () => {
              await recordPayment.mutateAsync({
                id: selectedEntry.id,
                input: { status: 'paid', amountPaid: selectedEntry.amountDue, paidAt: todayIsoDate(), paymentMode },
              });
              // Best-effort — a notification failing to log shouldn't undo the payment that already succeeded.
              await recordRentPaidNotification(selectedEntry.id).catch(() => undefined);
            },
            'Marked paid.'
          )
        }
        onMarkPartial={(amountPaid, paidAt, paymentMode) =>
          selectedEntry &&
          runUpdate(
            () => recordPayment.mutateAsync({ id: selectedEntry.id, input: { status: 'partial', amountPaid, paidAt, paymentMode } }),
            'Marked partial.'
          )
        }
        onMarkUnpaid={() => selectedEntry && runUpdate(() => revertToUnpaid.mutateAsync(selectedEntry.id), 'Marked unpaid.')}
      />
    </View>
  );
}

function UtilityBillsView({ propertyId }: { propertyId: string | 'all' }) {
  const { data: bills, isLoading } = useUtilityBills(propertyId === 'all' ? undefined : propertyId);
  const { data: properties } = useProperties();
  const [billTypeFilter, setBillTypeFilter] = useState<'all' | BillType>('all');

  const propertyNameById = useMemo(() => {
    const map = new Map<string, string>();
    properties?.forEach((property) => map.set(property.id, property.name));
    return map;
  }, [properties]);

  const filtered = (bills ?? []).filter((bill) => billTypeFilter === 'all' || bill.billType === billTypeFilter);
  const pending = filtered.filter((bill) => bill.status === 'partial');

  if (isLoading) {
    return (
      <View className="items-center justify-center py-10">
        <ActivityIndicator color="#1F7A6E" />
      </View>
    );
  }

  return (
    <View className="gap-4">
      <ChipSelect
        options={[{ value: 'all' as const, label: 'All types' }, ...BILL_TYPES]}
        value={billTypeFilter}
        onChange={setBillTypeFilter}
      />

      {filtered.length === 0 ? (
        <Text className="py-6 text-center font-body text-[13px] text-text-muted">No utility bills recorded yet.</Text>
      ) : (
        <View className="rounded-md border border-border bg-surface px-3.5">
          {filtered.map((bill, index) => {
            const displayStatus = getBillDisplayStatus(bill);
            return (
              <View key={bill.id}>
                <Pressable
                  onPress={() => router.push({ pathname: '/bills/[id]', params: { id: bill.id } })}
                  accessibilityRole="button"
                  className="flex-row items-center justify-between py-3">
                  <View className="flex-1 pr-3">
                    <Text className="font-body-bold text-[13px] text-text">{billTypeLabel(bill.billType)}</Text>
                    <Text className="font-body text-[12px] text-text-muted">
                      {propertyId === 'all' ? `${propertyNameById.get(bill.propertyId) ?? 'Property'} · ` : ''}
                      {responsiblePartyLabel(bill.responsibleParty)} · due {bill.dueDate}
                    </Text>
                  </View>
                  <View className="items-end gap-1">
                    <Text className="font-body-bold text-[13px] text-text">{formatInr(bill.amount)}</Text>
                    <Chip variant={STATUS_CHIP_VARIANT[displayStatus]}>{BILL_STATUS_LABELS[displayStatus]}</Chip>
                  </View>
                </Pressable>
                {index < filtered.length - 1 ? <View className="h-px bg-border" /> : null}
              </View>
            );
          })}
        </View>
      )}

      {pending.length > 0 ? (
        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Pending payments</Text>
          <View className="rounded-md border border-border bg-surface px-3.5">
            {pending.map((bill, index) => (
              <View key={bill.id}>
                <View className="flex-row items-center justify-between py-2.5">
                  <Text className="font-body text-[12.5px] text-text">{billTypeLabel(bill.billType)}</Text>
                  <Text className="font-body-bold text-[12.5px] text-danger-fg">{formatInr(billShortfall(bill))} owed</Text>
                </View>
                {index < pending.length - 1 ? <View className="h-px bg-border" /> : null}
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={() =>
          router.push({ pathname: '/bills/new', params: propertyId !== 'all' ? { propertyId } : {} })
        }
        accessibilityRole="button"
        className="flex-row items-center justify-center gap-2 rounded-md border border-dashed border-border-strong px-4 py-3 active:bg-surface-2">
        <Text className="font-body-bold text-[14px] text-text-muted">+ Record utility bill</Text>
      </Pressable>
    </View>
  );
}

export default function FinanceScreen() {
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const [tab, setTab] = useState<'rent' | 'utilities'>('rent');
  const [propertyId, setPropertyId] = useState<string | 'all'>('all');

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-row items-center gap-2.5 border-b border-border bg-surface px-4 py-3.5">
        <Text className="flex-1 font-display-extrabold text-[17px] text-text">Finance</Text>
        {tab === 'utilities' ? (
          <Pressable
            onPress={() => router.push({ pathname: '/bills/new', params: propertyId !== 'all' ? { propertyId } : {} })}
            accessibilityRole="button"
            accessibilityLabel="Record utility bill"
            className="h-8 w-8 items-center justify-center rounded-sm border border-border bg-surface active:bg-surface-2">
            <Ionicons name="add" size={20} color={TEXT_ICON_COLOR[scheme]} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingHorizontal: 16 }}>
        <ContentColumn className="gap-4 py-4">
          <SegmentedControl
            options={[
              { value: 'rent' as const, label: 'Rent Ledger' },
              { value: 'utilities' as const, label: 'Utility Bills' },
            ]}
            value={tab}
            onChange={setTab}
          />

          {propertiesLoading ? (
            <ActivityIndicator color="#1F7A6E" />
          ) : !properties || properties.length === 0 ? (
            <Text className="py-6 text-center font-body text-[13px] text-text-muted">
              Add a property to start tracking rent and utility bills.
            </Text>
          ) : (
            <>
              <ChipSelect
                options={
                  tab === 'utilities'
                    ? [{ value: 'all' as const, label: 'All properties' }, ...properties.map((p) => ({ value: p.id, label: p.name }))]
                    : properties.map((p) => ({ value: p.id, label: p.name }))
                }
                value={propertyId}
                onChange={setPropertyId}
              />

              {tab === 'rent' ? (
                propertyId === 'all' ? (
                  <Banner variant="info">
                    <Text className="font-body text-[12.5px] leading-5 text-info-fg">
                      Pick a property above to see its rent ledger.
                    </Text>
                  </Banner>
                ) : (
                  <RentLedgerView propertyId={propertyId} />
                )
              ) : (
                <UtilityBillsView propertyId={propertyId} />
              )}
            </>
          )}
        </ContentColumn>
      </ScrollView>
    </SafeAreaView>
  );
}
