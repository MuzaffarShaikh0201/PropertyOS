import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContentColumn } from '@/components/layout/content-column';
import { WizardHeader } from '@/components/nav/wizard-header';
import { Banner } from '@/components/ui/banner';
import { useToast } from '@/components/ui/toast';
import { computeStampDutyEstimate, formatInr, tenureMonths } from '@/features/agreements/calculations';
import { clearAgreementDraft, updateAgreementDraft, useAgreementDraft } from '@/features/agreements/draft-store';
import { uploadAgreementDocument } from '@/features/agreements/documents';
import { useCreateAgreement, useMarkAgreementRenewed, useUpdateAgreementDocuments } from '@/features/agreements/hooks';
import { AGREEMENT_DOC_TYPES, type AgreementDocType, type AgreementDocuments } from '@/features/agreements/types';
import { useLegalConfig } from '@/features/legal-content/hooks';
import { useOwner } from '@/features/owners/hooks';
import { useProperty } from '@/features/properties/hooks';
import { useTenant } from '@/features/tenants/hooks';

const ACCEPTED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/*',
];

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="font-body text-[12.5px] text-text-muted">{label}</Text>
      <Text className="font-body-bold text-[12.5px] text-text">{value}</Text>
    </View>
  );
}

export default function NewAgreementStep3Screen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { data: property } = useProperty(propertyId);
  const { data: owner } = useOwner(property?.ownerId ?? '');
  const draft = useAgreementDraft();
  const { data: tenant } = useTenant(draft?.tenantId);
  const { data: config } = useLegalConfig();
  const createAgreement = useCreateAgreement();
  const updateDocuments = useUpdateAgreementDocuments();
  const markRenewed = useMarkAgreementRenewed();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    clearAgreementDraft();
    // The X always means "cancel the wizard," not "go back one step" — dismiss
    // every modal step pushed so far in one go, however far in we are.
    router.dismissAll();
  };

  if (!draft || !property || !config) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <WizardHeader title="Documents & Review" step={3} totalSteps={3} onClose={handleClose} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1F7A6E" />
        </View>
      </SafeAreaView>
    );
  }

  const months = tenureMonths(draft.startDate, draft.endDate);
  const stampDuty = computeStampDutyEstimate({
    monthlyRent: Number(draft.monthlyRent || 0),
    securityDeposit: Number(draft.securityDeposit || 0),
    startDate: draft.startDate,
    endDate: draft.endDate,
  });

  const handlePickDocument = async (docType: AgreementDocType) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ACCEPTED_DOCUMENT_TYPES,
      copyToCacheDirectory: true,
    });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    updateAgreementDraft({
      pickedDocuments: {
        ...draft.pickedDocuments,
        [docType]: { uri: asset.uri, mimeType: asset.mimeType ?? null, name: asset.name },
      },
    });
  };

  const handleCreate = async () => {
    if (submitting || !draft.tenantId) return;
    setSubmitting(true);
    try {
      const agreement = await createAgreement.mutateAsync({
        propertyId,
        tenantId: draft.tenantId,
        startDate: draft.startDate,
        endDate: draft.endDate,
        lockInMonths: draft.lockInMonths ? Number(draft.lockInMonths) : null,
        noticePeriodDays: Number(draft.noticePeriodDays),
        monthlyRent: Number(draft.monthlyRent),
        securityDeposit: Number(draft.securityDeposit),
        escalationPercent: draft.escalationFrequency === 'annual' ? Number(draft.escalationPercent || 0) : null,
        escalationFrequency: draft.escalationFrequency,
        autoRenewal: draft.autoRenewal,
        witness1Name: draft.witness1Name || null,
        witness1Phone: draft.witness1Phone ? `+91${draft.witness1Phone}` : null,
        witness2Name: draft.witness2Name || null,
        witness2Phone: draft.witness2Phone ? `+91${draft.witness2Phone}` : null,
        policeVerificationDone: draft.policeVerificationDone,
        legalConfigVersion: config.version,
        legalConfigSnapshot: config,
        stampDutyEstimate: stampDuty,
        previousAgreementId: draft.previousAgreementId,
      });

      const documentEntries = Object.entries(draft.pickedDocuments) as [
        AgreementDocType,
        { uri: string; mimeType: string | null; name: string },
      ][];
      if (documentEntries.length > 0) {
        const documents: AgreementDocuments = {};
        for (const [docType, picked] of documentEntries) {
          const path = await uploadAgreementDocument(agreement.id, docType, picked.uri, picked.mimeType);
          documents[docType] = { path, uploadedAt: new Date().toISOString() };
        }
        await updateDocuments.mutateAsync({ id: agreement.id, documents });
      }

      if (draft.previousAgreementId) {
        await markRenewed.mutateAsync(draft.previousAgreementId);
      }

      clearAgreementDraft();
      toast.success('Agreement created.');
      // `replace` would only swap out Step 3, leaving Steps 1-2 underneath in
      // the stack — dismiss the whole modal wizard back to Property Detail
      // first, then push Agreement Detail on top of that, so Back from there
      // goes to the property, not back into the wizard.
      router.dismissAll();
      router.push(`/agreements/${agreement.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create the agreement. Try again.');
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <WizardHeader title="Documents & Review" step={3} totalSteps={3} onClose={handleClose} />
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingHorizontal: 16 }}>
        <ContentColumn className="gap-4 py-4">
          <View className="gap-1.5">
            <Text className="font-body-bold text-[12px] text-text-muted">Document checklist</Text>
            <Text className="-mt-1 font-body text-[11px] text-text-faint">PDF, Word doc, or image.</Text>
            <View className="rounded-md border border-border bg-surface px-3.5">
              {AGREEMENT_DOC_TYPES.map((doc, index) => {
                const picked = draft.pickedDocuments[doc.value];
                const isPicked = Boolean(picked);
                return (
                  <View key={doc.value}>
                    <View className="flex-row items-center justify-between py-3">
                      <View className="flex-1 pr-3">
                        <Text className="font-body-bold text-[13px] text-text">{doc.label}</Text>
                        <Text className="font-body text-[11.5px] text-text-muted" numberOfLines={1}>
                          {picked ? picked.name : doc.required ? 'Pending' : 'Pending · optional'}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handlePickDocument(doc.value)}
                        accessibilityRole="button"
                        className="flex-row items-center gap-1.5 rounded-sm border border-border-strong bg-surface px-3 py-1.5">
                        <Ionicons name={isPicked ? 'checkmark' : 'cloud-upload-outline'} size={14} color="#1B2020" />
                        <Text className="font-body-bold text-[12px] text-text">{isPicked ? 'Replace' : 'Upload'}</Text>
                      </Pressable>
                    </View>
                    {index < AGREEMENT_DOC_TYPES.length - 1 ? <View className="h-px bg-border" /> : null}
                  </View>
                );
              })}
            </View>
          </View>

          <View className="gap-1.5">
            <Text className="font-body-bold text-[12px] text-text-muted">Review</Text>
            <View className="rounded-md border border-border bg-surface px-3.5">
              <DetailRow label="Property" value={property.name} />
              <View className="h-px bg-border" />
              <DetailRow label="Licensor" value={owner?.name ?? '—'} />
              <View className="h-px bg-border" />
              <DetailRow label="Licensee" value={tenant?.name ?? '—'} />
              <View className="h-px bg-border" />
              <DetailRow label="Term" value={`${draft.startDate} → ${draft.endDate} (${months} months)`} />
              <View className="h-px bg-border" />
              <DetailRow label="Monthly rent" value={formatInr(Number(draft.monthlyRent || 0))} />
              <View className="h-px bg-border" />
              <DetailRow label="Security deposit" value={formatInr(Number(draft.securityDeposit || 0))} />
              <View className="h-px bg-border" />
              <DetailRow
                label="Escalation"
                value={draft.escalationFrequency === 'annual' ? `${draft.escalationPercent || 0}% annually` : 'None'}
              />
              <View className="h-px bg-border" />
              <DetailRow label="Notice period" value={`${draft.noticePeriodDays} days`} />
              <View className="h-px bg-border" />
              <DetailRow label="Legal Config" value={`v${config.version} (pinned)`} />
              <View className="h-px bg-border" />
              <DetailRow label="Stamp duty estimate" value={formatInr(stampDuty)} />
            </View>
          </View>

          <Banner variant="warning">
            <Text className="font-body text-[12.5px] leading-5 text-warning-fg">
              This agreement&apos;s content should be reviewed against a proper legal template or professional before
              relying on it.
            </Text>
          </Banner>

          <Pressable
            onPress={handleCreate}
            disabled={submitting}
            accessibilityRole="button"
            className={`w-full items-center justify-center rounded-sm px-4 py-3 active:opacity-90 ${
              submitting ? 'bg-surface-2' : 'bg-primary'
            }`}>
            <Text className={`font-body-bold text-[14px] ${submitting ? 'text-text-faint' : 'text-on-primary'}`}>
              {submitting ? 'Creating…' : 'Create agreement'}
            </Text>
          </Pressable>
        </ContentColumn>
      </ScrollView>
    </SafeAreaView>
  );
}
