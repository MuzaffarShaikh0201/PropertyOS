import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { TextField } from '@/components/form/text-field';
import { Banner } from '@/components/ui/banner';
import { isValidAadhaar, isValidPan } from '@/lib/format';

import type { Owner, OwnerInput } from './types';

const PHONE_PATTERN = /^[6-9]\d{9}$/;

type OwnerFormProps = {
  initialValues?: Owner;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (input: OwnerInput) => Promise<{ error: string | null }>;
};

export function OwnerForm({ initialValues, submitLabel, submittingLabel, onSubmit }: OwnerFormProps) {
  const initialPhoneDigits = initialValues?.phone.replace(/^\+91/, '') ?? '';

  const [name, setName] = useState(initialValues?.name ?? '');
  const [relation, setRelation] = useState(initialValues?.relation ?? '');
  const [phone, setPhone] = useState(initialPhoneDigits);
  const [email, setEmail] = useState(initialValues?.email ?? '');
  const [aadhaar, setAadhaar] = useState(initialValues?.aadhaarNumber ?? '');
  const [pan, setPan] = useState(initialValues?.panNumber ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNameValid = name.trim().length > 0;
  const isRelationValid = relation.trim().length > 0;
  const isPhoneValid = PHONE_PATTERN.test(phone);
  const isAadhaarValid = aadhaar.length === 0 || isValidAadhaar(aadhaar);
  const isPanValid = pan.length === 0 || isValidPan(pan);
  const canSubmit =
    isNameValid && isRelationValid && isPhoneValid && isAadhaarValid && isPanValid && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    const { error: submitError } = await onSubmit({
      name: name.trim(),
      relation: relation.trim(),
      phone: `+91${phone}`,
      email: email.trim() || null,
      aadhaarNumber: aadhaar || null,
      panNumber: pan ? pan.toUpperCase() : null,
    });
    setSubmitting(false);
    if (submitError) {
      setError(submitError);
    }
  };

  return (
    <KeyboardAwareScrollView
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flexGrow: 1 }}>
      <View className="gap-4 px-4 py-4">
        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Name</Text>
          <TextField value={name} onChangeText={setName} placeholder="Full name" accessibilityLabel="Name" />
        </View>

        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Relation to you</Text>
          <TextField
            value={relation}
            onChangeText={setRelation}
            placeholder="Self, Father, Mother, …"
            accessibilityLabel="Relation to you"
          />
        </View>

        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Mobile number</Text>
          <View className="flex-row gap-2.5">
            <View className="w-16 items-center justify-center rounded-sm border border-border bg-surface px-3 py-2.5">
              <Text className="font-body text-[14px] text-text">+91</Text>
            </View>
            <View className="flex-1">
              <TextField
                value={phone}
                onChangeText={(text) => setPhone(text.replace(/\D/g, '').slice(0, 10))}
                placeholder="98765 43210"
                keyboardType="number-pad"
                maxLength={10}
                accessibilityLabel="Mobile number"
              />
            </View>
          </View>
        </View>

        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Email (optional)</Text>
          <TextField
            value={email}
            onChangeText={setEmail}
            placeholder="owner@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Email"
          />
        </View>

        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Aadhaar number (optional)</Text>
          <TextField
            value={aadhaar}
            onChangeText={(text) => setAadhaar(text.replace(/\D/g, '').slice(0, 12))}
            placeholder="12-digit Aadhaar number"
            keyboardType="number-pad"
            maxLength={12}
            accessibilityLabel="Aadhaar number"
          />
          {aadhaar.length > 0 && !isAadhaarValid ? (
            <Text className="font-body text-[12px] text-danger-fg">Aadhaar number must be 12 digits.</Text>
          ) : null}
        </View>

        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">PAN (optional)</Text>
          <TextField
            value={pan}
            onChangeText={(text) => setPan(text.toUpperCase().slice(0, 10))}
            placeholder="ABCDE1234F"
            autoCapitalize="characters"
            maxLength={10}
            accessibilityLabel="PAN"
          />
          {pan.length > 0 && !isPanValid ? (
            <Text className="font-body text-[12px] text-danger-fg">Enter a valid PAN (e.g. ABCDE1234F).</Text>
          ) : null}
        </View>

        <Banner variant="info">
          <Text className="font-body text-[12.5px] leading-5 text-info-fg">
            Aadhaar and PAN are required before this owner&apos;s profile can be used as Licensor on an
            agreement — you can add them later.
          </Text>
        </Banner>

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
      </View>
    </KeyboardAwareScrollView>
  );
}
