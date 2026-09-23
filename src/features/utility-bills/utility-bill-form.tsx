import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { DatePickerField } from '@/components/form/date-picker-field';
import { TextField } from '@/components/form/text-field';
import { ContentColumn } from '@/components/layout/content-column';
import { Banner } from '@/components/ui/banner';
import { ChipSelect } from '@/components/ui/chip-select';
import { formatInr, isValidIsoDate, todayIsoDate } from '@/features/agreements/calculations';
import { useLatestAgreementForProperty } from '@/features/agreements/hooks';
import { useProperties } from '@/features/properties/hooks';

import { BILL_TYPES, RESPONSIBLE_PARTIES } from './types';
import type { BillType, ResponsibleParty, UtilityBill, UtilityBillInput } from './types';

const ACCEPTED_PROOF_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/*',
];

export type ProofChange = { kind: 'unchanged' } | { kind: 'upload'; localUri: string; mimeType: string | null; name: string };

type PaymentStatusOption = 'unpaid' | 'partial' | 'paid';
const PAYMENT_STATUS_OPTIONS: { value: PaymentStatusOption; label: string }[] = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partially paid' },
  { value: 'paid', label: 'Fully paid' },
];

type UtilityBillFormProps = {
  initialValues?: UtilityBill;
  /** Preselects the property when opened from that property's context (e.g. Utility Bills' "+"). Ignored once initialValues is set. */
  initialPropertyId?: string;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (input: UtilityBillInput, proofChange: ProofChange) => Promise<{ error: string | null }>;
};

export function UtilityBillForm({
  initialValues,
  initialPropertyId,
  submitLabel,
  submittingLabel,
  onSubmit,
}: UtilityBillFormProps) {
  const { data: properties, isLoading: propertiesLoading } = useProperties();

  const [propertyId, setPropertyId] = useState(initialValues?.propertyId ?? initialPropertyId ?? '');
  const [billType, setBillType] = useState<BillType | null>(initialValues?.billType ?? null);
  const [responsibleParty, setResponsibleParty] = useState<ResponsibleParty | null>(
    initialValues?.responsibleParty ?? null
  );
  const [billDate, setBillDate] = useState(initialValues?.billDate ?? todayIsoDate());
  const [dueDate, setDueDate] = useState(initialValues?.dueDate ?? '');
  const [amount, setAmount] = useState(initialValues?.amount ? String(initialValues.amount) : '');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusOption>(initialValues?.status ?? 'unpaid');
  const [amountPaid, setAmountPaid] = useState(initialValues?.amountPaid ? String(initialValues.amountPaid) : '');
  const [paidAt, setPaidAt] = useState(initialValues?.paidAt ?? todayIsoDate());
  const [pickedProof, setPickedProof] = useState<{ uri: string; mimeType: string | null; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: latestAgreement } = useLatestAgreementForProperty(propertyId);

  const handlePickProof = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ACCEPTED_PROOF_TYPES, copyToCacheDirectory: true });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    setPickedProof({ uri: asset.uri, mimeType: asset.mimeType ?? null, name: asset.name });
  };

  const isPropertyValid = propertyId.length > 0;
  const isAmountValid = amount.trim().length > 0 && Number(amount) > 0;
  const isDueDateValid = isValidIsoDate(dueDate) && dueDate >= billDate;
  const isAmountPaidValid =
    paymentStatus !== 'partial' || (amountPaid.trim().length > 0 && Number(amountPaid) > 0 && Number(amountPaid) < Number(amount || 0));
  const isPaidAtValid = paymentStatus !== 'partial' || isValidIsoDate(paidAt);
  const canSubmit =
    isPropertyValid &&
    billType !== null &&
    responsibleParty !== null &&
    isAmountValid &&
    isDueDateValid &&
    isAmountPaidValid &&
    isPaidAtValid &&
    !submitting;

  const shortfall = paymentStatus === 'partial' && isAmountValid && amountPaid ? Number(amount) - Number(amountPaid) : null;

  const handleSubmit = async () => {
    if (!canSubmit || !billType || !responsibleParty) return;
    setError(null);
    setSubmitting(true);
    const proofChange: ProofChange = pickedProof
      ? { kind: 'upload', localUri: pickedProof.uri, mimeType: pickedProof.mimeType, name: pickedProof.name }
      : { kind: 'unchanged' };
    const { error: submitError } = await onSubmit(
      {
        propertyId,
        agreementId: initialValues?.agreementId ?? latestAgreement?.id ?? null,
        billType,
        responsibleParty,
        billDate,
        dueDate,
        amount: Number(amount),
        status: paymentStatus,
        amountPaid: paymentStatus === 'partial' ? Number(amountPaid) : paymentStatus === 'paid' ? Number(amount) : null,
        paidAt: paymentStatus === 'partial' ? paidAt : paymentStatus === 'paid' ? todayIsoDate() : null,
      },
      proofChange
    );
    setSubmitting(false);
    if (submitError) setError(submitError);
  };

  return (
    <KeyboardAwareScrollView
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}>
      <ContentColumn className="gap-4 px-4 py-4">
        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Property</Text>
          {propertiesLoading ? (
            <ActivityIndicator color="#1F7A6E" />
          ) : (
            <ChipSelect
              options={(properties ?? []).map((property) => ({ value: property.id, label: property.name }))}
              value={propertyId || null}
              onChange={setPropertyId}
            />
          )}
        </View>

        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Bill type</Text>
          <ChipSelect options={BILL_TYPES} value={billType} onChange={setBillType} />
        </View>

        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Responsible party</Text>
          <ChipSelect options={RESPONSIBLE_PARTIES} value={responsibleParty} onChange={setResponsibleParty} />
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <DatePickerField
              label="Bill date"
              value={billDate}
              onChangeDate={(iso) => {
                setBillDate(iso);
                if (dueDate && dueDate < iso) setDueDate('');
              }}
              accessibilityLabel="Bill date"
            />
          </View>
          <View className="flex-1">
            <DatePickerField
              label="Due date"
              value={dueDate}
              onChangeDate={setDueDate}
              minimumDate={billDate}
              accessibilityLabel="Due date"
            />
          </View>
        </View>

        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Bill amount (₹)</Text>
          <TextField
            value={amount}
            onChangeText={(text) => setAmount(text.replace(/\D/g, ''))}
            placeholder="1500"
            keyboardType="number-pad"
            accessibilityLabel="Bill amount"
          />
        </View>

        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Payment status</Text>
          <ChipSelect options={PAYMENT_STATUS_OPTIONS} value={paymentStatus} onChange={setPaymentStatus} />
        </View>

        {paymentStatus === 'partial' ? (
          <>
            <View className="flex-row gap-3">
              <View className="flex-1 gap-1.5">
                <Text className="font-body-bold text-[12px] text-text-muted">Amount paid (₹)</Text>
                <TextField
                  value={amountPaid}
                  onChangeText={(text) => setAmountPaid(text.replace(/\D/g, ''))}
                  placeholder="1000"
                  keyboardType="number-pad"
                  accessibilityLabel="Amount paid"
                />
              </View>
              <View className="flex-1">
                <DatePickerField label="Date paid" value={paidAt} onChangeDate={setPaidAt} accessibilityLabel="Date paid" />
              </View>
            </View>
            {shortfall != null ? (
              <Text className="-mt-2 font-body text-[12px] text-text-muted">
                Shortfall: {formatInr(shortfall)} — tracked separately, never added to the next bill.
              </Text>
            ) : null}
          </>
        ) : null}

        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Proof of payment (optional)</Text>
          <Pressable
            onPress={handlePickProof}
            accessibilityRole="button"
            className="flex-row items-center justify-between rounded-sm border border-border-strong bg-surface px-3.5 py-2.5 active:bg-surface-2">
            <Text className="flex-1 font-body text-[13px] text-text" numberOfLines={1}>
              {pickedProof ? pickedProof.name : initialValues?.proofDocumentPath ? 'Replace uploaded proof' : 'Attach receipt or screenshot'}
            </Text>
            <Ionicons name="cloud-upload-outline" size={16} color="#5B6363" />
          </Pressable>
        </View>

        {error ? (
          <Banner variant="error">
            <Text className="font-body text-[12.5px] leading-5 text-danger-fg">{error}</Text>
          </Banner>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
          className={`w-full items-center justify-center rounded-sm px-4 py-3 active:opacity-90 ${
            canSubmit ? 'bg-primary' : 'bg-surface-2'
          }`}>
          <Text className={`font-body-bold text-[14px] ${canSubmit ? 'text-on-primary' : 'text-text-faint'}`}>
            {submitting ? submittingLabel : submitLabel}
          </Text>
        </Pressable>
      </ContentColumn>
    </KeyboardAwareScrollView>
  );
}
