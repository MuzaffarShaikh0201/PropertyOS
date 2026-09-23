import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DatePickerField } from '@/components/form/date-picker-field';
import { TextField } from '@/components/form/text-field';
import { ContentColumn } from '@/components/layout/content-column';
import { WizardHeader } from '@/components/nav/wizard-header';
import { Banner } from '@/components/ui/banner';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { addDays, isValidIsoDate, tenureMonths } from '@/features/agreements/calculations';
import {
  clearAgreementDraft,
  getAgreementDraft,
  initAgreementDraft,
  updateAgreementDraft,
  useAgreementDraft,
} from '@/features/agreements/draft-store';
import { useAgreement } from '@/features/agreements/hooks';
import { ESCALATION_FREQUENCIES } from '@/features/agreements/types';
import { useOwner } from '@/features/owners/hooks';
import { useProperty } from '@/features/properties/hooks';
import { useTenant } from '@/features/tenants/hooks';

export default function NewAgreementStep1Screen() {
  const { propertyId, renewFrom } = useLocalSearchParams<{ propertyId: string; renewFrom?: string }>();
  const { data: property, isLoading: propertyLoading } = useProperty(propertyId);
  const { data: owner } = useOwner(property?.ownerId ?? '');
  const { data: renewFromAgreement } = useAgreement(renewFrom);
  const draft = useAgreementDraft();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    const existing = getAgreementDraft();
    if (existing && existing.propertyId === propertyId) {
      initialized.current = true;
      return;
    }
    if (renewFrom && !renewFromAgreement) return; // wait for the source agreement to load before prefilling
    initialized.current = true;
    if (renewFrom && renewFromAgreement) {
      initAgreementDraft(propertyId, {
        tenantId: renewFromAgreement.tenantId,
        startDate: addDays(renewFromAgreement.endDate, 1),
        noticePeriodDays: String(renewFromAgreement.noticePeriodDays),
        monthlyRent: String(renewFromAgreement.monthlyRent),
        securityDeposit: String(renewFromAgreement.securityDeposit),
        escalationPercent: renewFromAgreement.escalationPercent ? String(renewFromAgreement.escalationPercent) : '',
        escalationFrequency: renewFromAgreement.escalationFrequency ?? 'none',
        witness1Name: renewFromAgreement.witness1Name ?? '',
        witness1Phone: renewFromAgreement.witness1Phone ?? '',
        witness2Name: renewFromAgreement.witness2Name ?? '',
        witness2Phone: renewFromAgreement.witness2Phone ?? '',
        previousAgreementId: renewFromAgreement.id,
      });
    } else {
      initAgreementDraft(propertyId);
    }
  }, [propertyId, renewFrom, renewFromAgreement]);

  const { data: tenant } = useTenant(draft?.tenantId);

  if (propertyLoading || !property || !draft) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <WizardHeader title="Parties & Terms" step={1} totalSteps={3} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1F7A6E" />
        </View>
      </SafeAreaView>
    );
  }

  const isOwnerReady = Boolean(owner?.aadhaarNumber && owner?.panNumber);
  const isTenantReady = Boolean(draft.tenantId);
  const isStartValid = isValidIsoDate(draft.startDate);
  const isEndValid = isValidIsoDate(draft.endDate) && (!isStartValid || draft.endDate > draft.startDate);
  const isNoticeValid = draft.noticePeriodDays.trim().length > 0 && Number(draft.noticePeriodDays) > 0;
  const isRentValid = draft.monthlyRent.trim().length > 0 && Number(draft.monthlyRent) > 0;
  const isDepositValid = draft.securityDeposit.trim().length > 0 && Number(draft.securityDeposit) >= 0;
  const canContinue =
    isOwnerReady && isTenantReady && isStartValid && isEndValid && isNoticeValid && isRentValid && isDepositValid;

  const tenureLabel = isStartValid && isEndValid ? `${tenureMonths(draft.startDate, draft.endDate)} months` : null;

  const handleClose = () => {
    clearAgreementDraft();
    // The X always means "cancel the wizard," not "go back one step" — dismiss
    // every modal step pushed so far in one go, however far in we are.
    router.dismissAll();
  };

  const handleContinue = () => {
    if (!canContinue) return;
    router.push({ pathname: '/agreements/new/step2', params: { propertyId } });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <WizardHeader title="Parties & Terms" step={1} totalSteps={3} onClose={handleClose} />
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingHorizontal: 16 }}>
        <ContentColumn className="gap-4 py-4">
          <View className="gap-1.5">
            <Text className="font-body-bold text-[12px] text-text-muted">Property</Text>
            <View className="rounded-md border border-border bg-surface px-3.5 py-3">
              <Text className="font-body-bold text-[14px] text-text">{property.name}</Text>
              <Text className="font-body text-[12.5px] text-text-muted">
                {property.locality}, {property.city}
              </Text>
            </View>
          </View>

          <View className="gap-1.5">
            <Text className="font-body-bold text-[12px] text-text-muted">Licensor (owner)</Text>
            <View className="rounded-md border border-border bg-surface px-3.5 py-3">
              <Text className="font-body-bold text-[14px] text-text">{owner?.name ?? '—'}</Text>
              <Text className="font-body text-[12.5px] text-text-muted">{owner?.phone}</Text>
            </View>
            {!isOwnerReady ? (
              <Banner variant="warning">
                <Text className="font-body text-[12.5px] leading-5 text-warning-fg">
                  This owner needs Aadhaar and PAN on file before being used as Licensor on an agreement.
                </Text>
                <Pressable
                  onPress={() => router.push(`/owners/${owner?.id}`)}
                  accessibilityRole="button"
                  className="self-start rounded-sm border border-border-strong bg-surface px-3 py-1.5">
                  <Text className="font-body-bold text-[12px] text-text">Complete owner profile</Text>
                </Pressable>
              </Banner>
            ) : null}
          </View>

          <View className="gap-1.5">
            <Text className="font-body-bold text-[12px] text-text-muted">Licensee (tenant)</Text>
            {tenant ? (
              <View className="flex-row items-center justify-between rounded-md border border-border bg-surface px-3.5 py-3">
                <View>
                  <Text className="font-body-bold text-[14px] text-text">{tenant.name}</Text>
                  <Text className="font-body text-[12.5px] text-text-muted">{tenant.phone}</Text>
                </View>
                <Pressable
                  onPress={() => updateAgreementDraft({ tenantId: null })}
                  accessibilityRole="button"
                  className="rounded-sm border border-border-strong bg-surface px-3 py-1.5">
                  <Text className="font-body-bold text-[12px] text-text">Change</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => router.push('/tenants/new')}
                accessibilityRole="button"
                className="flex-row items-center justify-center gap-2 rounded-md border border-dashed border-border-strong px-4 py-3 active:bg-surface-2">
                <Text className="font-body-bold text-[14px] text-text-muted">+ Add new tenant</Text>
              </Pressable>
            )}
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <DatePickerField
                label="Start date"
                value={draft.startDate}
                onChangeDate={(iso) => {
                  // Keep the end date consistent — clear it rather than leave
                  // a now-invalid (on or before the new start) date in place.
                  const patch: { startDate: string; endDate?: string } = { startDate: iso };
                  if (draft.endDate && draft.endDate <= iso) patch.endDate = '';
                  updateAgreementDraft(patch);
                }}
                accessibilityLabel="Start date"
              />
            </View>
            <View className="flex-1">
              <DatePickerField
                label="End date"
                value={draft.endDate}
                onChangeDate={(iso) => updateAgreementDraft({ endDate: iso })}
                minimumDate={isStartValid ? addDays(draft.startDate, 1) : undefined}
                accessibilityLabel="End date"
              />
            </View>
          </View>
          {tenureLabel ? <Text className="-mt-2 font-body text-[12px] text-text-muted">Tenure: {tenureLabel}</Text> : null}

          <View className="flex-row gap-3">
            <View className="flex-1 gap-1.5">
              <Text className="font-body-bold text-[12px] text-text-muted">Lock-in period (months, optional)</Text>
              <TextField
                value={draft.lockInMonths}
                onChangeText={(text) => updateAgreementDraft({ lockInMonths: text.replace(/\D/g, '') })}
                placeholder="0"
                keyboardType="number-pad"
                accessibilityLabel="Lock-in period in months"
              />
            </View>
            <View className="flex-1 gap-1.5">
              <Text className="font-body-bold text-[12px] text-text-muted">Notice period (days)</Text>
              <TextField
                value={draft.noticePeriodDays}
                onChangeText={(text) => updateAgreementDraft({ noticePeriodDays: text.replace(/\D/g, '') })}
                placeholder="30"
                keyboardType="number-pad"
                accessibilityLabel="Notice period in days"
              />
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 gap-1.5">
              <Text className="font-body-bold text-[12px] text-text-muted">Monthly rent (₹)</Text>
              <TextField
                value={draft.monthlyRent}
                onChangeText={(text) => updateAgreementDraft({ monthlyRent: text.replace(/\D/g, '') })}
                placeholder="25000"
                keyboardType="number-pad"
                accessibilityLabel="Monthly rent"
              />
            </View>
            <View className="flex-1 gap-1.5">
              <Text className="font-body-bold text-[12px] text-text-muted">Security deposit (₹)</Text>
              <TextField
                value={draft.securityDeposit}
                onChangeText={(text) => updateAgreementDraft({ securityDeposit: text.replace(/\D/g, '') })}
                placeholder="100000"
                keyboardType="number-pad"
                accessibilityLabel="Security deposit"
              />
            </View>
          </View>

          <View className="gap-1.5">
            <Text className="font-body-bold text-[12px] text-text-muted">Rent escalation</Text>
            <SegmentedControl
              options={ESCALATION_FREQUENCIES}
              value={draft.escalationFrequency}
              onChange={(value) => updateAgreementDraft({ escalationFrequency: value })}
            />
          </View>
          {draft.escalationFrequency === 'annual' ? (
            <View className="gap-1.5">
              <Text className="font-body-bold text-[12px] text-text-muted">Escalation (%)</Text>
              <TextField
                value={draft.escalationPercent}
                onChangeText={(text) => updateAgreementDraft({ escalationPercent: text.replace(/\D/g, '') })}
                placeholder="5"
                keyboardType="number-pad"
                accessibilityLabel="Escalation percent"
              />
            </View>
          ) : null}

          <View className="flex-row items-center justify-between rounded-md border border-border bg-surface px-3.5 py-3">
            <Text className="font-body-bold text-[13px] text-text">Auto-renewal</Text>
            <Switch
              value={draft.autoRenewal}
              onValueChange={(value) => updateAgreementDraft({ autoRenewal: value })}
              trackColor={{ false: '#DADEDE', true: '#1F7A6E' }}
            />
          </View>

          <Pressable
            onPress={handleContinue}
            disabled={!canContinue}
            accessibilityRole="button"
            className={`w-full items-center justify-center rounded-sm px-4 py-3 active:opacity-90 ${
              canContinue ? 'bg-primary' : 'bg-surface-2'
            }`}>
            <Text className={`font-body-bold text-[14px] ${canContinue ? 'text-on-primary' : 'text-text-faint'}`}>
              Continue
            </Text>
          </Pressable>
        </ContentColumn>
      </ScrollView>
    </SafeAreaView>
  );
}
