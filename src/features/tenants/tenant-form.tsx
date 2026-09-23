import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { TextField } from '@/components/form/text-field';
import { ContentColumn } from '@/components/layout/content-column';
import { Banner } from '@/components/ui/banner';
import { isValidAadhaar, isValidPan } from '@/lib/format';

import { useTenantPhotoUrl } from './hooks';
import type { Tenant, TenantInput, TenantPhotoChange } from './types';

const PHONE_PATTERN = /^[6-9]\d{9}$/;

type TenantFormProps = {
  initialValues?: Tenant;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (input: TenantInput, photoChange: TenantPhotoChange) => Promise<{ error: string | null }>;
};

function Stepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <View className="flex-row items-center gap-3 self-start rounded-sm border border-border bg-surface px-2 py-1.5">
      <Pressable
        onPress={() => onChange(Math.max(1, value - 1))}
        accessibilityRole="button"
        accessibilityLabel="Decrease occupants"
        className="h-7 w-7 items-center justify-center rounded-sm active:bg-surface-2">
        <Ionicons name="remove" size={16} color="#5B6363" />
      </Pressable>
      <Text className="w-6 text-center font-body-bold text-[14px] text-text">{value}</Text>
      <Pressable
        onPress={() => onChange(value + 1)}
        accessibilityRole="button"
        accessibilityLabel="Increase occupants"
        className="h-7 w-7 items-center justify-center rounded-sm active:bg-surface-2">
        <Ionicons name="add" size={16} color="#5B6363" />
      </Pressable>
    </View>
  );
}

export function TenantForm({ initialValues, submitLabel, submittingLabel, onSubmit }: TenantFormProps) {
  const initialPhoneDigits = initialValues?.phone.replace(/^\+91/, '') ?? '';

  const [name, setName] = useState(initialValues?.name ?? '');
  const [phone, setPhone] = useState(initialPhoneDigits);
  const [aadhaar, setAadhaar] = useState(initialValues?.aadhaarNumber ?? '');
  const [pan, setPan] = useState(initialValues?.panNumber ?? '');
  const [permanentAddress, setPermanentAddress] = useState(initialValues?.permanentAddress ?? '');
  const [occupantsCount, setOccupantsCount] = useState(initialValues?.occupantsCount ?? 1);
  const [emergencyName, setEmergencyName] = useState(initialValues?.emergencyContactName ?? '');
  const [emergencyPhone, setEmergencyPhone] = useState(initialValues?.emergencyContactPhone ?? '');
  const [pickedPhoto, setPickedPhoto] = useState<{ uri: string; mimeType: string | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: existingPhotoUrl } = useTenantPhotoUrl(pickedPhoto ? null : (initialValues?.photoPath ?? null));

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library access is needed to add a picture. Enable it in system settings and try again.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    setPickedPhoto({ uri: asset.uri, mimeType: asset.mimeType ?? null });
  };

  const isNameValid = name.trim().length > 0;
  const isPhoneValid = PHONE_PATTERN.test(phone);
  const isAadhaarValid = aadhaar.length === 0 || isValidAadhaar(aadhaar);
  const isPanValid = pan.length === 0 || isValidPan(pan);
  const isAddressValid = permanentAddress.trim().length > 0;
  const canSubmit = isNameValid && isPhoneValid && isAadhaarValid && isPanValid && isAddressValid && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    const photoChange: TenantPhotoChange = pickedPhoto
      ? { kind: 'upload', localUri: pickedPhoto.uri, mimeType: pickedPhoto.mimeType }
      : { kind: 'unchanged' };
    const { error: submitError } = await onSubmit(
      {
        name: name.trim(),
        phone: `+91${phone}`,
        aadhaarNumber: aadhaar || null,
        panNumber: pan ? pan.toUpperCase() : null,
        permanentAddress: permanentAddress.trim(),
        occupantsCount,
        emergencyContactName: emergencyName.trim() || null,
        emergencyContactPhone: emergencyPhone.trim() || null,
      },
      photoChange
    );
    setSubmitting(false);
    if (submitError) {
      setError(submitError);
    }
  };

  return (
    <KeyboardAwareScrollView
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}>
      <ContentColumn className="gap-4 px-4 py-4">
        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Photo (optional)</Text>
          {pickedPhoto || existingPhotoUrl ? (
            <Image
              source={{ uri: pickedPhoto ? pickedPhoto.uri : existingPhotoUrl }}
              contentFit="cover"
              className="h-24 w-24 rounded-md border border-border bg-surface-2"
            />
          ) : (
            <View className="h-24 w-24 items-center justify-center rounded-md border border-border bg-surface-2">
              <Ionicons name="person" size={32} color="#8B9494" />
            </View>
          )}
          <Pressable
            onPress={handlePickPhoto}
            accessibilityRole="button"
            className="w-full items-center justify-center rounded-sm border border-border-strong px-4 py-2.5 active:bg-surface-2">
            <Text className="font-body-bold text-[13px] text-text">
              {pickedPhoto || existingPhotoUrl ? 'Change photo' : 'Add photo'}
            </Text>
          </Pressable>
        </View>

        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Name</Text>
          <TextField value={name} onChangeText={setName} placeholder="Full name" accessibilityLabel="Name" />
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

        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Permanent address</Text>
          <TextField
            value={permanentAddress}
            onChangeText={setPermanentAddress}
            placeholder="Full permanent address"
            multiline
            numberOfLines={3}
            accessibilityLabel="Permanent address"
          />
        </View>

        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Number of occupants</Text>
          <Stepper value={occupantsCount} onChange={setOccupantsCount} />
        </View>

        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Emergency contact (optional)</Text>
          <View className="flex-row gap-2.5">
            <View className="flex-1">
              <TextField
                value={emergencyName}
                onChangeText={setEmergencyName}
                placeholder="Contact name"
                accessibilityLabel="Emergency contact name"
              />
            </View>
            <View className="flex-1">
              <TextField
                value={emergencyPhone}
                onChangeText={(text) => setEmergencyPhone(text.replace(/\D/g, '').slice(0, 10))}
                placeholder="Contact phone"
                keyboardType="number-pad"
                maxLength={10}
                accessibilityLabel="Emergency contact phone"
              />
            </View>
          </View>
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
