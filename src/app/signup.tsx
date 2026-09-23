import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoMark } from '@/components/brand/logo-mark';
import { PasswordInput } from '@/components/form/password-input';
import { isPasswordValid, PasswordRequirements } from '@/components/form/password-requirements';
import { TextField } from '@/components/form/text-field';
import { Banner } from '@/components/ui/banner';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { useThemePreference } from '@/lib/theme-preference';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ErrorState = { kind: 'has-account' | 'error'; message: string } | null;

export default function SignUpScreen() {
  const { signUp, checkEmailExists } = useAuth();
  const { colorScheme, setPreference } = useThemePreference();
  const params = useLocalSearchParams<{ email?: string }>();
  const toast = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ErrorState>(null);
  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const normalizedEmail = email.trim().toLowerCase();
  const isNameValid = firstName.trim().length > 0 && lastName.trim().length > 0;
  const isEmailValid = EMAIL_PATTERN.test(normalizedEmail);
  const isPasswordStrongEnough = isPasswordValid(password);
  const doPasswordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit = isNameValid && isEmailValid && isPasswordStrongEnough && doPasswordsMatch && !submitting;

  const handleSignUp = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);

    // If we can't positively confirm the email is already registered, let
    // Supabase's own signUp call be the authority — it will reject a
    // duplicate on its own rather than us guessing from a failed check.
    const hasAccount = await checkEmailExists(normalizedEmail);
    if (hasAccount === true) {
      setSubmitting(false);
      setError({ kind: 'has-account', message: `You already have an account with ${normalizedEmail}.` });
      return;
    }

    const { error: signUpError } = await signUp({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password,
    });
    setSubmitting(false);
    if (signUpError) {
      setError({ kind: 'error', message: signUpError });
      return;
    }
    toast.success('Account created! Welcome to PropertyOS.');
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <Pressable
        onPress={() => setPreference(colorScheme === 'dark' ? 'light' : 'dark')}
        accessibilityRole="button"
        accessibilityLabel={colorScheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        className="absolute right-4 top-4 z-10 h-8 w-8 items-center justify-center rounded-sm border border-border bg-surface active:bg-surface-2">
        <Ionicons
          name={colorScheme === 'dark' ? 'moon-outline' : 'sunny-outline'}
          size={16}
          color={colorScheme === 'dark' ? '#EDEFEF' : '#1B2020'}
        />
      </Pressable>

      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 items-center px-6 pb-6 pt-16">
          <View className="w-full max-w-sm items-center gap-6">
            <LogoMark size={56} />

            <View className="items-center">
              <Text className="mb-1.5 font-display-extrabold text-[20px] text-text">Create your account</Text>
              <Text className="max-w-[280px] text-center font-body text-[13px] leading-5 text-text-muted">
                Set up PropertyOS to manage your properties, tenants and rent in one place.
              </Text>
            </View>

            <View className="w-full gap-4">
              <View className="flex-row gap-3">
                <View className="flex-1 gap-1.5">
                  <Text className="font-body-bold text-[12px] text-text-muted">First name</Text>
                  <TextField
                    value={firstName}
                    onChangeText={(text) => {
                      setFirstName(text);
                      setError(null);
                    }}
                    placeholder="Asha"
                    accessibilityLabel="First name"
                    returnKeyType="next"
                    onSubmitEditing={() => lastNameRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>
                <View className="flex-1 gap-1.5">
                  <Text className="font-body-bold text-[12px] text-text-muted">Last name</Text>
                  <TextField
                    ref={lastNameRef}
                    value={lastName}
                    onChangeText={(text) => {
                      setLastName(text);
                      setError(null);
                    }}
                    placeholder="Rao"
                    accessibilityLabel="Last name"
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>
              </View>

              <View className="gap-1.5">
                <Text className="font-body-bold text-[12px] text-text-muted">Email address</Text>
                <TextField
                  ref={emailRef}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError(null);
                  }}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Email address"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>

              <View className="gap-1.5">
                <Text className="font-body-bold text-[12px] text-text-muted">Password</Text>
                <PasswordInput
                  ref={passwordRef}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError(null);
                  }}
                  placeholder="Create a password"
                  accessibilityLabel="Password"
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  blurOnSubmit={false}
                />
                {password.length > 0 ? <PasswordRequirements password={password} /> : null}
              </View>

              <View className="gap-1.5">
                <Text className="font-body-bold text-[12px] text-text-muted">Confirm password</Text>
                <PasswordInput
                  ref={confirmPasswordRef}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setError(null);
                  }}
                  placeholder="Re-enter your password"
                  accessibilityLabel="Confirm password"
                  returnKeyType="go"
                  onSubmitEditing={handleSignUp}
                />
                {confirmPassword.length > 0 && !doPasswordsMatch ? (
                  <Text className="font-body text-[12px] text-danger-fg">Passwords don&apos;t match.</Text>
                ) : null}
              </View>

              {error?.kind === 'has-account' ? (
                <Banner variant="info">
                  <Text className="font-body text-[12.5px] leading-5 text-info-fg">{error.message}</Text>
                  <Pressable
                    onPress={() => router.push({ pathname: '/login', params: { email: normalizedEmail } })}
                    accessibilityRole="button">
                    <Text className="font-body-bold text-[12.5px] text-info-fg underline">Log in instead →</Text>
                  </Pressable>
                </Banner>
              ) : error ? (
                <Banner variant="error">
                  <Text className="font-body text-[12.5px] leading-5 text-danger-fg">{error.message}</Text>
                </Banner>
              ) : null}

              <Pressable
                onPress={handleSignUp}
                disabled={!canSubmit}
                accessibilityRole="button"
                className={`w-full items-center justify-center rounded-sm px-4 py-3 active:opacity-90 ${
                  canSubmit ? 'bg-primary' : 'bg-surface-2'
                }`}>
                <Text className={`font-body-bold text-[14px] ${canSubmit ? 'text-on-primary' : 'text-text-faint'}`}>
                  {submitting ? 'Creating account…' : 'Sign up'}
                </Text>
              </Pressable>

              <View className="flex-row items-center justify-center gap-1">
                <Text className="font-body text-[12px] text-text-muted">Already have an account?</Text>
                <Pressable onPress={() => router.push('/login')} accessibilityRole="button">
                  <Text className="font-body-bold text-[12px] text-primary">Log in</Text>
                </Pressable>
              </View>
            </View>

            <Text className="max-w-[280px] text-center font-body text-[11px] leading-4 text-text-muted">
              By continuing you agree to the{' '}
              <Text onPress={() => router.push('/terms')} className="font-body-bold text-primary">
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text onPress={() => router.push('/privacy')} className="font-body-bold text-primary">
                Privacy Policy
              </Text>
              .
            </Text>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
