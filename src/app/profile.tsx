import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TextField } from '@/components/form/text-field';
import { ContentColumn } from '@/components/layout/content-column';
import { ScreenHeader } from '@/components/nav/screen-header';
import { Banner } from '@/components/ui/banner';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';

const PHONE_PATTERN = /^[6-9]\d{9}$/;

function readMetadataString(metadata: Record<string, unknown> | undefined, key: string): string {
  const value = metadata?.[key];
  return typeof value === 'string' ? value : '';
}

export default function ProfileScreen() {
  const { session, updateProfile } = useAuth();
  const toast = useToast();

  const metadata = session?.user.user_metadata;
  const existingPhoneDigits = readMetadataString(metadata, 'phone').replace(/^\+91/, '');

  const [firstName, setFirstName] = useState(readMetadataString(metadata, 'first_name'));
  const [lastName, setLastName] = useState(readMetadataString(metadata, 'last_name'));
  const [phone, setPhone] = useState(existingPhoneDigits);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNameValid = firstName.trim().length > 0 && lastName.trim().length > 0;
  const isPhoneValid = phone.length === 0 || PHONE_PATTERN.test(phone);
  const canSubmit = isNameValid && isPhoneValid && !submitting;

  const handleSave = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    const { error: updateError } = await updateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.length > 0 ? `+91${phone}` : null,
    });
    setSubmitting(false);
    if (updateError) {
      setError(updateError);
      return;
    }
    toast.success('Profile updated.');
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScreenHeader title="Profile" />
      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}>
        <ContentColumn className="gap-4 px-4 py-4">
          <View className="flex-row gap-3">
            <View className="flex-1 gap-1.5">
              <Text className="font-body-bold text-[12px] text-text-muted">First name</Text>
              <TextField
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  setError(null);
                }}
                placeholder="First name"
                accessibilityLabel="First name"
              />
            </View>
            <View className="flex-1 gap-1.5">
              <Text className="font-body-bold text-[12px] text-text-muted">Last name</Text>
              <TextField
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  setError(null);
                }}
                placeholder="Last name"
                accessibilityLabel="Last name"
              />
            </View>
          </View>

          <View className="gap-1.5">
            <Text className="font-body-bold text-[12px] text-text-muted">Email</Text>
            <View className="rounded-sm border border-border bg-surface-2 px-3 py-2.5">
              <Text className="font-body text-[14px] text-text-muted">{session?.user.email}</Text>
            </View>
            <Text className="font-body text-[11px] text-text-faint">Email can&apos;t be changed.</Text>
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
                  onChangeText={(text) => {
                    setPhone(text.replace(/\D/g, '').slice(0, 10));
                    setError(null);
                  }}
                  placeholder={existingPhoneDigits ? undefined : 'Not added'}
                  keyboardType="number-pad"
                  maxLength={10}
                  accessibilityLabel="Mobile number"
                />
              </View>
            </View>
            {phone.length > 0 && !isPhoneValid ? (
              <Text className="font-body text-[12px] text-danger-fg">Enter a valid 10-digit mobile number.</Text>
            ) : null}
          </View>

          {error ? (
            <Banner variant="error">
              <Text className="font-body text-[12.5px] leading-5 text-danger-fg">{error}</Text>
            </Banner>
          ) : null}

          <Pressable
            onPress={handleSave}
            disabled={!canSubmit}
            accessibilityRole="button"
            className={`w-full items-center justify-center rounded-sm px-4 py-3 active:opacity-90 ${
              canSubmit ? 'bg-primary' : 'bg-surface-2'
            }`}>
            <Text className={`font-body-bold text-[14px] ${canSubmit ? 'text-on-primary' : 'text-text-faint'}`}>
              {submitting ? 'Saving…' : 'Save changes'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/change-password')}
            accessibilityRole="button"
            className="items-center rounded-sm border border-border-strong bg-surface px-4 py-2.5 active:bg-surface-2">
            <Text className="font-body-bold text-[13px] text-text">Change password</Text>
          </Pressable>
        </ContentColumn>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
