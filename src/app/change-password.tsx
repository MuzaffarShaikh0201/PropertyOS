import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PasswordInput } from '@/components/form/password-input';
import { isPasswordValid, PasswordRequirements } from '@/components/form/password-requirements';
import { ContentColumn } from '@/components/layout/content-column';
import { ScreenHeader } from '@/components/nav/screen-header';
import { Banner } from '@/components/ui/banner';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';

export default function ChangePasswordScreen() {
  const { updatePassword } = useAuth();
  const toast = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPasswordStrongEnough = isPasswordValid(password);
  const doPasswordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit = isPasswordStrongEnough && doPasswordsMatch && !submitting;

  const handleSave = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    const { error: updateError } = await updatePassword(password);
    setSubmitting(false);
    if (updateError) {
      setError(updateError);
      return;
    }
    toast.success('Password updated.');
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScreenHeader title="Change Password" />
      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}>
        <ContentColumn className="gap-4 px-4 py-4">
          <View className="gap-1.5">
            <Text className="font-body-bold text-[12px] text-text-muted">New password</Text>
            <PasswordInput
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError(null);
              }}
              placeholder="Create a new password"
              accessibilityLabel="New password"
            />
            {password.length > 0 ? <PasswordRequirements password={password} /> : null}
          </View>

          <View className="gap-1.5">
            <Text className="font-body-bold text-[12px] text-text-muted">Confirm new password</Text>
            <PasswordInput
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setError(null);
              }}
              placeholder="Re-enter new password"
              accessibilityLabel="Confirm new password"
            />
            {confirmPassword.length > 0 && !doPasswordsMatch ? (
              <Text className="font-body text-[12px] text-danger-fg">Passwords don&apos;t match.</Text>
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
              {submitting ? 'Updating…' : 'Update password'}
            </Text>
          </Pressable>
        </ContentColumn>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
