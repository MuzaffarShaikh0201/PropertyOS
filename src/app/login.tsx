import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoMark } from '@/components/brand/logo-mark';
import { PasswordInput } from '@/components/form/password-input';
import { TextField } from '@/components/form/text-field';
import { Banner } from '@/components/ui/banner';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { useThemePreference } from '@/lib/theme-preference';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ErrorState = { kind: 'no-account' | 'error'; message: string } | null;

export default function LoginScreen() {
  const { signInWithPassword, checkEmailExists } = useAuth();
  const { colorScheme, setPreference } = useThemePreference();
  const params = useLocalSearchParams<{ email?: string }>();
  const toast = useToast();

  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ErrorState>(null);
  const passwordRef = useRef<TextInput>(null);

  const normalizedEmail = email.trim().toLowerCase();
  const isEmailValid = EMAIL_PATTERN.test(normalizedEmail);
  const canSubmit = isEmailValid && password.length > 0 && !submitting;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await signInWithPassword(normalizedEmail, password);
    if (!signInError) {
      setSubmitting(false);
      toast.success('Logged in successfully.');
      return;
    }

    // Supabase deliberately returns the same "invalid credentials" error for
    // both a wrong password and an email that was never registered. Only
    // report "no account" when we've positively confirmed that — a failed or
    // undeployed check (null) must fall back to the generic message, never
    // assert something we don't actually know.
    const hasAccount = await checkEmailExists(normalizedEmail);
    setSubmitting(false);
    if (hasAccount === false) {
      setError({ kind: 'no-account', message: `No account found for ${normalizedEmail}.` });
      return;
    }
    setError({ kind: 'error', message: 'Incorrect email or password. Try again.' });
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
        <View className="flex-1 items-center justify-center px-6 py-10">
          <View className="w-full max-w-sm items-center gap-7">
            <LogoMark size={64} />

            <View className="items-center">
              <Text className="mb-1.5 font-display-extrabold text-[22px] text-text">PropertyOS</Text>
              <Text className="max-w-[260px] text-center font-body text-[13px] leading-5 text-text-muted">
                Every property you manage — occupancy, agreements, rent and compliance — in one place.
              </Text>
            </View>

            <View className="w-full gap-4">
              <View className="gap-1.5">
                <Text className="font-body-bold text-[12px] text-text-muted">Email address</Text>
                <TextField
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
                  placeholder="Your password"
                  accessibilityLabel="Password"
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                />
              </View>

              {error?.kind === 'no-account' ? (
                <Banner variant="info">
                  <Text className="font-body text-[12.5px] leading-5 text-info-fg">{error.message}</Text>
                  <Pressable
                    onPress={() => router.push({ pathname: '/signup', params: { email: normalizedEmail } })}
                    accessibilityRole="button">
                    <Text className="font-body-bold text-[12.5px] text-info-fg underline">Sign up first →</Text>
                  </Pressable>
                </Banner>
              ) : error ? (
                <Banner variant="error">
                  <Text className="font-body text-[12.5px] leading-5 text-danger-fg">{error.message}</Text>
                </Banner>
              ) : null}

              <Pressable
                onPress={handleLogin}
                disabled={!canSubmit}
                accessibilityRole="button"
                className={`w-full items-center justify-center rounded-sm px-4 py-3 active:opacity-90 ${
                  canSubmit ? 'bg-primary' : 'bg-surface-2'
                }`}>
                <Text className={`font-body-bold text-[14px] ${canSubmit ? 'text-on-primary' : 'text-text-faint'}`}>
                  {submitting ? 'Logging in…' : 'Log in'}
                </Text>
              </Pressable>

              <View className="flex-row items-center justify-center gap-1">
                <Text className="font-body text-[12px] text-text-muted">New to PropertyOS?</Text>
                <Pressable onPress={() => router.push('/signup')} accessibilityRole="button">
                  <Text className="font-body-bold text-[12px] text-primary">Sign up</Text>
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
