import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { TextField } from '@/components/form/text-field';
import { ContentColumn } from '@/components/layout/content-column';
import { Banner } from '@/components/ui/banner';
import { useOwners } from '@/features/owners/hooks';

import { PropertyImage } from './property-image';
import { BHK_OPTIONS, FURNISHING_OPTIONS, PROPERTY_TYPES } from './types';
import type { Bhk, Furnishing, Property, PropertyImageChange, PropertyInput, PropertyType } from './types';

const PINCODE_PATTERN = /^\d{6}$/;

type PropertyFormProps = {
  initialValues?: Property;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (input: PropertyInput, imageChange: PropertyImageChange) => Promise<{ error: string | null }>;
};

function ChipSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            className={`rounded-pill border px-3 py-1.5 ${
              isActive ? 'border-primary bg-primary' : 'border-border bg-surface'
            }`}>
            <Text
              className={`font-body-bold text-[12.5px] ${isActive ? 'text-on-primary' : 'text-text-muted'}`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PropertyForm({ initialValues, submitLabel, submittingLabel, onSubmit }: PropertyFormProps) {
  const { data: owners, isLoading: ownersLoading } = useOwners();

  const [ownerId, setOwnerId] = useState(initialValues?.ownerId ?? '');
  const [name, setName] = useState(initialValues?.name ?? '');
  const [propertyType, setPropertyType] = useState<PropertyType | null>(initialValues?.propertyType ?? null);
  const [bhk, setBhk] = useState<Bhk | null>(initialValues?.bhk ?? null);
  const [areaSqft, setAreaSqft] = useState(initialValues?.areaSqft ? String(initialValues.areaSqft) : '');
  const [furnishing, setFurnishing] = useState<Furnishing | null>(initialValues?.furnishing ?? null);
  const [addressLine1, setAddressLine1] = useState(initialValues?.addressLine1 ?? '');
  const [locality, setLocality] = useState(initialValues?.locality ?? '');
  const [city, setCity] = useState(initialValues?.city ?? 'Mumbai');
  const [pincode, setPincode] = useState(initialValues?.pincode ?? '');
  const [notes, setNotes] = useState(initialValues?.notes ?? '');
  const [pickedImage, setPickedImage] = useState<{ uri: string; mimeType: string | null } | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasExistingImage = Boolean(initialValues?.imagePath) && !imageRemoved;

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library access is needed to add a picture. Enable it in system settings and try again.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    setPickedImage({ uri: asset.uri, mimeType: asset.mimeType ?? null });
    setImageRemoved(false);
  };

  const handleRemoveImage = () => {
    setPickedImage(null);
    setImageRemoved(true);
  };

  const isOwnerValid = ownerId.length > 0;
  const isNameValid = name.trim().length > 0;
  const isAddressValid = addressLine1.trim().length > 0;
  const isLocalityValid = locality.trim().length > 0;
  const isCityValid = city.trim().length > 0;
  const isPincodeValid = PINCODE_PATTERN.test(pincode);
  const isComplete =
    isOwnerValid &&
    isNameValid &&
    propertyType !== null &&
    bhk !== null &&
    furnishing !== null &&
    isAddressValid &&
    isLocalityValid &&
    isCityValid &&
    isPincodeValid;
  const canSubmit = isComplete && !submitting;

  const missingFields = [
    !isOwnerValid && 'Owner',
    !isNameValid && 'Label',
    propertyType === null && 'Property type',
    bhk === null && 'Configuration',
    furnishing === null && 'Furnishing',
    !isAddressValid && 'Building / house & flat no.',
    !isLocalityValid && 'Locality / area',
    !isCityValid && 'City',
    !isPincodeValid && 'Pincode',
  ].filter((field): field is string => Boolean(field));

  const handleSubmit = async () => {
    if (!canSubmit || !propertyType || !bhk || !furnishing) return;
    setError(null);
    setSubmitting(true);
    const imageChange: PropertyImageChange = pickedImage
      ? { kind: 'upload', localUri: pickedImage.uri, mimeType: pickedImage.mimeType }
      : imageRemoved
        ? { kind: 'remove' }
        : { kind: 'unchanged' };
    const { error: submitError } = await onSubmit(
      {
        ownerId,
        name: name.trim(),
        propertyType,
        bhk,
        areaSqft: areaSqft ? Number(areaSqft) : null,
        furnishing,
        addressLine1: addressLine1.trim(),
        locality: locality.trim(),
        city: city.trim(),
        pincode,
        notes: notes.trim() || null,
      },
      imageChange
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
          {pickedImage ? (
            <Image
              source={{ uri: pickedImage.uri }}
              contentFit="cover"
              className="h-44 w-full rounded-md border border-border bg-surface-2"
            />
          ) : (
            <PropertyImage imagePath={hasExistingImage ? (initialValues?.imagePath ?? null) : null} size="hero" />
          )}
          <View className="flex-row gap-2">
            <Pressable
              onPress={handlePickImage}
              accessibilityRole="button"
              className="flex-1 items-center justify-center rounded-sm border border-border-strong px-4 py-2.5 active:bg-surface-2">
              <Text className="font-body-bold text-[13px] text-text">
                {pickedImage || hasExistingImage ? 'Change photo' : 'Add photo'}
              </Text>
            </Pressable>
            {pickedImage || hasExistingImage ? (
              <Pressable
                onPress={handleRemoveImage}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
                className="h-10 w-10 items-center justify-center rounded-sm border border-border bg-surface active:bg-surface-2">
                <Ionicons name="trash-outline" size={16} color="#A23B2E" />
              </Pressable>
            ) : null}
          </View>
          <Text className="font-body text-[12px] text-text-faint">
            No photo? A default image is shown instead — this is entirely optional.
          </Text>
        </View>

        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Owner</Text>
          {ownersLoading ? (
            <ActivityIndicator color="#1F7A6E" />
          ) : owners && owners.length > 0 ? (
            <ChipSelect
              options={owners.map((owner) => ({ value: owner.id, label: owner.name }))}
              value={ownerId || null}
              onChange={setOwnerId}
            />
          ) : (
            <Banner variant="warning">
              <Text className="font-body text-[12.5px] leading-5 text-warning-fg">
                No owners yet — add one before you can register a property.
              </Text>
              <Pressable
                onPress={() => router.push('/owners/new')}
                accessibilityRole="button"
                className="self-start rounded-sm border border-border-strong bg-surface px-3 py-1.5">
                <Text className="font-body-bold text-[12px] text-text">Add owner</Text>
              </Pressable>
            </Banner>
          )}
        </View>

        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Label</Text>
          <TextField
            value={name}
            onChangeText={setName}
            placeholder="e.g. A-402, Sunshine CHS"
            accessibilityLabel="Property label"
          />
        </View>

        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Property type (required)</Text>
          <ChipSelect options={PROPERTY_TYPES} value={propertyType} onChange={setPropertyType} />
        </View>

        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Configuration (required)</Text>
          <ChipSelect options={BHK_OPTIONS} value={bhk} onChange={setBhk} />
        </View>

        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Area in sq. ft. (optional)</Text>
          <TextField
            value={areaSqft}
            onChangeText={(text) => setAreaSqft(text.replace(/\D/g, ''))}
            placeholder="650"
            keyboardType="number-pad"
            accessibilityLabel="Area in square feet"
          />
        </View>

        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Furnishing (required)</Text>
          <ChipSelect options={FURNISHING_OPTIONS} value={furnishing} onChange={setFurnishing} />
        </View>

        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Building / house & flat no.</Text>
          <TextField
            value={addressLine1}
            onChangeText={setAddressLine1}
            placeholder="Sunshine CHS, A-402"
            accessibilityLabel="Building and flat number"
          />
        </View>

        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Locality / area</Text>
          <TextField
            value={locality}
            onChangeText={setLocality}
            placeholder="Powai"
            accessibilityLabel="Locality or area"
          />
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 gap-1.5">
            <Text className="font-body-bold text-[12px] text-text-muted">City</Text>
            <TextField value={city} onChangeText={setCity} placeholder="Mumbai" accessibilityLabel="City" />
          </View>
          <View className="w-28 gap-1.5">
            <Text className="font-body-bold text-[12px] text-text-muted">Pincode</Text>
            <TextField
              value={pincode}
              onChangeText={(text) => setPincode(text.replace(/\D/g, '').slice(0, 6))}
              placeholder="400076"
              keyboardType="number-pad"
              maxLength={6}
              accessibilityLabel="Pincode"
            />
          </View>
        </View>
        {pincode.length > 0 && !isPincodeValid ? (
          <Text className="-mt-2 font-body text-[12px] text-danger-fg">Pincode must be 6 digits.</Text>
        ) : null}

        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">State</Text>
          <View className="w-full rounded-sm border border-border bg-surface-2 px-3 py-2.5">
            <Text className="font-body text-[14px] text-text-muted">Maharashtra</Text>
          </View>
        </View>

        <View className="gap-1.5">
          <Text className="font-body-bold text-[12px] text-text-muted">Notes (optional)</Text>
          <TextField
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything worth remembering about this property"
            multiline
            numberOfLines={3}
            accessibilityLabel="Notes"
          />
        </View>

        {!isComplete && missingFields.length > 0 ? (
          <Banner variant="warning">
            <Text className="font-body text-[12.5px] leading-5 text-warning-fg">
              Still needed before you can save: {missingFields.join(', ')}.
            </Text>
          </Banner>
        ) : null}

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
