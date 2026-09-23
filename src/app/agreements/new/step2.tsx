import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TextField } from '@/components/form/text-field';
import { ContentColumn } from '@/components/layout/content-column';
import { WizardHeader } from '@/components/nav/wizard-header';
import { Banner } from '@/components/ui/banner';
import { Chip } from '@/components/ui/chip';
import {
  computeRegistrationDeadline,
  computeStampDutyEstimate,
  formatInr,
  tenureMonths,
} from '@/features/agreements/calculations';
import { clearAgreementDraft, updateAgreementDraft, useAgreementDraft } from '@/features/agreements/draft-store';
import { useLegalConfig } from '@/features/legal-content/hooks';
import { useProperty } from '@/features/properties/hooks';

export default function NewAgreementStep2Screen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { data: property } = useProperty(propertyId);
  const { data: config, isLoading: configLoading } = useLegalConfig();
  const draft = useAgreementDraft();

  const handleClose = () => {
    clearAgreementDraft();
    // The X always means "cancel the wizard," not "go back one step" — dismiss
    // every modal step pushed so far in one go, however far in we are.
    router.dismissAll();
  };

  if (!draft || !property) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <WizardHeader title="Legal & Compliance" step={2} totalSteps={3} onClose={handleClose} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1F7A6E" />
        </View>
      </SafeAreaView>
    );
  }

  const isSupportedState = property.state === 'Maharashtra';

  if (!isSupportedState || configLoading || !config) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <WizardHeader title="Legal & Compliance" step={2} totalSteps={3} onClose={handleClose} />
        <View className="flex-1 items-center justify-center px-6">
          {configLoading ? (
            <ActivityIndicator color="#1F7A6E" />
          ) : (
            <Banner variant="info">
              <Text className="font-body text-[12.5px] leading-5 text-info-fg">
                Compliance guidance for {property.state} is coming soon — agreements here can still be created, but
                without registration/stamp-duty numbers.
              </Text>
            </Banner>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const months = tenureMonths(draft.startDate, draft.endDate);
  const tenureOk = months <= config.maxTenureMonths;
  const registrationDeadline = computeRegistrationDeadline(draft.startDate, config.registration.windowMonths);
  const stampDuty = computeStampDutyEstimate({
    monthlyRent: Number(draft.monthlyRent || 0),
    securityDeposit: Number(draft.securityDeposit || 0),
    startDate: draft.startDate,
    endDate: draft.endDate,
  });

  const canContinue = tenureOk;

  const handleContinue = () => {
    if (!canContinue) return;
    router.push({ pathname: '/agreements/new/step3', params: { propertyId } });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <WizardHeader title="Legal & Compliance" step={2} totalSteps={3} onClose={handleClose} />
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingHorizontal: 16 }}>
        <ContentColumn className="gap-4 py-4">
          <Banner variant="info">
            <Text className="font-body text-[12.5px] leading-5 text-info-fg">
              Applying Maharashtra Legal Config v{config.version} · last updated {config.lastUpdated}
            </Text>
          </Banner>

          <View className="gap-1.5 rounded-md border border-border bg-surface px-3.5 py-3">
            <Text className="font-body-bold text-[11px] uppercase tracking-wide text-text-muted">
              Registration deadline
            </Text>
            <Text className="font-body-bold text-[14px] text-text">{registrationDeadline}</Text>
            <Text className="font-body text-[12px] leading-4 text-text-muted">
              {config.registration.windowMonths} months from execution · duty on {config.registration.dutyOn}
            </Text>
          </View>

          <View className="flex-row items-center justify-between rounded-md border border-border bg-surface px-3.5 py-3">
            <View>
              <Text className="font-body-bold text-[11px] uppercase tracking-wide text-text-muted">
                Maximum tenure
              </Text>
              <Text className="font-body text-[12.5px] text-text-muted">
                {months} of {config.maxTenureMonths} months allowed
              </Text>
            </View>
            <Chip variant={tenureOk ? 'success' : 'error'}>{tenureOk ? 'Within limit' : 'Exceeds limit'}</Chip>
          </View>
          {!tenureOk ? (
            <Banner variant="error">
              <Text className="font-body text-[12.5px] leading-5 text-danger-fg">
                This tenure exceeds Maharashtra&apos;s {config.maxTenureMonths}-month cap (BR-09). Go back and adjust
                the start or end date before continuing.
              </Text>
            </Banner>
          ) : null}

          <View className="gap-1.5 rounded-md border border-border bg-surface px-3.5 py-3">
            <Text className="font-body-bold text-[11px] uppercase tracking-wide text-text-muted">
              Stamp duty estimate
            </Text>
            <Text className="font-body-bold text-[14px] text-text">{formatInr(stampDuty)}</Text>
            <Text className="font-body text-[12px] leading-4 text-text-muted">{config.stampDuty.formula}</Text>
            <Text className="font-body text-[11px] text-text-faint">Estimate only — not final.</Text>
          </View>

          <View className="gap-1.5">
            <Text className="font-body-bold text-[12px] text-text-muted">Witness 1</Text>
            <View className="flex-row gap-2.5">
              <View className="flex-1">
                <TextField
                  value={draft.witness1Name}
                  onChangeText={(text) => updateAgreementDraft({ witness1Name: text })}
                  placeholder="Name"
                  accessibilityLabel="Witness 1 name"
                />
              </View>
              <View className="flex-1">
                <TextField
                  value={draft.witness1Phone}
                  onChangeText={(text) => updateAgreementDraft({ witness1Phone: text.replace(/\D/g, '').slice(0, 10) })}
                  placeholder="Phone number"
                  keyboardType="number-pad"
                  maxLength={10}
                  accessibilityLabel="Witness 1 phone number"
                />
              </View>
            </View>
          </View>

          <View className="gap-1.5">
            <Text className="font-body-bold text-[12px] text-text-muted">Witness 2</Text>
            <View className="flex-row gap-2.5">
              <View className="flex-1">
                <TextField
                  value={draft.witness2Name}
                  onChangeText={(text) => updateAgreementDraft({ witness2Name: text })}
                  placeholder="Name"
                  accessibilityLabel="Witness 2 name"
                />
              </View>
              <View className="flex-1">
                <TextField
                  value={draft.witness2Phone}
                  onChangeText={(text) => updateAgreementDraft({ witness2Phone: text.replace(/\D/g, '').slice(0, 10) })}
                  placeholder="Phone number"
                  keyboardType="number-pad"
                  maxLength={10}
                  accessibilityLabel="Witness 2 phone number"
                />
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => updateAgreementDraft({ policeVerificationDone: !draft.policeVerificationDone })}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: draft.policeVerificationDone }}
            className="flex-row items-center gap-2.5 rounded-md border border-border bg-surface px-3.5 py-3">
            <View
              className={`h-5 w-5 items-center justify-center rounded-[4px] border ${
                draft.policeVerificationDone ? 'border-primary bg-primary' : 'border-border-strong bg-surface'
              }`}>
              {draft.policeVerificationDone ? <Text className="text-[12px] text-on-primary">✓</Text> : null}
            </View>
            <View className="flex-1">
              <Text className="font-body-bold text-[13px] text-text">Police verification completed</Text>
              <Text className="font-body text-[11.5px] text-text-muted">Recommended, not required (BR-12).</Text>
            </View>
          </Pressable>

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
